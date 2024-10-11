const { getUsers, createUser, updateUser, updateUserProfile, deleteUser, getByUserName } = require("../controllers/userController")
const allowedTo = require("../middleware/allowedTo")
const upload = require("../middleware/storage")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")
const router = require("express").Router()

// router.get("/check", isUser)
router.route("/")
    // .get(verifyToken, allowedTo(user_roles.ADMIN), getUsers)
    .get(verifyToken(), getUsers)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createUser)

router.route("/:id")
    .put(updateUser)
    .patch(verifyToken(), upload.single("avatar"), updateUserProfile)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteUser)

router.route("/:userName")
    .get(verifyToken(), getByUserName)
// manage user


module.exports = router