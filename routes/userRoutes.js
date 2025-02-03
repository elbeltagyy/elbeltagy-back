const { getUsers, createUser, updateUser, updateUserProfile, deleteUser, getByUserName } = require("../controllers/userController")
const allowedTo = require("../middleware/allowedTo")
const { imageUpload } = require("../middleware/storage")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")
const router = require("express").Router()

// router.get("/check", isUser)
router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getUsers)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createUser)

router.route("/:userName")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), getByUserName)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateUser)
    .patch(verifyToken(), imageUpload.single("avatar"), updateUserProfile)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteUser)




module.exports = router