const expressAsyncHandler = require("express-async-handler");
const ErrorModel = require("../models/ErrorModel");
const { getAll, insertOne } = require("./factoryHandler");
const { FAILED, SUCCESS } = require("../tools/statusTexts");


const params = (query) => {
    return [
        { key: 'message', value: query.message },
        { key: 'stack', value: query.stack },
        { key: 'url', value: query.url },
        { key: 'method', value: query.method },
        { key: 'isOperational', value: query.isOperational },
        { key: 'statusCode', value: query.statusCode },
        { key: 'createdAt', value: query.createdAt },
    ]
}

const getErrors = getAll(ErrorModel, "errors", params);
const createError = insertOne(ErrorModel);

const deleteSameErrors = expressAsyncHandler(async (req, res, next) => {
    const errorId = req.params.id
    const body = req.body

    const errorObj = await ErrorModel.findById(errorId)
    if (!errorObj) return next(createError('The Error Not Found', 404, FAILED))

    const filter = body.isMassive ? { message: errorObj.message, method: errorObj.method } : { message: errorObj.message, url: errorObj.url, method: errorObj.method }

    const result = await ErrorModel.deleteMany(filter)
    res.status(200).json({ message: 'error deleted ' + result.deletedCount, status: SUCCESS })
})

module.exports = {
    getErrors,
    createError, deleteSameErrors,
};
