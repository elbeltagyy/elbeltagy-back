
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")

const { user_roles } = require("../tools/constants/rolesConstants")
const { secureGetAll } = require("../middleware/secureMiddleware")
const { getApplications, createApplication, countApplications, updateApplication, deleteApplication, getOneApplication } = require("../controllers/applicationController")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(true), secureGetAll([{ key: 'isActive', value: true }]), getApplications)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createApplication)

router.route('/count')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), countApplications)

router.route("/:id")
    .get(getOneApplication)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateApplication)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteApplication)

module.exports = router