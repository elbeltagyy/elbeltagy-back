import expressAsyncHandler from 'express-async-handler';
import BookOrderModel from '../models/BookOrderModel.js';
import { getAll, deleteOne, updateOne, getDocCount } from './factoryHandler.js';
import { addBookToUser } from './bookController.js';
import { SUCCESS } from '../tools/statusTexts.js';
import UserModel from '../models/UserModel.js';

const bookParams = (query) => {
    return [
        { key: "book", value: query.book },
        { key: "payment", value: query.payment },
        { key: "status", value: query.status },
        { key: "_id", value: query._id },
        { key: "user", value: query.user },
    ]
}

const getBooksOrders = getAll(BookOrderModel, 'booksOrders', bookParams)
const getBooksOrdersCount = getDocCount(BookOrderModel, bookParams)
const createBookOrder = expressAsyncHandler(async (req, res, next) => {
    const book = req.body.book
    const preUser = req.body.user
    const users = req.body.users || [preUser]

    for (const user of users) {
        await addBookToUser(book, user, 0)
    }
    res.status(201).json({ status: SUCCESS, message: 'تم اضافه الكتاب الي الطالب بنجاح' })
})

const updateBookOrder = updateOne(BookOrderModel)
const deleteBookOrder = expressAsyncHandler(async (req, res, next) => {
    const bookOrderId = req.params.id

    const bookOrder = await BookOrderModel.findById(bookOrderId)
    await Promise.all([
        UserModel.findByIdAndUpdate(
            bookOrder.user,
            { $pull: { books: bookOrder.book } },
        ),
        bookOrder.deleteOne()
    ])

    res.json({ message: 'تم ازاله اشتراك الطالب بنجاح', status: SUCCESS })
})

export { createBookOrder, updateBookOrder, getBooksOrdersCount, getBooksOrders, deleteBookOrder };