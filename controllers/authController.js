const asyncHandler = require("express-async-handler")
const UserModel = require("../models/UserModel")

const ms = require('ms')
const bcrypt = require("bcryptjs")

const statusTexts = require("../tools/statusTexts.js")
const createError = require("../tools/createError.js");
const CodeModel = require("../models/CodeModel.js");
const codeConstants = require("../tools/constants/codeConstants.js");
const { user_roles } = require("../tools/constants/rolesConstants.js");
const SessionModel = require("../models/SessionModel.js");
const { generateRefreshToken } = require("../middleware/generateRefreshToken.js");
const { generateAccessToken } = require("../middleware/generateAccessToken.js");
const clearTokens = require("../tools/clearTokens.js")



const { makeLoginSession, useCode } = require("./factoryHandler.js")
const { addToCloud } = require("../middleware/cloudinary.js")




// @desc user login
// @route POST /login
// @access Public   
const login = asyncHandler(async (req, res, next) => {
    const { userName, password } = req.body

    const select = 'grade userName name password avatar email  phone familyPhone isActive government role totalPoints wallet devicesAllowed devicesRegistered'
    const user = await UserModel.findOne({ userName }).select(select)

    if (!user) return next(createError("لم يتم العثور على المستخدم", 404, statusTexts.FAILED))
    if (user?.role === user_roles?.INREVIEW) return next(createError("حسابك تحت المراجعه, سيتم تفعيله فى اقل من 24 ساعه", 401, statusTexts.FAILED))

    const isTruePass = await bcrypt.compare(password, user.password)
    if (!isTruePass) return next(createError("كلمة المرور خاطئه", 400, statusTexts.FAILED))

    if (!user.isActive) {
        const error = createError("عذرًا, حسابك غير مفعل", 401, statusTexts.FAILED)
        return next(error)
    }

    req.user = user
    next()
})

// @desc user signup
// @route POST /signup
// @access Public   
const signup = asyncHandler(async (req, res, next) => {
    const { phone, code, password } = req.body

    const foundUser = await UserModel.findOne({ phone })
    if (foundUser) {
        const error = createError("هذا الرقم غير صالح !", 400, statusTexts.FAILED)
        return next(error)
    }

    const foundCode = await CodeModel.findOne({ code, numbers: { $ne: 0 } })
    if (!foundCode && code) return next(createError("هذا الكود غير صالح, فى حاله ليس لديك كود اعد المحاوله دون ارسال الكود وانتظر حتى تفعيل الحساب", 400, statusTexts.FAILED))

    const hashedPassword = bcrypt.hashSync(password, 10)
    const user = new UserModel({
        ...req.body, password: hashedPassword, role: user_roles.INREVIEW, userName: phone
    })

    //file confirm
    const file = req.file
    let fileConfirm = {}
    if (file) {
        const result = await addToCloud(file, {
            folder: 'filesConfirm',
            resource_type: "auto"
        })

        if (result) {
            const { original_filename, resource_type, secure_url, url, format, bytes } = result
            fileConfirm = { original_filename, resource_type, secure_url, url, format, size: bytes }
            user.fileConfirm = fileConfirm
        }
    }

    if (foundCode) {
        const codeRes = await useCode(foundCode, user, next)
        if (codeRes) {
            if (user.role === user_roles.INREVIEW) {
                user.role = user_roles.ONLINE
            }
            req.user = user
            return next()
        }
    } else { // no codes , put inreview role
        await user.save()
        return res.status(201).json({ status: statusTexts.SUCCESS, message: "تم اضافه المستخدم بنجاح, سيتم التفعيل فى اقل من 24 ساعه!" })
    }
})

const logout = asyncHandler(async (req, res, next) => {

    if (req.cookies.refreshToken) { //signedCookies
        const refreshToken = req.cookies.refreshToken ////signedCookies
        const session = await SessionModel.findOne({ refreshToken })

        await clearTokens(req, res)

        if (session) {
            const nowDate = new Date()

            session.logout = nowDate
            await session.save()

            return res.status(204).json()
        } else {
            return next(createError('Something went wrong', 500, statusTexts.FAILED, true))
        }

    } else {
        return next(createError('Something went wrong', 500, statusTexts.FAILED, true))
    }
})
module.exports = { login, signup, logout }