const { filterById } = require("../controllers/factoryHandler")
const { countStatistics } = require("../controllers/videoController")
const { getViews, updateView, removeView, viewParams, getByUserViews } = require("../controllers/viewsController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const CourseModel = require("../models/CourseModel")
const LectureModel = require("../models/LectureModel")
const UserModel = require("../models/UserModel")

const { user_roles } = require("../tools/constants/rolesConstants")
const router = require("express").Router()

const courseParams = (query) => {
    return [
        { key: "name", value: query.courseName },
        { key: "price", value: query.price },
    ]
}

const lectureParams = (query) => {
    return [
        { key: "name", value: query.lectureName },
        { key: "duration", value: query.duration },
    ]
}

const userParams = (query) => {
    return [
        { key: 'name', value: query.name },
        { key: 'userName', value: query.userName },
        { key: 'phone', value: query.phone },
        { key: 'familyPhone', value: query.familyPhone },
        { key: 'name', value: query.name },
    ]
}
router.route("/")
    .get(
        verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        filterById(UserModel, userParams, 'user'),
        filterById(CourseModel, courseParams, 'course'),
        filterById(LectureModel, lectureParams, 'lecture'),
        getViews)

router.route("/users")
    .get(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        getByUserViews)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateView)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeView)

router.route("/on")
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), countStatistics)

module.exports = router