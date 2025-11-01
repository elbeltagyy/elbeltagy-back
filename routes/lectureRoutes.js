const LectureModel = require("../models/LectureModel")
const { insertOne, deleteFromBody } = require("../controllers/factoryHandler")
const { upload } = require("../middleware/storage")
const { getLectures, getOneLecture, createLecture, deleteLecture, updateLecture, createExam, updateOneExam, getLectureForCenter, handelUpdateLecture, getLecturesForAdmin, addToLectures, removeFromLectures, protectGetLectures, pushLectures, changeLectureIndex } = require("../controllers/lectureController")

const { user_roles } = require("../tools/constants/rolesConstants")
const verifyToken = require("../middleware/verifyToken")
const allowedTo = require("../middleware/allowedTo")

const router = require("express").Router()

router.route('/all')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getLecturesForAdmin)

router.route("/")
    .get(verifyToken(), protectGetLectures, getLectures)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), createLecture, insertOne(LectureModel, true, 'course'))

router.route("/center/:id")
    .get(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), getLectureForCenter) //allowed to center

router.route('/push')
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), pushLectures)

router.route('/array')
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addToLectures)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeFromLectures)

router.route("/:id")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getOneLecture)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), deleteFromBody(['course']), updateLecture)
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), handelUpdateLecture)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteLecture)

router.route("/:id/reorder")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), changeLectureIndex)

module.exports = router
