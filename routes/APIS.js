const router = require("express").Router()

const authRoutes = require("./authRoutes")
const userRoutes = require("./userRoutes")
const codeRoutes = require("./codeRoutes")

const unitRoutes = require("./unitRoutes")
const courseRoutes = require("./courseRoutes")
const lecturesRoutes = require("./lectureRoutes")

const userCourseRoutes = require("./userCourseRoutes")
const statisticsRoutes = require("./statisticsRoutes")


router.use("/sessions", require("./sessionRoutes"))
router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/codes", codeRoutes)
router.use("/coupons", require("./couponRoutes"))
router.use("/notifications", require('./notificationRoutes'))

router.use("/content/units", unitRoutes)
router.use("/content/courses", courseRoutes)
router.use("/content/lectures", lecturesRoutes)
router.use("/attempts", require('./attemptRoutes'))
router.use('/video_statistics', require("./videoStatisticsRoutes"))
router.use("/privacy", require('./privacyRoutes'))

router.use("/subscriptions", userCourseRoutes)
router.use("/statistics", statisticsRoutes)
router.use("/whatsapp", require('./whatsappRoutes'))
router.use("/reports", require('./reportRoutes'))
router.use("/reports_failed", require('./reportFailedRoutes'))

router.use("/groups", require("./groupRoutes"))

router.use('/files', require('./fileRoutes'))

module.exports = router