
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';

import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
import { addLikeToComment, checkUserCanPerformAction, createCommunityComment, deleteCommunityComment, getCommunityComments, getCommunityCommentsCount, protectGetComments, updateCommunityComment } from '../controllers/CommunityCommentsController.js';
import { upload } from '../middleware/storage.js';
import { handelOneFile } from '../controllers/factoryHandler.js';
const router = express.Router();

router.route("/")
    .get(verifyToken(), protectGetComments, getCommunityComments) //secureGetAll(),
    .post(verifyToken(), upload.array('attachments'), handelOneFile('attachments'), createCommunityComment)

router.route('/count')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getCommunityCommentsCount)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCommunityComment)
    .delete(verifyToken(), checkUserCanPerformAction, deleteCommunityComment) //allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),

router.route("/:id/likes")
    .put(verifyToken(), addLikeToComment)
export default router;