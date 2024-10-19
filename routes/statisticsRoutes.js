const { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount, getSubscriptionsCount, getNotificationsCount } = require("../controllers/statisticsController")

const router = require("express").Router()

router.route("/users")
    .get(getUsersCount)

router.route("/units")
    .get(getUnitsCount)

router.route("/courses")
    .get(getCoursesCount)

router.route("/lectures")
    .get(getLecturesCount)

router.route("/subscriptions")
    .get(getSubscriptionsCount)

router.route("/notifications")
    .get(getNotificationsCount)

module.exports = router
