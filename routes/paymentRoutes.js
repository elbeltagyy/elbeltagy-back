const { getPayments, createPayment, removePayment, handelPaymentFile, updatePayment } = require('../controllers/paymentController')
const allowedTo = require('../middleware/allowedTo')
const { secureGetAll } = require('../middleware/secureMiddleware')
const { upload } = require('../middleware/storage')
const verifyToken = require('../middleware/verifyToken')
const { user_roles } = require('../tools/constants/rolesConstants')

const router = require('express').Router()

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

module.exports = router