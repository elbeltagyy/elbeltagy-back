import { sendReports, getReports, deleteReport, updateReport } from '../controllers/reportController.js';
import { whatsStatusMiddleware } from '../controllers/whatsappController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .post( sendReports) //whatsStatusMiddleware,
    .get(getReports)
router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateReport)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteReport)

export default router;