import mongoose from 'mongoose';
import UserModel from './UserModel.js';
import BookModel from './BookModel.js';


const bookOrderModel = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    book: { type: mongoose.Schema.Types.ObjectId, ref: BookModel },
    payment: { type: Number, default: 0, min: [0, 'القيمة الدنيا هي 0'], },
    status: String, //pending, driven || download
}, {
    timestamps: true,
    versionKey: false
})

const BookOrderModel = mongoose.model("bookOrder", bookOrderModel)
export default BookOrderModel;