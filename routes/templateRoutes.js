import { getTemplates, createTemplate, updateTemplate, deleteTemplate, incrementUses } from '../controllers/templateController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getTemplates)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createTemplate)

router.route("/:id/increment")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), incrementUses)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateTemplate)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteTemplate)

export default router;