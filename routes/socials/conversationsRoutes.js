import { sendMessage } from '../../controllers/social/whatsappSend.js';
import { getConversations, markSeen, removeConversation, updateConversation } from '../../controllers/WhatsappReocrding.js';
import allowedTo from '../../middleware/allowedTo.js';
import { upload } from '../../middleware/storage.js';
import verifyToken from '../../middleware/verifyToken.js';
import { user_roles } from '../../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route('/')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getConversations)
router.route('/:id')
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('file'), sendMessage)
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateConversation)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeConversation)

router.route('/:conversationPhone/mark_seen')
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), markSeen)

export default router;