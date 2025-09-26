const { analysisMonthly } = require("../controllers/factoryHandler")
const { getUsers, createUser, updateUser, updateUserProfile, deleteUser, getByUserName, addToUsers, userParams, deleteManyUsers, checkDeleteUser } = require("../controllers/userController")
const allowedTo = require("../middleware/allowedTo")
const { imageUpload } = require("../middleware/storage")
const verifyToken = require("../middleware/verifyToken")
const UserModel = require("../models/UserModel")
const { user_roles } = require("../tools/constants/rolesConstants")
const router = require("express").Router()

// router.get("/check", isUser)
router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getUsers)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createUser)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteManyUsers)

router.route('/push')
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addToUsers)

router.route("/analysis")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), analysisMonthly(UserModel, userParams))

router.route("/:userName")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), getByUserName)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateUser)
    .patch(verifyToken(), imageUpload.single("avatar"), updateUserProfile)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), checkDeleteUser, deleteUser)

module.exports = router