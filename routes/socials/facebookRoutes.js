const { loginToFacebook, facebookCallbackLogin, createPost, getPages, getPosts, facebookDelete, getPostComments, getComments, createComment, updatePost, deletePost, updateComment, deleteComment } = require("../../controllers/social/facebookController")
const allowedTo = require("../../middleware/allowedTo")
const { upload } = require("../../middleware/storage")
const verifyToken = require("../../middleware/verifyToken")
const { user_roles } = require("../../tools/constants/rolesConstants")

const router = require("express").Router()

router.route('/login')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), loginToFacebook)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), facebookDelete)

router.route('/callback')
    .get(facebookCallbackLogin)

router.route('/pages')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getPages)

router.route('/posts')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getPosts)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.array('files', 10), createPost)
router.route('/posts/:postId')
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updatePost)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deletePost)

router.route('/posts/:postId/comments')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getPostComments)
// router.route('/posts/:postId/comments/:commentId')
//     .get(getComments)
router.route('/comments')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getComments)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('file'), createComment)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateComment)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteComment)

module.exports = router