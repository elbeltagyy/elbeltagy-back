const createError = require("../tools/createError")
const statusTexts = require("../tools/statusTexts")
const { validationResult } = require('express-validator');

const notFound = ((req, res, next) => {
    const error = createError(`Not found page at ${req.originalUrl}`, 404)
    next(error)
})


const errorrHandler = ((err, req, res, next) => {
    const statusCode = err?.statusCode || err?.error?.statusCode || 500
    // console.log(err)
    const message = err.message || err.error?.message || "connection confused"
    //(err.message.startsWith('Cast to')) && 'Bad Data' ||
    if (err.generated) {
        delete err.generated
        res.status(statusCode).json({ ...err })
    } else {
        res.status(statusCode).json({ message, status: statusTexts.FAILED })
    }
})

const expressValidate = ((req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, status: statusTexts.FAILED })
    }
    next()
})


module.exports = { notFound, errorrHandler, expressValidate }