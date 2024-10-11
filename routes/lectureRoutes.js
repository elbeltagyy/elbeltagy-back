const expressAsyncHandler = require("express-async-handler")
const { insertOne } = require("../controllers/factoryHandler")
const { getLectures, getOneLecture, createLecture, deleteLecture, updateLecture, createExam } = require("../controllers/lectureController")
const { getVideo, getAllVideos } = require("../controllers/videoController")
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

router.route("/:id")
    .get(getOneLecture)
    .put(upload.single('video'), updateLecture)
    .delete(deleteLecture)

module.exports = router
