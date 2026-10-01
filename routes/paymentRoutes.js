import { getPayments, createPayment, removePayment, handelPaymentFile, updatePayment } from '../controllers/paymentController.js';
import allowedTo from '../middleware/allowedTo.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import { upload } from '../middleware/storage.js';
import verifyToken from '../middleware/verifyToken.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

router.route("/")
    .get(verifyToken(), secureGetAll({ key: 'isActive', value: true }), getPayments) //allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR)
    .post(
        verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR),
        upload.single('file'),
        handelPaymentFile, createPayment)

router.route("/:id")
    .put(verifyToken(), upload.single('file'), handelPaymentFile, updatePayment)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), removePayment)

export default router;