const router = require("express").Router()

const { getNotifications, createNotification, updateNotification, deleteNotification, makeSeen, handelNotification, sendNotificationsToMany } = require("../controllers/notificationController")

const { user_roles } = require("../tools/constants/rolesConstants")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { secureGetAll } = require("../middleware/secureMiddleware")


router.route("/")
    .get(verifyToken(), secureGetAll(), getNotifications)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), handelNotification, createNotification)

router.route("/seen/:userId")
    .get(verifyToken(), makeSeen)

router.route("/many")
    .post(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR),
        sendNotificationsToMany)

router.route("/one/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), updateNotification)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), deleteNotification)

module.exports = router