
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import { getBooksOrders, deleteBookOrder, createBookOrder, updateBookOrder, getBooksOrdersCount } from '../controllers/bookOrderController.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(), secureGetAll(), getBooksOrders)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), createBookOrder)

router.route('/count')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getBooksOrdersCount)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateBookOrder)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteBookOrder)

export default router;