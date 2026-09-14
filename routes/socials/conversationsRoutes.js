const { sendMessage } = require("../../controllers/social/whatsappSend")
const { getConversations, markSeen, removeConversation, updateConversation } = require("../../controllers/WhatsappReocrding")
const allowedTo = require("../../middleware/allowedTo")
const { upload } = require("../../middleware/storage")
const verifyToken = require("../../middleware/verifyToken")
const { user_roles } = require("../../tools/constants/rolesConstants")

const router = require("express").Router()

router.route('/')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getConversations)
router.route('/:id')
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('file'), sendMessage)
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateConversation)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeConversation)

router.route('/:conversationPhone/mark_seen')
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), markSeen)

module.exports = router