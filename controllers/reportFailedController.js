import expressAsyncHandler from 'express-async-handler';
import createPdf from '../tools/pdf/createPdf.js';
import pdfMake from '../tools/pdf/pdfMake.js';
import puppeteerPdf from '../tools/pdf/pupetteerPdf.js';
import UserModel from '../models/UserModel.js';
import UserCourseModel from '../models/UserCourseModel.js';
import LectureModel from '../models/LectureModel.js';
import VideoStatisticsModel from '../models/VideoStatisticsModel.js';
import AttemptModel from '../models/AttemptModel.js';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { getDateWithTime, formatDuration } from '../tools/dateFc.js';
import getAttemptMark from '../tools/getAttemptMark.js';
import { attemptAllInfo, getExamMark } from '../tools/getExamInfo.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import { userParams } from './userController.js';
import ReportModel from '../models/ReportModel.js';
import ReportFailedModel from '../models/ReportFailedModel.js';
import { getAll, deleteOne, updateOne } from './factoryHandler.js';
import parseFilters from '../tools/fcs/matchGPT.js';


const getFailedReportUsers = expressAsyncHandler(async (req, res, next) => {
    //pagination
    const query = req.query
    const limit = query.limit || 10000
    const page = query.page || 1
    const skip = (page - 1) * limit

    const { id } = req.params;
    //Matching
    const match =  parseFilters(userParams(query))
    
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

export { getFailedReportUsers };