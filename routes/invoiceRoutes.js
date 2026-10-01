import { filterById } from '../controllers/factoryHandler.js';
import { getInvoices, createInvoice, removeInvoice, updateInvoice, validatePreInvoice, makeInvoice, webHookSubscription, webhookPaymob, deleteManyInvoices, webhookFawaterk, webhookFawaterkCancelled, webhookFawaterkFailed } from '../controllers/invoiceController.js';
import { handelPaymentFile } from '../controllers/paymentController.js';
import allowedTo from '../middleware/allowedTo.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import { upload } from '../middleware/storage.js';
import verifyToken from '../middleware/verifyToken.js';
import UserModel from '../models/UserModel.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

const userParams = (query) => {
    return [
        { key: "userName", value: query.userName },
        { key: "name", value: query.user_name },
    ]
}

router.route("/")
    .get(verifyToken(), filterById(UserModel, userParams, 'user'), secureGetAll(), getInvoices)
    .post(verifyToken(), upload.single('file'), validatePreInvoice, handelPaymentFile, makeInvoice)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), deleteManyInvoices)

router.route("/:id")
    .put(verifyToken(), updateInvoice)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN, user_roles.MENTOR), removeInvoice)

router.route("/webhook/paymob")
    .post(webhookPaymob)

router.route("/webhook/fawaterk")
    .post(webhookFawaterk)

router.route("/webhook/fawaterk/cancelled")
    .post(webhookFawaterkCancelled)
router.route("/webhook/fawaterk/failed")
    .post(webhookFawaterkFailed)

router.route("/:id/webhook")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), webHookSubscription)


export default router;