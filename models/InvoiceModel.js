const { default: mongoose } = require("mongoose")

const invoiceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    name: String,
    description: String,
    note: String,
    sendFrom: String,
    // index: Number,
    orderId: Number,
    trnxId: Number,

    price: Number,
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'payment', required: true },
    status: String,
    message: String,

    file: {
        url: { type: String }
    },
    // isActive: Boolean,
    // endDate: Date,
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'course' },
    tag: { type: mongoose.Schema.Types.ObjectId, ref: 'tag' },
    lecture: { type: mongoose.Schema.Types.ObjectId, ref: 'lecture' },
    // isWallet: Boolean,
    wallet: Number,
}, {
    timestamps: true,
    _v: false
})

const InvoiceModel = mongoose.model('invoice', invoiceSchema)
module.exports = InvoiceModel