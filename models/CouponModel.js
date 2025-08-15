const mongoose = require("mongoose")
const UserModel = require("./UserModel")
const CourseModel = require("./CourseModel")
const codeConstants = require("../tools/constants/codeConstants")


const couponSchema = new mongoose.Schema({
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: UserModel }],
    course: {
        type: mongoose.Schema.Types.ObjectId, ref: CourseModel,
    },
    tag: {
        type: mongoose.Schema.Types.ObjectId, ref: 'tag',
    },
    coupon: { type: String, min: [6, 'اقل عدد للحروف هو 6 احرف'] },
    type: { type: String, enum: [codeConstants.PRIVATE, codeConstants.GLOBAL], default: codeConstants.PRIVATE },
    discount: {
        type: Number, default: 0, max: [100, "اقصى خصم هو 100 %"], min: [0, "القيمة الدنيا هي 0 %"],
    },
    isChecked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    numbers: { type: Number, default: 1, min: [0, 'القيمة الدنيا هي 0'], max: [200, 'اقصى عدد هو 200'] }
}, {
    timestamps: true,
    versionKey: false
})

const CouponModel = mongoose.model("coupon", couponSchema)
module.exports = CouponModel