import { filterById } from '../controllers/factoryHandler.js';
import { countStatistics } from '../controllers/videoController.js';
import { getViews, updateView, removeView, viewParams, getByUserViews } from '../controllers/viewsController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import CourseModel from '../models/CourseModel.js';
import LectureModel from '../models/LectureModel.js';
import UserModel from '../models/UserModel.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import express from 'express';
const router = express.Router();

const courseParams = (query) => {
    return [
        { key: "name", value: query.courseName },
        { key: "price", value: query.price },
    ]
}

const lectureParams = (query) => {
    return [
        { key: "name", value: query.lectureName },
        { key: "duration", value: query.duration },
    ]
}

const userParams = (query) => {
    return [
        { key: 'name', value: query.name },
        { key: 'userName', value: query.userName },
        { key: 'phone', value: query.phone },
        { key: 'familyPhone', value: query.familyPhone },
        { key: 'name', value: query.name },
    ]
}
router.route("/")
    .get(
        verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        filterById(UserModel, userParams, 'user'),
        filterById(CourseModel, courseParams, 'course'),
        filterById(LectureModel, lectureParams, 'lecture'),
        getViews)

router.route("/users")
    .get(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        getByUserViews)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateView)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeView)

router.route("/on")
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), countStatistics)

export default router;