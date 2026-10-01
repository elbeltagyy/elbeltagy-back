import { getUnits, createUnit, getOneUnit, updateUnit, deleteUnit, checkUnitsBeforeDelete } from '../controllers/unitController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(getUnits)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createUnit)

router.route("/:id")
    .get(getOneUnit)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateUnit)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), checkUnitsBeforeDelete, deleteUnit)

export default router;
