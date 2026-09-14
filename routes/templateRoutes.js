const { getTemplates, createTemplate, updateTemplate, deleteTemplate, incrementUses } = require("../controllers/templateController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getTemplates)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createTemplate)

router.route("/:id/increment")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), incrementUses)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateTemplate)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteTemplate)

module.exports = router