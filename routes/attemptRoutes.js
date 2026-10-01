import { getAttempts, getOneAttempt, getUserInfo, deleteOneAttempt, startAttempt } from '../controllers/attemptController.js';

import UserModel from '../models/UserModel.js';
import { filterById } from '../controllers/factoryHandler.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import verifyToken from '../middleware/verifyToken.js';
import allowedTo from '../middleware/allowedTo.js';
import ExamModel from '../models/ExamModel.js';
import CourseModel from '../models/CourseModel.js';

import express from 'express';
const router = express.Router();

const userParams = (query) => {
    return [
        { key: 'name', value: query.name },
        { key: 'userName', value: query.userName },
        { key: 'phone', value: query.phone },
        { key: 'familyPhone', value: query.familyPhone },
    ]
}

const examParams = (query) => {
    return [
        { key: 'name', value: query.examName },
    ]
}
const courseParams = (query) => {
    return [
        { key: 'name', value: query.courseName },
    ]
}

router.route("/")
    .get(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        filterById(UserModel, userParams, 'user'),
        filterById(ExamModel, examParams, 'exam'),
        filterById(CourseModel, courseParams, 'course'),
        getAttempts
    )
    .post(verifyToken(), startAttempt)

router.route("/users/:id")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), getUserInfo)

router.route("/:id")
    .get(verifyToken(), getOneAttempt)
    .delete(verifyToken(), deleteOneAttempt)

export default router;