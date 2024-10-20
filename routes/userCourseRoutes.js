const { filterById } = require("../controllers/factoryHandler")
const { userParams, getUsers } = require("../controllers/userController")
const { getCourseSubscriptions, addSubscription, removeSubscription, updateSubscription } = require("../controllers/userCourseController")
const verifyToken = require("../middleware/verifyToken")
const CourseModel = require("../models/CourseModel")
const UserModel = require("../models/UserModel")

const router = require("express").Router()

const courseParams = (query) => {
    return [
        { key: "course", value: query.courseName },
    ]
}

router.route("/courses")
    .get(filterById(UserModel, userParams, 'user'), filterById(CourseModel, courseParams, 'course'), getCourseSubscriptions) //verifyToken(),
    .post(addSubscription)

router.route("/courses/:id")
    .put(updateSubscription)
    .delete(removeSubscription)

// router.route("/users/:userId")
//     .get(verifyToken(), getUsers)

module.exports = router
