import LectureModel from '../models/LectureModel.js';
import { insertOne, deleteFromBody } from '../controllers/factoryHandler.js';
import { upload } from '../middleware/storage.js';
import { getLectures, getOneLecture, createLecture, deleteLecture, updateLecture, getLectureForCenter, handelUpdateLecture, getLecturesForAdmin, addToLectures, removeFromLectures, protectGetLectures, pushLectures, changeLectureIndex } from '../controllers/lectureController.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import verifyToken from '../middleware/verifyToken.js';
import allowedTo from '../middleware/allowedTo.js';

import express from 'express';
const router = express.Router();

router.route('/all')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getLecturesForAdmin)

router.route("/")
    .get(verifyToken(), protectGetLectures, getLectures)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), createLecture, insertOne(LectureModel, true, 'course'))

router.route("/center/:id")
    .get(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), getLectureForCenter) //allowed to center

router.route('/push')
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), pushLectures)

router.route('/array')
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addToLectures)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeFromLectures)

router.route("/:id")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getOneLecture)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), deleteFromBody(['course']), updateLecture)
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('video'), handelUpdateLecture)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteLecture)

router.route("/:id/reorder")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), changeLectureIndex)

export default router;
