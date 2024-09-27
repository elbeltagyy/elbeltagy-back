const { getAllUsersCourses, subscribe, getUserCourses, getOneUserCourse } = require("../controllers/userCourseController")
const verifyToken = require("../middleware/verifyToken")

const router = require("express").Router()

router.route("/courses")
    .get(verifyToken, getUserCourses)

router.route("/courses/:courseId")
    .get(verifyToken, getOneUserCourse)

router.route("/users")
    .get(getAllUsersCourses)

router.route("/subscribe")
    .post(verifyToken, subscribe)


module.exports = router
