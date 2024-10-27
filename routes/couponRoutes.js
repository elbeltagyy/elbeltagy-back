const expressAsyncHandler = require("express-async-handler")

const createError = require("../tools/createError")
const { FAILED } = require("../tools/statusTexts")

const { user_roles } = require("../tools/constants/rolesConstants")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")

const CouponModel = require("../models/CouponModel")
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, verifyCoupon } = require("../controllers/couponController")

const CourseModel = require("../models/CourseModel")
const { filterById } = require("../controllers/factoryHandler")
const { coursesParams } = require("../controllers/courseController")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), filterById(CourseModel, coursesParams, 'course'), getCoupons)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        expressAsyncHandler((async (req, res, next) => {
            const coupon = req.body.coupon
            const foundCoupon = await CouponModel.findOne({ coupon }).lean().select("_id")
            if (foundCoupon) {
                return next(createError('لا يمكن ان يكون هناك كوبونين لهم نفس الرمز', 400, FAILED))
            }

            next()
        })), createCoupon)

router.route('/verify')
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), verifyCoupon)

router.route("/:id")
    // .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCoupon)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteCoupon)

module.exports = router