const { getFailedReportUsers } = require("../controllers/reportFailedController")

const router = require("express").Router()

router.route("/:id")
    .get(getFailedReportUsers)

module.exports = router