import express from 'express';
const router = express.Router();

import { getNotifications, createNotification, updateNotification, deleteNotification, makeSeen, handelNotification, sendNotificationsToMany } from '../controllers/notificationController.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';


router.route("/")
    .get(verifyToken(), secureGetAll(), getNotifications)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), handelNotification, createNotification)

router.route("/seen/:userId")
    .get(verifyToken(), makeSeen)

router.route("/many")
    .post(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR),
        sendNotificationsToMany)

router.route("/one/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), updateNotification)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), deleteNotification)

export default router;