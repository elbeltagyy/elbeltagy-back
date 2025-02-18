const AttemptModel = require("../models/AttemptModel");
const LectureModel = require("../models/LectureModel");
const UserCourseModel = require("../models/UserCourseModel");
const VideoStatisticsModel = require("../models/VideoStatisticsModel");
const { formatDuration, getDateWithTime, getFullDate } = require("./dateFc");
const path = require("path");
const ejs = require('ejs');
const createPdfFromHtml = require("./pdf/htmlPdf");
const { sendWhatsFileFc } = require("../controllers/whatsappController");
const { attemptAllInfo, getExamMark } = require("./getExamInfo");
const { user_roles } = require("./constants/rolesConstants");

const sendUserReport = ({ user, lectureQuery = {}, startDate = null, endDate = null, phoneToSend = null }) => new Promise(async (resolve, reject) => {
    try {

        // Fetch user courses and populate related course data
        const userCourses = await UserCourseModel.find({ user: user._id }).populate("course").lean();

        // Prepare data for PDF generation
        const dataToExport = {
            subscriptions: [],
            unWatchedLectures: [],
            exams: [],
            views: [],
            startDate: startDate && getFullDate(startDate), endDate: endDate && getFullDate(endDate),
            name: user.name, phone: user.phone, familyPhone: user.familyPhone, role: user.role
        };

        // Process each user course
        for (const userCourse of userCourses) {
            const course = userCourse.course;
            const currentIndex = userCourse.currentIndex;

            // Fetch lectures for the course
            let lectures = await LectureModel.find({
                course: { $in: [...course.linkedTo, course._id] },
                isActive: true,
                ...lectureQuery
            }).lean().populate('exam');

            //Get Center Lectures
            if (user.role === user_roles.STUDENT) {
                const LecturesIds = lectures.map(lecture => lecture._id)
                const centerLectures = await LectureModel.find({
                    _id: { $nin: LecturesIds },
                    isActive: true, isCenter: true,
                    ...lectureQuery
                }).lean().populate('exam');
                lectures.push(...centerLectures)
            }


            // Fetch views and attempts for the user
            const [views, attempts] = await Promise.all([
                VideoStatisticsModel.find({ user: user._id, ...lectureQuery }).populate('lecture').lean(),
                AttemptModel.find({ user: user._id }).lean(),
            ]);


            const attemptMap = new Map(
                attempts.map((attempt) => [attempt.exam.toString(), attempt])
            );

            const exams = []
            // Add index to lectures
            lectures.forEach((lecture, index) => {
                lecture.index = index + 1;
                if (lecture.exam) {
                    const itsAttempt = attemptMap.get(lecture.exam._id.toString())
                    //name - attempt date - mark - exam mark - degree
                    let exam = {}
                    exam.name = lecture.name
                    exam.total = getExamMark(lecture.exam)

                    if (itsAttempt) {
                        exam.attemptDate = getDateWithTime(itsAttempt.createdAt)
                        const [userMark, total, assessment] = attemptAllInfo(lecture.exam, itsAttempt.chosenOptions)
                        exam.mark = userMark
                        exam.rating = assessment.rating
                        exam.class = assessment.ratingColor === 1 ? 'green' : assessment.ratingColor === 2 ? 'yellow' : 'red'
                    } else {
                        exam.class = 'red'
                        exam.attemptDate = 'لم يتم حله'
                        exam.rating = 'لم يتم حله'
                    }
                    exams.push(exam)
                }
            });


            //Handel Views
            views.forEach(view => {
                view.name = view.lecture?.name
                view.watchedTime = formatDuration(view.watchedTime, true)
                view.createdAt = getDateWithTime(view.createdAt)
            })


            // Find un-watched lectures
            const unWatchedLectures = lectures.filter(
                (lecture, index) =>
                    !views.some((view) => view.lecture._id.toString() === lecture._id.toString()) &&
                    lecture.index > currentIndex &&
                    lecture.video
            );

            // Update dataToExport
            course.createdAt = getDateWithTime(userCourse.createdAt)

            dataToExport.exams.push(...exams);
            dataToExport.unWatchedLectures.push(...unWatchedLectures);
            dataToExport.views.push(...views)
            dataToExport.subscriptions.push(course)
        }

        // Render EJS template to HTML
        const templatePath = path.join(__dirname, '../views', 'template.ejs');
        const html = await ejs.renderFile(templatePath, dataToExport);

        // Generate PDF using Puppeteer
        const pdfName = 'تقرير الطالب' + '-' + user.userName + '.pdf'
        // const pdfPath = path.join(__dirname, '..', 'storage', pdfName);
        // let pdfBuffer = await puppeteerPdf(html);
        let pdfBuffer = await createPdfFromHtml(html);

        //send to Whatsapp
        let numberToSend = phoneToSend || user.familyPhone
        await sendWhatsFileFc(numberToSend, pdfBuffer, true, pdfName)
        // console.log('submitted to ==>', user.name, '  ', user.familyPhone)
        resolve(true)
    } catch (error) {
        reject(error)
    }
})

module.exports = sendUserReport