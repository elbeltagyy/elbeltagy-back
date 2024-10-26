const { getPrivacies, createPrivacy, updatePrivacy, deletePrivacy } = require("../controllers/privacyController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(getPrivacies)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createPrivacy)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updatePrivacy)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deletePrivacy)

module.exports = router