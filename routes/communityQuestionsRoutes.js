
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';

import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
import { addLikeToQuestion, appendPendingOnCreateToUser, checkUserCanPerformAction, createCommunityQuestion, deleteCommunityQuestion, getCommunityQuestions, getCommunityQuestionsCount, getOnlyApprovedForUser, updateCommunityQUestion } from '../controllers/CommunityQuestionController.js';
import { upload } from '../middleware/storage.js';
import { handelOneFile } from '../controllers/factoryHandler.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
const router = express.Router();

router.route("/")
    .get(verifyToken(), getOnlyApprovedForUser, getCommunityQuestions) //secureGetAll(),
    .post(verifyToken(),
        upload.array('attachments'), handelOneFile('attachments'), appendPendingOnCreateToUser,
        createCommunityQuestion) //allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),

router.route('/count')
    .get(verifyToken(), secureGetAll(), getCommunityQuestionsCount) //allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCommunityQUestion)
    .delete(verifyToken(), checkUserCanPerformAction, deleteCommunityQuestion) //allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
router.route("/:id/likes")
    .put(verifyToken(), addLikeToQuestion)

export default router;