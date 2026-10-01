import { handelExam, createExamAndLecture, updateExam } from '../controllers/examController.js';
import { createLecture, insertLecture } from '../controllers/lectureController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), handelExam, createExamAndLecture, insertLecture)

router.route("/lectures/:id") //lectureId
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), handelExam, updateExam) // *_* update marks

export default router;