import expressAsyncHandler from 'express-async-handler';

import createError from '../tools/createError.js';
import { FAILED, SUCCESS } from '../tools/statusTexts.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';

import CouponModel from '../models/CouponModel.js';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, verifyCoupon, addToCoupons } from '../controllers/couponController.js';

import CourseModel from '../models/CourseModel.js';
import { filterById } from '../controllers/factoryHandler.js';
import { coursesParams } from '../controllers/courseController.js';
import makeRandom from '../tools/makeRandom.js';

import express from 'express';
const router = express.Router();

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

export default router;