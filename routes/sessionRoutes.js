const { getSessions, sessionLogout } = require("../controllers/sessionController")
const verifyToken = require("../middleware/verifyToken")

const router = require("express").Router()

router.route("/")
    .get(getSessions)

router.route("/:sessionId/logout")
    .post(verifyToken(), sessionLogout)

module.exports = router