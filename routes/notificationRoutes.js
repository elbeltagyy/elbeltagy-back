const { getNotifications, createNotification, updateNotification, deleteNotification, makeSeen } = require("../controllers/notificationController")

const router = require("express").Router()

router.route("/")
    .get(getNotifications)
    .post(createNotification)

router.route("/seen/:userId")
    .get(makeSeen)

router.route("/:id")
    .put(updateNotification)
    .delete(deleteNotification)

module.exports = router