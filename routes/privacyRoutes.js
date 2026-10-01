import { getPrivacies, createPrivacy, updatePrivacy, deletePrivacy } from '../controllers/privacyController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(getPrivacies)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createPrivacy)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updatePrivacy)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deletePrivacy)

export default router;