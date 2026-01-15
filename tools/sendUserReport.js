const AttemptModel = require("../models/AttemptModel");
const LectureModel = require("../models/LectureModel");
const UserCourseModel = require("../models/UserCourseModel");
const VideoStatisticsModel = require("../models/VideoStatisticsModel");
const { formatDuration, getDateWithTime, getFullDate } = require("./dateFc");
const path = require("path");
const ejs = require('ejs');
const { sendWhatsFileFc } = require("../controllers/whatsappController");
const { attemptAllInfo, getExamMark } = require("./getExamInfo");
const { user_roles } = require("./constants/rolesConstants");
const puppeteerPdf = require("./pdf/pupetteerPdf");
const createPdfFromHtml = require("./pdf/htmlPdf");

const sendUserReport = ({ user, lectureQuery = {}, startDate = null, endDate = null, phoneToSend = null, course }) => new Promise(async (resolve, reject) => {
    try {
        // Fetch user courses and populate related course data
        const usQuery = { user: user._id }
        if(course !== 'undefined'&& course) usQuery.course = course
        const userCourses = await UserCourseModel.find(usQuery).populate("course").lean();

        const coursesIds = userCourses.map(uc => uc.course._id)
    
        lectureQuery.isActive = true;

        if (coursesIds.length) {
        lectureQuery.course = { $in: coursesIds };
        } else {
        lectureQuery.course = { $exists: false }; // prevent fetching everything
        }

        let lectures = await LectureModel.find(lectureQuery).lean().populate('exam');

        const videoLectureIds = lectures.filter(l => l.video).map(l => l._id);
        const examIds = lectures.filter(l => l.exam).map(l => l.exam._id);

        // Fetch views and attempts for the user
        const [views, attempts] = await Promise.all([
            VideoStatisticsModel.find({ user: user._id, lecture: { $in: videoLectureIds } }).populate('lecture').lean(),
            AttemptModel.find({ user: user._id, exam: { $in: examIds } }).populate('answers').lean()
        ]);

        const attemptMap = new Map(
            attempts.map((attempt) => [attempt.exam.toString(), attempt])
        );

        const exams = lectures.filter(l => l.exam).map((lecture) => {
                const itsAttempt = attemptMap.get(lecture.exam._id.toString())
                //name - attempt date - mark - exam mark - degree
                let exam = {}
                exam.name = lecture.name
                exam.total = getExamMark(lecture.exam)

                if (itsAttempt) { //Passed
                    exam.attemptDate = getDateWithTime(itsAttempt.createdAt)
                    
                    const [userMark, total, assessment] = attemptAllInfo(lecture.exam, itsAttempt.answers)
                    exam.mark = userMark
                    exam.rating = assessment.rating
                    exam.class = assessment.ratingColor === 1 ? 'green' : assessment.ratingColor === 2 ? 'yellow' : 'yellow'
                } else {
                    exam.class = 'red' //Not Passed
                    exam.attemptDate = 'لم يتم حله'
                    exam.rating = 'لم يتم حله'
                }
                return exam
        });

        //Handel Views
        views.forEach(view => {
            view.name = view.lecture?.name
            view.watchedTime = formatDuration(view.watchedTime, true)
            view.createdAt = getDateWithTime(view.createdAt)
        })

        // Find un-watched lectures
        const unWatchedLectures = lectures.filter(l => l.video).filter(
            (lecture) =>
                !views.some((view) => view.lecture._id.toString() === lecture._id.toString()) 
                // lecture.video
        );

        // Prepare data for PDF generation
        const dataToExport = {
            subscriptions: [],
            unWatchedLectures,
            exams,
            views,
            startDate: startDate && getFullDate(startDate), endDate: endDate && getFullDate(endDate),
            name: user.name, phone: user.phone, familyPhone: user.familyPhone, role: user.role
        };

        if (userCourses.length > 0) {
            for (const userCourse of userCourses) {
                const course = userCourse.course;
                course.createdAt = getDateWithTime(userCourse.createdAt)
                dataToExport.subscriptions.push(course)
            }
        }

        // Render EJS template to HTML
        const templatePath = path.join(__dirname, '../views', 'template.ejs');
        const html = await ejs.renderFile(templatePath, dataToExport);

        // Generate PDF using Puppeteer
        const pdfName = 'تقرير الطالب' + '-' + user.userName + '.pdf'
        // const pdfPath = path.join(__dirname, '..', 'storage', pdfName);
        let pdfBuffer = await puppeteerPdf(html);
        //  await createPdfFromHtml(html);

        //send to Whatsapp
        let numberToSend = phoneToSend || user.familyPhone
        await sendWhatsFileFc(numberToSend, pdfBuffer, true, pdfName)
        // console.log('submitted to ==>', user.name, '  ', user.familyPhone)
        resolve(true)
    } catch (error) {
        console.log('error found in creating report ==>', error)
        reject(error)
    }
})

module.exports = sendUserReport