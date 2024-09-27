const { getLectures, getOneLecture, createLecture, deleteLecture, updateLecture } = require("../controllers/lectureController")
const { getVideo, getAllVideos } = require("../controllers/videoController")
const upload = require("../middleware/storage")
const verifyToken = require("../middleware/verifyToken")

const router = require("express").Router()

router.route("/")
    .get(getLectures)
    .post(upload.fields([{ name: "video" }, { name: "thumbnail" }]), createLecture)

router.route("/:id")
    .get(getOneLecture)
    .put(upload.fields([{ name: "video" }, { name: "thumbnail" }]), updateLecture)
    .delete(deleteLecture)

router.route("/:id/secure_video")
    .post(verifyToken, getVideo)

router.route("/:id/videos")
    .get(getAllVideos)
module.exports = router