import expressAsyncHandler from 'express-async-handler';
import CourseModel from '../models/CourseModel.js';
import LectureModel from '../models/LectureModel.js';
import UnitModel from '../models/UnitModel.js';
import UserCourseModel from '../models/UserCourseModel.js';
import UserModel from '../models/UserModel.js';
import { coursesParams } from './courseController.js';
import { getDocCount } from './factoryHandler.js';
import { lectureParams } from './lectureController.js';
import { unitParams } from './unitController.js';
import { userParams } from './userController.js';
import { userCoursesParams } from './userCourseController.js';
import { SUCCESS } from '../tools/statusTexts.js';
import NotificationModel from '../models/NotificationModel.js';

import { notificationParams } from './notificationController.js';
import { attemptParams } from './attemptController.js';
import AttemptModel from '../models/AttemptModel.js';
import TagModel from '../models/TagModel.js';
import { tagParams } from './tagController.js';
import QuestionModel from '../models/QuestionModel.js';
import { questionParams } from './questionController.js';
import AnswerModel from '../models/AnswerModel.js';
import { answerParams } from './answerController.js';
import parseFilters from '../tools/fcs/matchGPT.js';


const getUsersCount = getDocCount(UserModel, userParams)

const getUnitsCount = getDocCount(UnitModel, unitParams)

const getCoursesCount = getDocCount(CourseModel, coursesParams)

// const getLecturesCount = getDocCount(LectureModel, lectureParams)
const getLecturesCount = expressAsyncHandler(async (req, res, next) => {
    const courseId = req.query.course

    const course = await CourseModel.findById(courseId).lean().select("linkedTo")
    let ids = []


    const query = req.query

    // search && filter
    const match = parseFilters(lectureParams(query))
    // console.log(match)
    if (course) {
        ids = [...course.linkedTo, course._id]
        match.course = { $in: ids }
    }

    const count = await LectureModel.countDocuments(match)
    return res.status(200).json({ status: SUCCESS, values: { count } })

})

const getSubscriptionsCount = getDocCount(UserCourseModel, userCoursesParams)

const getNotificationsCount = getDocCount(NotificationModel, notificationParams)

const getAttemptsCount = getDocCount(AttemptModel, attemptParams)

const getTagsCount = getDocCount(TagModel, tagParams)

const getQuestionsCount = getDocCount(QuestionModel, questionParams)

const getAnswersCount = getDocCount(AnswerModel, answerParams)

export { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount, getSubscriptionsCount, getNotificationsCount, getAttemptsCount, getTagsCount, getQuestionsCount, getAnswersCount };