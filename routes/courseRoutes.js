const { getCourses, createCourse, getOneCourse, updateCourse, deleteCourse, uploadCourseImg, getCourseLecturesAndCheckForUser, subscribe, getLectureAndCheck, lecturePassed, getExam, createAttempt, linkCourse, checkDeleteCourse } = require("../controllers/courseController")
const { upload } = require("../middleware/storage")

const { user_roles } = require("../tools/constants/rolesConstants")
const verifyToken = require("../middleware/verifyToken")
const allowedTo = require("../middleware/allowedTo")

const router = require("express").Router()

router.route("/")
    .get(getCourses)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('thumbnail'), uploadCourseImg, createCourse)

router.route("/:id")
    .get(getOneCourse)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('thumbnail'), uploadCourseImg, updateCourse)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), checkDeleteCourse, deleteCourse)

router.route("/:id/link")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), linkCourse)

// USER LECTURES ROUTES ######
router.route('/:id/lectures') //most important id === index
    .get(verifyToken(true), getCourseLecturesAndCheckForUser)

router.route('/:id/lectures/:lectureId') //most important id === index || lectureId ===_id
    .get(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), getLectureAndCheck)

router.route('/:id/lectures/:lectureId/pass') //most important id === course._id || lectureId ===_id
    .post(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), lecturePassed)

// EXAMS ROUTES ##########
router.route('/:id/exams/:examId') //most important id === course._id || lectureId ===_id
    .get(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), getExam)

router.route('/:id/attempts') //calc mark, most important id === course._id || lectureId ===_id
    .post(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), createAttempt)

router.route('/:id/subscribe') //most important id === _id
    .post(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), subscribe)

module.exports = router
