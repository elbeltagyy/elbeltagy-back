const { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount, getSubscriptionsCount, getNotificationsCount, getAttemptsCount, getTagsCount, getQuestionsCount, getAnswersCount } = require("../controllers/statisticsController")
const { getViewsCount, getByUsersCount } = require("../controllers/viewsController")
const { analysisMonthly } = require("../controllers/factoryHandler.js")
const allowedTo = require("../middleware/allowedTo")
const { secureGetAll } = require("../middleware/secureMiddleware")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")
const UserModel = require("../models/UserModel.js")
const UserCourseModel = require("../models/UserCourseModel.js")
const { userCoursesParams } = require("../controllers/userCourseController.js")

const router = require("express").Router()

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

module.exports = router
