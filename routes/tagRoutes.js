const { getTags, createTag, updateTag, deleteTag, linkTag, unLinkTag } = require('../controllers/tagController')
const allowedTo = require('../middleware/allowedTo')
const verifyToken = require('../middleware/verifyToken')
const { user_roles } = require('../tools/constants/rolesConstants')

const router = require('express').Router()

router.route("/")
    .get(verifyToken(), getTags)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createTag)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateTag)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteTag)

router.route("/:id/questions")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), linkTag)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), unLinkTag)

module.exports = router

