import { filterById } from '../controllers/factoryHandler.js';
import { userParams, getUsers } from '../controllers/userController.js';
import { getCourseSubscriptions, addSubscription, removeSubscription, updateSubscription } from '../controllers/userCourseController.js';
import allowedTo from '../middleware/allowedTo.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import verifyToken from '../middleware/verifyToken.js';
import CourseModel from '../models/CourseModel.js';
import UserModel from '../models/UserModel.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

const courseParams = (query) => {
    return [
        { key: "name", value: query.courseName },
    ]
}

router.route("/courses")
    .get(verifyToken(), filterById(UserModel, userParams, 'user'),
        filterById(CourseModel, courseParams, 'course'), secureGetAll(), getCourseSubscriptions) //verifyToken(),
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addSubscription)

router.route("/courses/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateSubscription)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeSubscription)

export default router;
