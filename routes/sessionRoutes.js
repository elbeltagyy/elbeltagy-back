const { filterById } = require("../controllers/factoryHandler")
const { getSessions, sessionLogout } = require("../controllers/sessionController")
const { userParams } = require("../controllers/userController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const UserModel = require("../models/UserModel")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), filterById(UserModel, userParams, 'user'), getSessions)

router.route("/:sessionId/logout")
    .post(verifyToken(), sessionLogout)

module.exports = router