const expressAsyncHandler = require("express-async-handler")
const { insertOne, updateOne } = require("../controllers/factoryHandler")
const { getLectures, getOneLecture, createLecture, deleteLecture, updateLecture, createExam, updateOneExam, getLectureForCenter, handelUpdateLecture } = require("../controllers/lectureController")
const upload = require("../middleware/storage")
const verifyToken = require("../middleware/verifyToken")
const LectureModel = require("../models/LectureModel")
const fileTypes = require("../tools/constants/fileTypes")

const router = require("express").Router()
router.route("/")
    .get(getLectures)
    .post(upload.single('video'), createLecture, insertOne(LectureModel, true))

router.route("/exams")
    .post(createExam, insertOne(LectureModel, true))
router.route("/exams/:id") //lectureId
    .put(updateOneExam)

router.route("/center/:id")
    .get(verifyToken(), getLectureForCenter) //allowed to center

router.route("/:id")
    .get(getOneLecture)
    .put(upload.single('video'), updateLecture)
    .patch(upload.single('video'), handelUpdateLecture)
    .delete(deleteLecture)

module.exports = router
