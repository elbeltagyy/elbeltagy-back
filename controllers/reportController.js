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
const { makeMatch } = require("../tools/makeMatch");
const { userParams } = require("./userController");
const ReportModel = require("../models/ReportModel");
const ReportFailedModel = require("../models/ReportFailedModel");
const { getAll, deleteOne, updateOne } = require("./factoryHandler");
const createPdfFromHtml = require("../tools/pdf/htmlPdf");
const sendUserReport = require("../tools/sendUserReport");

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

    makeMatch(match, userParams({ ...req.body, courses: req.body.course })) //*_*

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
            await sendUserReport({ user, lectureQuery, course: req.body.course, startDate, endDate })
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
        const createdReport = await ReportModel.create({ ...req.body, numbers: (users.length - failedReport.users.length) })

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
        { key: "course", value: query.course, operator: "equal" },
        { key: "lecture", value: query.lecture, operator: "equal" },
    ]
}

const populate = [
    {
        path: 'course',
        select: 'name',
    }
];

const getReports = getAll(ReportModel, 'reports', reportParams, true, populate)
const updateReport = updateOne(ReportModel)

const deleteReport = deleteOne(ReportModel)
module.exports = { sendReports, getReports, updateReport, deleteReport }