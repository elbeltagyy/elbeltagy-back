import createError from '../tools/createError.js';
import dotenv from 'dotenv';

import * as statusTexts from '../tools/statusTexts.js';
import { validationResult } from 'express-validator';
import ErrorModel from '../models/ErrorModel.js';

// config
dotenv.config()

const notFound = ((req, res, next) => {
    const error = createError(`Not found page at ${req.originalUrl}`, 404)
    next(error)
})


const errorrHandler = ((err, req, res, next) => {
    const statusCode = err?.statusCode || err?.error?.statusCode || 500

    let message = err.message || err.error?.message || "connection confused"
    if (err.message?.startsWith('Cast to') && process.env.NODE_ENV === 'production') {
        message = 'Invalid Values'
    }

    // Save to DB
    ErrorModel.create({
        message: err.message || err.error?.message || "connection confused",
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        error: err,
        isOperational: err.generated ?? false, statusCode, user: req?.user?._id
    });

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


export { notFound, errorrHandler, expressValidate };