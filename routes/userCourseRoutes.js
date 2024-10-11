const { filterById } = require("../controllers/factoryHandler")
const { userParams, getUsers } = require("../controllers/userController")
const { getCourseSubscriptions, addSubscription, removeSubscription } = require("../controllers/userCourseController")
const verifyToken = require("../middleware/verifyToken")
const UserModel = require("../models/UserModel")

const router = require("express").Router()

router.route("/courses")
    .get(filterById(UserModel, userParams, 'user'), getCourseSubscriptions) //verifyToken(),
    .post(addSubscription)

router.route("/courses/:id")
    .delete(removeSubscription)

// router.route("/users/:userId")
//     .get(verifyToken(), getUsers)

module.exports = router
