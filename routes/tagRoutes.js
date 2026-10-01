import { getTags, createTag, updateTag, deleteTag, linkTag, unLinkTag } from '../controllers/tagController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(), getTags)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createTag)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateTag)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteTag)

router.route("/:id/questions")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), linkTag)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), unLinkTag)

export default router;

