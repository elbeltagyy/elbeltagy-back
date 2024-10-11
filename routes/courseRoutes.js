const { getCourses, createCourse, getOneCourse, updateCourse, deleteCourse, uploadCourseImg, getCourseLecturesAndCheckForUser, subscribe, getLectureAndCheck, lecturePassed, getExam, createAttempt, linkCourse } = require("../controllers/courseController")
const allowedTo = require("../middleware/allowedTo")
const upload = require("../middleware/storage")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(getCourses)
    .post(upload.single('thumbnail'), uploadCourseImg, createCourse)

router.route("/:id")
    .get(getOneCourse)
    .put(upload.single('thumbnail'), uploadCourseImg, updateCourse)
    .delete(deleteCourse)

router.route("/:id/link")
    .post(linkCourse)
    
// USER LECTURES ROUTES ######
router.route('/:id/lectures') //most important id === index
    .get(verifyToken(true), getCourseLecturesAndCheckForUser)

router.route('/:id/lectures/:lectureId') //most important id === index || lectureId ===_id
    .get(verifyToken(), getLectureAndCheck)

router.route('/:id/lectures/:lectureId/pass') //most important id === course._id || lectureId ===_id
    .post(verifyToken(), lecturePassed)

// EXAMS ROUTES ##########
router.route('/:id/exams/:examId') //most important id === course._id || lectureId ===_id
    .get(verifyToken(), getExam)

router.route('/:id/attempts') //calc mark, most important id === course._id || lectureId ===_id
    .post(verifyToken(), createAttempt)

router.route('/:id/subscribe') //most important id === _id
    .post(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), subscribe)

module.exports = router
