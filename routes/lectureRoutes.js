const LectureModel = require("../models/LectureModel")
const { insertOne } = require("../controllers/factoryHandler")
const { upload } = require("../middleware/storage")
const { getLectures, getOneLecture, createLecture, deleteLecture, updateLecture, createExam, updateOneExam, getLectureForCenter, handelUpdateLecture, getLecturesForAdmin } = require("../controllers/lectureController")

const { user_roles } = require("../tools/constants/rolesConstants")
const verifyToken = require("../middleware/verifyToken")
const allowedTo = require("../middleware/allowedTo")

const router = require("express").Router()

router.route('/all')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getLecturesForAdmin)

router.route("/")
    .get(getLectures)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), createLecture, insertOne(LectureModel, true))

router.route("/exams")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createExam, insertOne(LectureModel, true))
router.route("/exams/:id") //lectureId
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateOneExam)

router.route("/center/:id")
    .get(verifyToken(), allowedTo(user_roles.STUDENT), getLectureForCenter) //allowed to center

router.route("/:id")
    .get(getOneLecture)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), updateLecture)
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), handelUpdateLecture)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteLecture)

module.exports = router
