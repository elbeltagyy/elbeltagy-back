const { filterById } = require("../controllers/factoryHandler")
const { userParams, getUsers } = require("../controllers/userController")
const { getCourseSubscriptions, addSubscription, removeSubscription, updateSubscription } = require("../controllers/userCourseController")
const allowedTo = require("../middleware/allowedTo")
const { secureGetAll } = require("../middleware/secureMiddleware")
const verifyToken = require("../middleware/verifyToken")
const CourseModel = require("../models/CourseModel")
const UserModel = require("../models/UserModel")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

const courseParams = (query) => {
    return [
        { key: "name", value: query.courseName },
    ]
}

router.route("/courses")
    .get(verifyToken(), filterById(UserModel, userParams, 'user'),
        filterById(CourseModel, courseParams, 'course'), secureGetAll(), getCourseSubscriptions) //verifyToken(),
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addSubscription)

router.route("/courses/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateSubscription)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeSubscription)

module.exports = router
