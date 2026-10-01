import { getGroups, createGroup, updateGroup, deleteGroup, removeUserFromGroup, addUserToGroup, addLectureToGroup, removeLectureFromGroup } from '../controllers/groupController.js';
import { getPrivacies, createPrivacy, updatePrivacy, deletePrivacy } from '../controllers/privacyController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(getGroups)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createGroup)

router.route("/:id/users")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addUserToGroup)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeUserFromGroup)

router.route("/:id/lectures")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addLectureToGroup) //not Used 
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), removeLectureFromGroup)//not Used

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateGroup)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteGroup)

export default router;