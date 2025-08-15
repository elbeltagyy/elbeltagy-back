const { filterById } = require('../controllers/factoryHandler')
const { getInvoices, createInvoice, removeInvoice, updateInvoice, validatePreInvoice, makeInvoice, webHookSubscription, webhookPaymob, deleteManyInvoices } = require('../controllers/invoiceController')
const { handelPaymentFile } = require('../controllers/paymentController')
const allowedTo = require('../middleware/allowedTo')
const { secureGetAll } = require('../middleware/secureMiddleware')
const { upload } = require('../middleware/storage')
const verifyToken = require('../middleware/verifyToken')
const UserModel = require('../models/UserModel')
const { user_roles } = require('../tools/constants/rolesConstants')

const router = require('express').Router()

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

router.route("/:id/webhook")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), webHookSubscription)


module.exports = router