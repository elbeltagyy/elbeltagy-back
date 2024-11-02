const expressAsyncHandler = require("express-async-handler");
const CouponModel = require("../models/CouponModel");
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const createError = require("../tools/createError");
const { FAILED } = require("../tools/statusTexts");
const CourseModel = require("../models/CourseModel");
const mongoose = require("mongoose");
const codeConstants = require("../tools/constants/codeConstants");


const couponParams = (query) => {
    return [
        { key: "coupon", value: query.coupon },
        { key: "type", value: query.type },
        { key: "numbers", value: query.numbers, type: 'number' },
        { key: "discount", value: query.discount, type: 'number' },
        { key: "isChecked", value: query.isChecked, type: "boolean" },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "course", value: query.course, operator: "equal" },
        { key: "usedBy", value: query.usedBy, type: 'array' },
    ]
}

const getCoupons = getAll(CouponModel, 'coupons', couponParams)
const createCoupon = insertOne(CouponModel)

const updateCoupon = updateOne(CouponModel)
const deleteCoupon = deleteOne(CouponModel)

const verifyCoupon = expressAsyncHandler(async (req, res, next) => {
    const coupon = req.body.coupon
    const course = req.body.course
    const user = req.user

    const foundCoupon = await CouponModel.findOne({ coupon, isActive: true, usedBy: { $nin: [user._id] }, numbers: { $gte: 1 } }).lean().select("discount course usedBy")
    if (!foundCoupon) return next(createError("الكوبون غير صحيح", 404, FAILED))

    if (foundCoupon.usedBy.includes(user._id)) next(createError("الكوبون يستعمل مره واحده فقط", 400, FAILED))

    const courseId = new mongoose.Types.ObjectId(course);
    if ((foundCoupon.type === codeConstants.PRIVATE || foundCoupon.course) && !foundCoupon.course.equals(courseId)) return next(createError("الكوبون غير صالح", 404, FAILED))
    // if (!foundCoupon.course.equals(courseId)) return next(createError("هذا الكوبون غير مخصص لهذا الكورس", 400, FAILED))

    const foundCourse = await CourseModel.findById(course).lean().select("price")
    if (!foundCourse) return next(createError("الكوبون غير صحيح", 404, FAILED))

    const couponDiscount = foundCoupon.discount
    const coursePrice = foundCourse.price
    const coursePriceAfterDiscount = (coursePrice - ((couponDiscount / 100) * coursePrice))

    return res.status(200).json({ message: 'كوبون خصم على الكورس بنسبه ' + couponDiscount + ' %' + 'و اصبح قيمه الكورس ' + coursePriceAfterDiscount + ' جنيه', values: { coursePriceAfterDiscount, coupon } })
})

// const validateCoupon = ()=> new Promise()
module.exports = { getCoupons, verifyCoupon, createCoupon, updateCoupon, deleteCoupon }