const { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount } = require("../controllers/statisticsController")

const router = require("express").Router()

router.route("/users")
    .get(getUsersCount)

router.route("/units")
    .get(getUnitsCount)

router.route("/courses")
    .get(getCoursesCount)

    router.route("/lectures")
    .get(getLecturesCount)

    
module.exports = router
