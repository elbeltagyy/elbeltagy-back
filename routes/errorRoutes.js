const { getErrors, deleteSameErrors } = require("../controllers/errorController");
const allowedTo = require("../middleware/allowedTo");
const verifyToken = require("../middleware/verifyToken");
const { user_roles } = require("../tools/constants/rolesConstants");

const router = require("express").Router();

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getErrors);

router.route("/many/:id")
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteSameErrors);

module.exports = router;
