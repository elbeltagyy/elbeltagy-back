const { getTasks, createTask, updateTask, deleteTask } = require("../controllers/planTaskController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getTasks)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createTask)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateTask)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteTask)

module.exports = router