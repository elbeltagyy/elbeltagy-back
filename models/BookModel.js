const mongoose = require("mongoose")

const BookSchema = new mongoose.Schema({
    grade: { type: Number, required: true },
    title: String,
    description: String,
    color: String,

    price: Number,
    discount: Number,
    copies: Number, //Allowed Copies
    numbers: { type: Number, default: 0 }, // used Numbers

    isActive: Boolean,
    type: String, //physical, download
    url: String,
    avatar: {
        url: { type: String },
        resource_type: { type: String },
        format: { type: String }
    },
    file: {
        url: { type: String },
        resource_type: { type: String },
        format: { type: String }
    },

}, {
    timestamps: true,
    versionKey: false
})

const BookModel = mongoose.model("book", BookSchema)
module.exports = BookModel