const expressAsyncHandler = require("express-async-handler");
const createPdf = require("../tools/pdf/createPdf");
const pdfMake = require("../tools/pdf/pdfMake");
const puppeteerPdf = require("../tools/pdf/pupetteerPdf");
const UserModel = require("../models/UserModel");
const UserCourseModel = require("../models/UserCourseModel");
const LectureModel = require("../models/LectureModel");
const VideoStatisticsModel = require("../models/VideoStatisticsModel");
const AttemptModel = require("../models/AttemptModel");
const fs = require('fs');
const path = require("path");
const ejs = require('ejs');
const { getDateWithTime, formatDuration, getFullDate } = require("../tools/dateFc");
const getAttemptMark = require("../tools/getAttemptMark");
const { attemptAllInfo, getExamMark } = require("../tools/getExamInfo");
const { user_roles } = require("../tools/constants/rolesConstants");
const { sendWhatsFileFc } = require("./whatsappController");
const { makeMatch } = require("../tools/makeMatch");
const { userParams } = require("./userController");
const ReportModel = require("../models/ReportModel");
const ReportFailedModel = require("../models/ReportFailedModel");
const { getAll, deleteOne, updateOne } = require("./factoryHandler");

// Use dynamic import() to load p-limit
const pLimit = async () => {
    const module = await import('p-limit');
    return module.default;
};

const sendReports = expressAsyncHandler(async (req, res, next) => {
    const limit = (await pLimit())(5); // Limit to 5 concurrent operations

    const startDate = req.body.startDate || false
    const endDate = req.body.endDate || false

    const isExcluded = req.body.isExcluded
    const excludedUsers = req.body.excludedUsers || []


    const isNotCreateNewReport = req.body.isNotCreateNewReport || false
    const prevReport = req.body.report

    // Handel Lecture Query
    const lectureQuery = {}
    if (startDate) lectureQuery.createdAt = { ...lectureQuery.createdAt, $gte: new Date(startDate) };
    if (endDate) lectureQuery.createdAt = { ...lectureQuery.createdAt, $lt: new Date(endDate) }

    let match = {}
    match.role = { $in: [user_roles.STUDENT, user_roles.ONLINE] }

    makeMatch(match, userParams(req.body))

    if (excludedUsers?.length > 0 && isExcluded) {
        match = { ...match, _id: { $nin: excludedUsers } }
    }

    if (!isExcluded) {
        match = { _id: { $in: excludedUsers } } //...match,
    }

    // Fetch users
    const users = await UserModel.find(match).lean();

    let failedReport = {
        users: [],
        reportErrors: []
    }
    // Process each user in parallel
    await Promise.all(users.map(user => limit(async () => {
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
            let pdfBuffer = await puppeteerPdf(html);

            //send to Whatsapp
            await sendWhatsFileFc(user.familyPhone, pdfBuffer, true, pdfName)
            // console.log('submitted to ==>', user.name, '  ', user.familyPhone)
        } catch (error) {
            failedReport.users.push(user._id)
            failedReport.reportErrors.push(error?.message || 'unknown')
        }
    })));

    if (prevReport) {
        await ReportFailedModel.findOneAndUpdate(
            { report: prevReport }, // Find the document by report ID
            { $pull: { users: { $in: users.map(user => user._id) } } }, // Remove users with matching IDs
            { new: true } // Return the updated document
        )
    }

    if (!isNotCreateNewReport) {
        const createdReport = await ReportModel.create(req.body)

        if (failedReport.users.length > 0) {
            //save it
            await ReportFailedModel.create({
                ...failedReport,
                report: createdReport._id,
            })
        }
    }

    res.json({ message: 'تم ارسال عدد' + " " + (users.length - failedReport.users.length) + ' و فشل ' + failedReport.users.length })
})

const reportParams = (query) => {
    return [
        { key: "title", value: query.title },
        { key: "description", value: query.description },
    ]
}


const getReports = getAll(ReportModel, 'reports', reportParams, true)
const updateReport = updateOne(ReportModel)

const deleteReport = deleteOne(ReportModel)
module.exports = { sendReports, getReports, updateReport, deleteReport }