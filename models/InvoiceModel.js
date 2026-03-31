const { default: mongoose } = require("mongoose")

const invoiceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    name: String,
    description: String,
    note: String, //From User

    orderId: Number,
    trnxId: String,
    status: String,
    price: Number,
    paymentType: String,//manual - others
    message: String,
    instructions: String, //From payment provider to user on how to pay

    sendFrom: String, //Manual payment - the number or account that the user sent the money from
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'payment', required: true },
    wallet: Number,

    redirectUrl: String, //Visa - the url to redirect the user to for payment
    fawryCode: String,
    meezaReference: String, //Mobile wallets
    meezaQrCode: String, // Mobile wallets

    file: {
        url: { type: String }
    },
    // isActive: Boolean,
    expireDate: Date,

    course: { type: mongoose.Schema.Types.ObjectId, ref: 'course' },
    tag: { type: mongoose.Schema.Types.ObjectId, ref: 'tag' },
    lecture: { type: mongoose.Schema.Types.ObjectId, ref: 'lecture' },
    userInfo: Object,
}, {
    timestamps: true,
    _v: false
})

const InvoiceModel = mongoose.model('invoice', invoiceSchema)
module.exports = InvoiceModel