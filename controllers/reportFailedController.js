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
const { getDateWithTime, formatDuration } = require("../tools/dateFc");
const getAttemptMark = require("../tools/getAttemptMark");
const { attemptAllInfo, getExamMark } = require("../tools/getExamInfo");
const { user_roles } = require("../tools/constants/rolesConstants");
const { makeMatch } = require("../tools/makeMatch");
const { userParams } = require("./userController");
const ReportModel = require("../models/ReportModel");
const ReportFailedModel = require("../models/ReportFailedModel");
const { getAll, deleteOne, updateOne } = require("./factoryHandler");


const getFailedReportUsers = expressAsyncHandler(async (req, res, next) => {
    //pagination
    const query = req.query
    const limit = query.limit || 10000
    const page = query.page || 1
    const skip = (page - 1) * limit

    const { id } = req.params;
    //Matching
    const match = {}
    if (userParams.length > 0) {
        makeMatch(match, userParams(query))
    }

    
    const reportFailed = await ReportFailedModel.findOne({ report: id })
        .populate({
            path: 'users',
            match,
            options: {
                skip: skip,
                limit: limit,
            }
        })

    res.status(200).json({ values: { users: reportFailed?.users || [], count: reportFailed?.users.length || 0 } })
})

module.exports = { getFailedReportUsers }