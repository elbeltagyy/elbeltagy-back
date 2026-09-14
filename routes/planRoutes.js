const { getPlans, createPlan, updatePlan, deletePlan } = require("../controllers/planController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getPlans)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createPlan)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updatePlan)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deletePlan)

module.exports = router