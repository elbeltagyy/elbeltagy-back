const expressAsyncHandler = require("express-async-handler");
// const createPdf = require("../tools/pdf/createPdf");
// const pdfMake = require("../tools/pdf/pdfMake");
// const puppeteerPdf = require("../tools/pdf/pupetteerPdf");
// const createPdfFromHtml = require("../tools/pdf/htmlPdf");

const UserModel = require("../models/UserModel");

const ReportModel = require("../models/ReportModel");
const ReportFailedModel = require("../models/ReportFailedModel");
const { getAll, deleteOne, updateOne } = require("./factoryHandler");
const selectUsers = require("../tools/fcs/selectUsers");
const senderByMethod = require("../tools/fcs/senderByMethod");
const { senderConstants } = require("../tools/constants/sendersConstants");

// Use dynamic import() to load p-limit
const pLimit = async () => {
    const module = await import('p-limit');
    return module.default;
};

const sendReports = expressAsyncHandler(async (req, res, next) => {
    const limit = (await pLimit())(10); // Limit to 5 concurrent operations

    const startDate = req.body.startDate || false
    const endDate = req.body.endDate || false
    const method = req.body.method || senderConstants.REPORT_FAMILY_WHATSAPP

    const isNotCreateNewReport = req.body.isNotCreateNewReport || false
    const prevReport = req.body.report

    // Handel Lecture Query
    const lectureQuery = {}
    if (startDate) lectureQuery.createdAt = { ...lectureQuery.createdAt, $gte: new Date(startDate) };
    if (endDate) lectureQuery.createdAt = { ...lectureQuery.createdAt, $lt: new Date(endDate) }

    // let match = parseFilters(userParams({ ...req.body, courses: req.body.course })) 
    let match = selectUsers(req.body)
    // console.log('match ==>', match)
    // Fetch users
    const users = await UserModel.find(match).lean();

    let failedReport = {
        users: [],
        reportErrors: []
    }
    // res.json({ message: 'تم ارسال عدد' + " " + (users.length - failedReport.users.length) + ' و فشل ' + failedReport.users.length })
    // return 
    // Process each user in parallel
    await Promise.all(users.map(user => limit(async () => {
        try {
            const subject = req.body.title
            const message = req.body.description
            // const caption = `*${subject}*\n${message}`

            // await sendUserReport({ user, lectureQuery, course: req.body.course, startDate, endDate, caption })
            await senderByMethod({ user, method, subject, message, lectureQuery, course: req.body.course, startDate, endDate, })
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