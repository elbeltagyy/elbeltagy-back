const { filterById } = require("../controllers/factoryHandler")
const { getSessions, sessionLogout } = require("../controllers/sessionController")
const { userParams } = require("../controllers/userController")
const verifyToken = require("../middleware/verifyToken")
const UserModel = require("../models/UserModel")

const router = require("express").Router()

router.route("/")
    .get(filterById(UserModel, userParams, 'user'), getSessions)

router.route("/:sessionId/logout")
    .post(verifyToken(), sessionLogout)

module.exports = router