import { filterById, analysisMonthly } from '../controllers/factoryHandler.js';
import { getSessions, sessionLogout, sessionParams } from '../controllers/sessionController.js';
import { userParams } from '../controllers/userController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import SessionModel from '../models/SessionModel.js';
import UserModel from '../models/UserModel.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), filterById(UserModel, userParams, 'user'), getSessions)


router.route('/statistics/analysis')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), analysisMonthly(SessionModel, sessionParams))

router.route("/:sessionId/logout")
    .post(verifyToken(), sessionLogout)

export default router;