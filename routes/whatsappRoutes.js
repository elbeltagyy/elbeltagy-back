import { initializeWhatsApp, activateByQr, getWhatsStatus, sendWhatsMessage, closeWhatsapp } from '../controllers/whatsappController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/userId/init")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), initializeWhatsApp)

router.route("/userId/close")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), closeWhatsapp)

router.route("/userId/qr")
    .get(activateByQr)

router.route("/userId/status")
    .get(getWhatsStatus)

router.route("/userId/send")
    .post(sendWhatsMessage)

export default router;