import { analysisMonthly, analysisByKeys } from '../controllers/factoryHandler.js';
import { getUsers, createUser, updateUser, updateUserProfile, deleteUser, getByUserName, addToUsers, userParams, deleteManyUsers, checkDeleteUser } from '../controllers/userController.js';
import allowedTo from '../middleware/allowedTo.js';
import { imageUpload } from '../middleware/storage.js';
import verifyToken from '../middleware/verifyToken.js';
import UserModel from '../models/UserModel.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import express from 'express';
const router = express.Router();

// router.get("/check", isUser)
router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getUsers)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createUser)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteManyUsers)

router.route('/push')
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addToUsers)

router.route("/analysis")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), analysisMonthly(UserModel, userParams))
router.route("/analysisKeys")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), analysisByKeys(UserModel, userParams))


router.route("/:userName")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), getByUserName)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateUser)
    .patch(verifyToken(), imageUpload.single("avatar"), updateUserProfile)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), checkDeleteUser, deleteUser)

export default router;