import { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount, getSubscriptionsCount, getNotificationsCount, getAttemptsCount, getTagsCount, getQuestionsCount, getAnswersCount } from '../controllers/statisticsController.js';
import { getViewsCount, getByUsersCount } from '../controllers/viewsController.js';
import { analysisMonthly } from '../controllers/factoryHandler.js';
import allowedTo from '../middleware/allowedTo.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import UserModel from '../models/UserModel.js';
import UserCourseModel from '../models/UserCourseModel.js';
import { userCoursesParams } from '../controllers/userCourseController.js';

import express from 'express';
const router = express.Router();

router.route("/users")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getUsersCount)

router.route("/users/analysis")
    .get(analysisMonthly(UserModel)) //verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),

router.route("/units")
    .get(getUnitsCount)

router.route("/courses")
    .get(getCoursesCount)

router.route("/lectures")
    .get(getLecturesCount)

router.route("/subscriptions")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getSubscriptionsCount)

router.route("/subscriptions/analysis")
    .get(analysisMonthly(UserCourseModel, userCoursesParams))


router.route("/views")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getViewsCount)
router.route("/views_users")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getByUsersCount)

router.route("/notifications")
    .get(verifyToken(), secureGetAll(), getNotificationsCount)

router.route("/attempts")
    .get(verifyToken(), secureGetAll(), getAttemptsCount)

router.route("/tags")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getTagsCount)

router.route("/questions")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getQuestionsCount)

router.route("/answers")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getAnswersCount)

export default router;
