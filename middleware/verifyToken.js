const asyncHandler = require("express-async-handler")

const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

const UserModel = require("../models/UserModel");
const createError = require("../tools/createError");
const { FAILED } = require("../tools/statusTexts");

// config
dotenv.config()
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET


const verifyToken = asyncHandler(async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization !== 'undefined' && req.headers.authorization.startsWith("Bearer")) {

        try {
            const { userId } = jwt.verify(req.headers.authorization.split(" ")[1], ACCESS_TOKEN_SECRET)
            
            const user = await UserModel.findById(userId)
            if (!user) return next(createError("المستخدم غير مسجل", 401, FAILED, true))
            if (user.isActive) {
                req.user = user
                next()
            } else {
                const inActiveError = createError("حسابك غير مفعل", 401, FAILED, true)
                return next(inActiveError)
            }

        } catch (error) {
            const notAuthed = createError("Session Ended", 403, FAILED)
            return next(notAuthed)
        }

    } else {
        const notAuthed = createError("Bad Credentials", 403, FAILED, true)
        return next(notAuthed)
    }
})

module.exports = verifyToken