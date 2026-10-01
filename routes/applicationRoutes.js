
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import { getApplications, createApplication, countApplications, updateApplication, deleteApplication, getOneApplication } from '../controllers/applicationController.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(true), secureGetAll([{ key: 'isActive', value: true }]), getApplications)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createApplication)

router.route('/count')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), countApplications)

router.route("/:id")
    .get(getOneApplication)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateApplication)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteApplication)

export default router;