const expressAsyncHandler = require("express-async-handler")
const BookOrderModel = require("../models/BookOrderModel")
const { getAll, deleteOne, updateOne, getDocCount } = require("./factoryHandler")
const { addBookToUser } = require("./bookController")
const { SUCCESS } = require("../tools/statusTexts")
const UserModel = require("../models/UserModel")

const bookParams = (query) => {
    return [
        { key: "book", value: query.book },
        { key: "payment", value: query.payment },
        { key: "status", value: query.status },
        { key: "_id", value: query._id },
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

module.exports = {
    createBookOrder, updateBookOrder, getBooksOrdersCount,
    getBooksOrders, deleteBookOrder
}