const { getAttempts, getOneAttempt, getUserInfo } = require("../controllers/attemptController")
const { userParams } = require("../controllers/userController")
const UserModel = require("../models/UserModel")
const { filterById } = require("../controllers/factoryHandler")

const { user_roles } = require("../tools/constants/rolesConstants")
const verifyToken = require("../middleware/verifyToken")
const allowedTo = require("../middleware/allowedTo")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), filterById(UserModel, userParams, 'user'), getAttempts)

router.route("/users/:id")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), getUserInfo)

router.route("/:id")
    .get(verifyToken(), getOneAttempt)
module.exports = router