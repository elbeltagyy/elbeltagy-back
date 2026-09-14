const BookModel = require("../models/BookModel");
const { deleteOne, getAll, insertOne, updateOne, getDocCount } = require("./factoryHandler");
const UserModel = require("../models/UserModel");
const BookOrderModel = require("../models/BookOrderModel");
const { PAID, PENDING } = require("../tools/statusTexts");
const { user_roles } = require("../tools/constants/rolesConstants");

const bookParams = (query) => {
    return [
        { key: "title", value: query.title },
        { key: "description", value: query.description },
        { key: "isActive", value: query.isActive },
        { key: "price", value: query.price },
        { key: "type", value: query.type },
        { key: "grade", value: query.grade },
        { key: "_id", value: query._id },

    ]
}

const relatedFiles = ['avatar', 'file']
const bookRelatedModels = [
    { model: BookOrderModel, field: 'book' },
];

const secureLink = (req, values) => {
    const user = req.user
    if (![user_roles.ADMIN, user_roles.SUBADMIN].includes(user.role)) {
        return {
            count: values.count,
            books: values.books?.map(v => {
                delete v.url
                delete v.file
                return v
            })
        }
    }
    return values
}

const getBooks = getAll(BookModel, 'books', bookParams, true, '', secureLink)
const countBooks = getDocCount(BookModel, bookParams)
const updateBook = updateOne(BookModel)

const createBook = insertOne(BookModel)
const deleteBook = deleteOne(BookModel, null, bookRelatedModels, relatedFiles)

const addBookToUser = async (bookId, userId, payment) => {
    const book = await BookModel.findById(bookId).lean()
    if (!book) throw new Error('Book Not Found')

    const status = book.type === 'physical' ? PENDING : PAID
    let [order] = await Promise.all([
        BookOrderModel.insertOne({
            user: userId, book: book._id,
            payment, status
        }),
        UserModel.updateOne({ _id: userId }, {
            $addToSet: {
                books: book._id
            }
        }),
        BookModel.updateOne(
            { _id: bookId },
            { $inc: { numbers: 1 } }
        ),
    ])
    const modifiedOrder = { ...order._doc, book }
    return modifiedOrder
}

const removeBookFromUser = async (bookId, userId) => {
    await UserModel.updateOne({ _id: userId }, {
        $pull: {
            books: bookId
        }
    })

    await BookOrderModel.deleteOne({ user: userId, book: bookId })
    return true
}

module.exports = {
    getBooks, updateBook, createBook, deleteBook, countBooks,
    addBookToUser, removeBookFromUser
}