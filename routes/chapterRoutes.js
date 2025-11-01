const { getChapters, createChapter, updateChapter, removeChapter, pushAndPullInChapters, changeIndex, preRemoveChapter } = require('../controllers/chapterControllers')
const allowedTo = require('../middleware/allowedTo')
// const { hasPermission } = require('../middleware/permissions')

const verifyToken = require('../middleware/verifyToken')
const { user_roles } = require('../tools/constants/rolesConstants')

const router = require('express').Router()

router.route("/")
    .get(verifyToken(), getChapters) // secureGetAll([{ key: 'teachers' }]),
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createChapter)
// .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), deleteManyInvoices)

// router.route("/push")
//     .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.TEACHER),pushAndPullInChapters)
router.route("/:id/reorder")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), changeIndex)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateChapter)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), preRemoveChapter, removeChapter)

module.exports = router