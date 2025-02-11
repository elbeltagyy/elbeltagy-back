const { initializeWhatsApp, activateByQr, getWhatsStatus, sendWhatsMessage, closeWhatsapp } = require("../controllers/whatsappController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/userId/init")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), initializeWhatsApp)

router.route("/userId/close")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), closeWhatsapp)

router.route("/userId/qr")
    .get(activateByQr)

router.route("/userId/status")
    .get(getWhatsStatus)

router.route("/userId/send")
    .post(sendWhatsMessage)

module.exports = router