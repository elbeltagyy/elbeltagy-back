//req => name: 'course', desc: 'some thing', method: "",product: ref to features, user
// conditions => By User, Payed, Mid Layer, coupon ok,no code 
//products
// -Course --> Post:: UserCourse
// -Question Tag --> paymentModel || =User || TagSubscription
// -lecture -->
// when accept => acc to product => 1-activate or/ 2-immediate or/ 3-cancel or/ 4-cancel Later

const { default: mongoose } = require("mongoose");
const paymentInteg = require("../tools/constants/paymentInteg");

const paymentSchema = new mongoose.Schema({
    name: String,
    description: String,
    index: Number,

    isActive: Boolean,
    type: { enum: [paymentInteg.FAWRY, paymentInteg.WALLET, paymentInteg.PAYMOB], type: String },

    startDate: Date,
    endDate: Date,
    file: { url: String }
}, {
    timestamps: true,
    _v: false
})

const PaymentModel = mongoose.model('payment', paymentSchema)
module.exports = PaymentModel