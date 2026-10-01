import { getChapters, createChapter, updateChapter, removeChapter, pushAndPullInChapters, changeIndex, preRemoveChapter } from '../controllers/chapterControllers.js';
import allowedTo from '../middleware/allowedTo.js';
// const { hasPermission } = require('../middleware/permissions')

import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(), getChapters) // secureGetAll([{ key: 'teachers' }]),
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createChapter)
// .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), deleteManyInvoices)

// router.route("/push")
//     .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.TEACHER),pushAndPullInChapters)
router.route("/:id/reorder")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), changeIndex)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateChapter)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), preRemoveChapter, removeChapter)

export default router;