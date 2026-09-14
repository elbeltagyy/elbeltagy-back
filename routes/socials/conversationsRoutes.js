const { sendMessage } = require("../../controllers/social/whatsappSend")
const { getConversations, markSeen, removeConversation, updateConversation } = require("../../controllers/WhatsappReocrding")
const { upload } = require("../../middleware/storage")

const router = require("express").Router()

router.route('/')
    .get(getConversations)
router.route('/:id')
    .post(upload.single('file'), sendMessage)
    .patch(updateConversation)
    .delete(removeConversation)

router.route('/:conversationPhone/mark_seen')
    .patch(markSeen)

module.exports = router