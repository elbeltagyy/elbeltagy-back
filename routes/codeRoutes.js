import { createCode, getOneCode, updateCode, deleteCode, getCodes, verifyCode, getUserUsedCodes, getLectureCodes, handelCreateCode } from '../controllers/codeController.js';

import codeConstants from '../tools/constants/codeConstants.js';
import makeRandom from '../tools/makeRandom.js';

import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import expressAsyncHandler from 'express-async-handler';
import CodeModel from '../models/CodeModel.js';
import { SUCCESS, FAILED } from '../tools/statusTexts.js';
import createError from '../tools/createError.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getLectureCodes, getCodes)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), handelCreateCode, createCode)

router.route('/user') //for user
    .get(verifyToken(), getUserUsedCodes)

router.route('/verify')
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), verifyCode)

router.route("/:id")
    .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCode)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteCode)

export default router;