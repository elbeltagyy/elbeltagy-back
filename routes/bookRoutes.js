
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import { getBooks, createBook, updateBook, deleteBook, countBooks } from '../controllers/bookController.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import { upload } from '../middleware/storage.js';
import { handelMultipleFiles } from '../controllers/factoryHandler.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(true), secureGetAll({ key: 'isActive', value: true }), getBooks)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'file', maxCount: 1 }, // adjust maxCount as needed
    ]), handelMultipleFiles(['avatar', 'file']), createBook)

router.route('/count')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), countBooks)

router.route("/:id")
    // .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'file', maxCount: 1 }, // adjust maxCount as needed
    ]), handelMultipleFiles(['avatar', 'file']), updateBook)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteBook)

export default router;