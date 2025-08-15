const expressAsyncHandler = require("express-async-handler");
const CouponModel = require("../models/CouponModel");
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const createError = require("../tools/createError");
const { FAILED } = require("../tools/statusTexts");
const CourseModel = require("../models/CourseModel");
const mongoose = require("mongoose");
const codeConstants = require("../tools/constants/codeConstants");
const TagModel = require("../models/TagModel");


const couponParams = (query) => {
    return [
        { key: "coupon", value: query.coupon },
        { key: "tag", value: query.tag },
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
    const couponName = req.body.coupon
    const productData = req.body
    const user = req.user


    const [product] = await getProduct(productData)
    const prices = await checkCouponAndPrice(couponName, user, product)

    const coupon = prices.coupon._doc
    const discount = prices.coupon.discount
    const price = prices.priceAfterDiscount

    const message = 'كوبون خصم بنسبه ' + discount + ' %' + 'و اصبح القيمه ' + price + ' جنيه'

    return res.status(200).json({ message, values: { ...coupon, price } })
})


const useCoupon = async (couponName, user, product, meta) => {
    return new Promise(async (resolve, reject) => {
        try {
            const isWallet = meta.isWallet ?? false
            const isSave = meta.isSave ?? true

            const results = await checkCouponAndPrice(couponName, user, product)
            const coupon = results.coupon

            coupon.usedBy.push(user._id)
            coupon.numbers = coupon.numbers - 1

            const priceAfterDiscount = results.priceAfterDiscount

            if (isWallet && priceAfterDiscount > user.wallet) {
                return reject(createError('المحفظه لا تكفى, بالرجاء شحن مبلغ ' + (priceAfterDiscount - user.wallet) + ' جنيه', 400, FAILED))
            }
            if (isSave) {
                await Promise.all([user.save(), coupon.save()])
            }
            return resolve(priceAfterDiscount)
        } catch (error) {
            return reject(createError(error.message, 400, FAILED))
        }
    })
}

const getProduct = async (product) => {
    if (product.course) {
        const course = await CourseModel.findById(product.course)
        return [course]
    } else if (product.tag) {
        const tag = await TagModel.findById(product.tag)
        return [tag]
    }
    return [null]
}

const checkCouponAndPrice = async (couponName, user, product) => {
    return new Promise(async (resolve, reject) => {
        try {
            const coupon = await CouponModel.findOne({ coupon: couponName })
            if (!coupon) return reject(createError("هذا الكوبون غير صالح", 400, FAILED))
            if (coupon?.numbers <= 0 || coupon?.isActive === false) return reject(createError("هذا الكوبون غير صالح", 400, FAILED))
            if (coupon.usedBy.includes(user._id)) return reject(createError("الكوبون يستخدم مره واحده لكل مستخدم", 400, FAILED))

            if (coupon.type === codeConstants.PRIVATE) {
                let isValid = true
                if (coupon.course) {
                    const course = new mongoose.Types.ObjectId(product._id);
                    isValid = coupon.course.equals(course)
                } else if (coupon.tag) {
                    const tag = new mongoose.Types.ObjectId(product._id);
                    isValid = coupon.tag.equals(tag)
                }

                if (!isValid) {
                    return reject(createError("هذا الكوبون غير صالح", 400, FAILED))
                }
            }

            const couponDiscount = coupon.discount
            const price = product.price
            const priceAfterDiscount = (price - ((couponDiscount / 100) * price))

            return resolve({ priceAfterDiscount, originalPrice: price, coupon })
        } catch (error) {
            return reject(createError(error.message, 400, FAILED))
        }
    })
}

// const validateCoupon = ()=> new Promise()
module.exports = {
    getCoupons, verifyCoupon, createCoupon, updateCoupon, deleteCoupon,
    useCoupon
}