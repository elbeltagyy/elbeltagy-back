const expressAsyncHandler = require("express-async-handler")

const createError = require("../tools/createError")
const { FAILED, SUCCESS } = require("../tools/statusTexts")

const { user_roles } = require("../tools/constants/rolesConstants")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")

const CouponModel = require("../models/CouponModel")
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, verifyCoupon, addToCoupons } = require("../controllers/couponController")

const CourseModel = require("../models/CourseModel")
const { filterById } = require("../controllers/factoryHandler")
const { coursesParams } = require("../controllers/courseController")
const makeRandom = require("../tools/makeRandom")

const router = require("express").Router()

function getRandomLetter() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * letters.length);
    return letters[randomIndex];
}


router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), filterById(CourseModel, coursesParams, 'course'), getCoupons)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        expressAsyncHandler((async (req, res, next) => {
            const coupon = req.body

            if (coupon.copies > 1) {
                if (coupon.copies > 500) return next(createError("اقصى عدد هو 500 كوبون فى العمليه الواحده", 400, FAILED))

                for (let i = 0; i < coupon.copies; i++) {
                    const couponName = coupon.coupon + getRandomLetter() + i + makeRandom(0, 9, 3)
                    const createdCoupon = { ...coupon, coupon: couponName }
                    await CouponModel.create(createdCoupon)
                }

                return res.status(200).json({ message: 'تم انشاء ' + coupon.copies + ' كوبونات', status: SUCCESS })
            }

            const foundCoupon = await CouponModel.findOne({ coupon: coupon.coupon }).lean().select("_id")
            if (foundCoupon) {
                return next(createError('لا يمكن ان يكون هناك كوبونين لهم نفس الرمز', 400, FAILED))
            }

            next()
        })), createCoupon)

router.route('/verify')
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), verifyCoupon)
router.route('/push')
    .patch(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), addToCoupons)

router.route("/:id")
    // .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCoupon)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteCoupon)

module.exports = router