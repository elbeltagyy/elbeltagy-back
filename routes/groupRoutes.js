const { getGroups, createGroup, updateGroup, deleteGroup, removeUserFromGroup, addUserToGroup, addLectureToGroup, removeLectureFromGroup } = require("../controllers/groupController")
const { getPrivacies, createPrivacy, updatePrivacy, deletePrivacy } = require("../controllers/privacyController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

router.route("/")
    .get(getGroups)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createGroup)

router.route("/:id/users")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addUserToGroup)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeUserFromGroup)

router.route("/:id/lectures")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addLectureToGroup) //not Used 
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeLectureFromGroup)//not Used

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateGroup)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteGroup)

module.exports = router