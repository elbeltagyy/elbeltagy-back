const { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount, getSubscriptionsCount, getNotificationsCount, getAttemptsCount } = require("../controllers/statisticsController")
const { getViewsCount, getByUsersCount } = require("../controllers/viewsController")
const allowedTo = require("../middleware/allowedTo")
const { secureGetAll } = require("../middleware/secureMiddleware")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/users")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getUsersCount)

router.route("/units")
    .get(getUnitsCount)

router.route("/courses")
    .get(getCoursesCount)

router.route("/lectures")
    .get(getLecturesCount)

router.route("/subscriptions")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getSubscriptionsCount)

router.route("/views")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getViewsCount)
router.route("/views_users")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getByUsersCount)

router.route("/notifications")
    .get(verifyToken(), secureGetAll(), getNotificationsCount)

router.route("/attempts")
    .get(verifyToken(), secureGetAll(), getAttemptsCount)
module.exports = router
