
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")

const { user_roles } = require("../tools/constants/rolesConstants")
const { getBooksOrders, deleteBookOrder, createBookOrder, updateBookOrder, getBooksOrdersCount } = require("../controllers/bookOrderController")
const { secureGetAll } = require("../middleware/secureMiddleware")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), secureGetAll(), getBooksOrders)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createBookOrder)

router.route('/count')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getBooksOrdersCount)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateBookOrder)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteBookOrder)

module.exports = router