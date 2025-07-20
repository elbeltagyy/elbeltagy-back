const { getAttempts, getOneAttempt, getUserInfo, deleteOneAttempt, startAttempt } = require("../controllers/attemptController")

const UserModel = require("../models/UserModel")
const { filterById } = require("../controllers/factoryHandler")

const { user_roles } = require("../tools/constants/rolesConstants")
const verifyToken = require("../middleware/verifyToken")
const allowedTo = require("../middleware/allowedTo")
const ExamModel = require("../models/ExamModel")
const CourseModel = require("../models/CourseModel")

const router = require("express").Router()

const userParams = (query) => {
    return [
        { key: 'name', value: query.name },
        { key: 'userName', value: query.userName },
        { key: 'phone', value: query.phone },
        { key: 'familyPhone', value: query.familyPhone },
    ]
}

const examParams = (query) => {
    return [
        { key: 'name', value: query.examName },
    ]
}
const courseParams = (query) => {
    return [
        { key: 'name', value: query.courseName },
    ]
}

router.route("/")
    .get(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        filterById(UserModel, userParams, 'user'),
        filterById(ExamModel, examParams, 'exam'),
        filterById(CourseModel, courseParams, 'course'),
        getAttempts
    )
    .post(verifyToken(), startAttempt)

router.route("/users/:id")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), getUserInfo)

router.route("/:id")
    .get(verifyToken(), getOneAttempt)
    .delete(verifyToken(), deleteOneAttempt)

module.exports = router