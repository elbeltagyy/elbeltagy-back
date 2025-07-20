const { createExam, handelExam, createExamAndLecture, updateExam } = require("../controllers/examController")
const { insertOne } = require("../controllers/factoryHandler")
const { createLecture, insertLecture } = require("../controllers/lectureController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const LectureModel = require("../models/LectureModel")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), handelExam, createExamAndLecture, insertLecture)

router.route("/lectures/:id") //lectureId
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), handelExam, updateExam) // *_* update marks

module.exports = router