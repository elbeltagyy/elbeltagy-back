import { handelOneFile } from '../controllers/factoryHandler.js';
import { getGrades, createGrade, updateGrade, getOneGrade, deleteGrade } from '../controllers/gradeController.js';
import allowedTo from '../middleware/allowedTo.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import { upload } from '../middleware/storage.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(true), secureGetAll({ key: "isActive", value: true }, [user_roles.SUBADMIN, user_roles.ADMIN]), getGrades)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('image'), handelOneFile('image'), createGrade)

router.route("/:id")
    .get(verifyToken(true), secureGetAll({ key: "isActive", value: true }), getOneGrade)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('image'), handelOneFile('image'), updateGrade)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteGrade)
export default router;

