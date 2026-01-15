const { sendReports, getReports, deleteReport, updateReport } = require("../controllers/reportController")
const { whatsStatusMiddleware } = require("../controllers/whatsappController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .post( sendReports) //whatsStatusMiddleware,
    .get(getReports)
router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateReport)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteReport)

module.exports = router