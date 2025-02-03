const { getUnits, createUnit, getOneUnit, updateUnit, deleteUnit, checkUnitsBeforeDelete } = require("../controllers/unitController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(getUnits)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createUnit)

router.route("/:id")
    .get(getOneUnit)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateUnit)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), checkUnitsBeforeDelete, deleteUnit)

module.exports = router
