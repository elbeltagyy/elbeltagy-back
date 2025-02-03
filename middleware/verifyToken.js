const asyncHandler = require("express-async-handler")

const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

const UserModel = require("../models/UserModel");
const createError = require("../tools/createError");
const { FAILED } = require("../tools/statusTexts");
const { user_roles } = require("../tools/constants/rolesConstants");
const SessionModel = require("../models/SessionModel");

// config
dotenv.config()
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET


const verifyToken = (isAllowNotUser = false) => {
    return asyncHandler(async (req, res, next) => {
        if (req.headers.authorization && req.headers.authorization !== 'undefined' && req.headers.authorization.startsWith("Bearer")) {
            try {
                const { sessionId } = jwt.verify(req.headers.authorization.split(" ")[1], ACCESS_TOKEN_SECRET)

                const currentSession = await SessionModel.findById(sessionId).populate('user')
                if (!currentSession) return next(createError('Session Ended, please login again', 401, FAILED, true))
                if (currentSession.logout) return next(createError('Session Ended', 401, FAILED, true))

                const user = currentSession?.user
                if (!user) return next(createError("المستخدم غير مسجل", 401, FAILED, true))

                if (user.isActive) {
                    req.user = user
                    return next()
                } else {
                    const inActiveError = createError("حسابك غير مفعل", 401, FAILED, true)
                    return next(inActiveError)
                }

            } catch (error) {
                const notAuthed = createError("Session Ended", 403, FAILED, true)
                return next(notAuthed)
            }

        } else if (isAllowNotUser) {
            req.user = { role: user_roles.NOT_USER }
            return next()
        } else {
            const notAuthed = createError("غير مسموح بالدخول ", 403, FAILED, true)
            return next(notAuthed)
        }
    })
}

module.exports = verifyToken