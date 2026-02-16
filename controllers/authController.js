const asyncHandler = require("express-async-handler")
const UserModel = require("../models/UserModel")

const bcrypt = require("bcryptjs")
const crypto = require("crypto");

const statusTexts = require("../tools/statusTexts.js")
const createError = require("../tools/createError.js");
const CodeModel = require("../models/CodeModel.js");
const { user_roles } = require("../tools/constants/rolesConstants.js");
const SessionModel = require("../models/SessionModel.js");
const { generateAccessToken } = require("../middleware/generateAccessToken.js");
const clearTokens = require("../tools/clearTokens.js")


const jwt = require('jsonwebtoken');
const { useCode } = require("./factoryHandler.js")
const { uploadFile } = require("../middleware/upload/uploadFiles.js")
const senderConstants = require("../tools/constants/sendersConstants.js");
const sendEmail = require("../tools/sendEmail.js");
const { sendWhatsMsgFc } = require("./whatsappController.js");
const { arLang } = require("../tools/constants/arLang.js");

// @desc user login
// @route POST /login
// @access Public   
const login = asyncHandler(async (req, res, next) => {
    const { userName, password } = req.body

    const select = 'grade userName name password avatar email  phone familyPhone isActive government role totalPoints wallet devicesAllowed devicesRegistered groups exam_marks marks'
    const user = await UserModel.findOne({ userName }).select(select)

    if (!user) return next(createError("هناك خطا فى البيانات المدخله", 404, statusTexts.FAILED))
    if (user?.role === user_roles?.INREVIEW) return next(createError("حسابك تحت المراجعه, سيتم تفعيله فى اقل من 24 ساعه", 401, statusTexts.FAILED))

    const isTruePass = await bcrypt.compare(password, user.password)
    if (!isTruePass) return next(createError("هناك خطا فى البيانات المدخله", 400, statusTexts.FAILED))

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

        if (foundUser.role === user_roles.INREVIEW && code) {

            const foundCode = await CodeModel.findOne({ code, numbers: { $ne: 0 } })
            await useCode(foundCode, foundUser)

            const hashedPassword = bcrypt.hashSync(password, 10)
            const user = await UserModel.findOneAndUpdate({ _id: foundUser._id },
                { ...req.body, password: hashedPassword }
            )
            req.user = user
            return next()
        }

        const error = createError("هذا الرقم مسجل بالفعل !", 400, statusTexts.FAILED)
        return next(error)
    }

    const foundCode = await CodeModel.findOne({ code, numbers: { $ne: 0 } })
    if (!foundCode && code) return next(createError("هذا الكود غير صالح, فى حاله ليس لديك كود اعد المحاوله دون ارسال الكود وانتظر حتى تفعيل الحساب", 400, statusTexts.FAILED))

    const hashedPassword = bcrypt.hashSync(password, 10)
    const user = new UserModel({
        ...req.body, password: hashedPassword, role: user_roles.ONLINE, userName: phone
    })

    //file confirm
    // const file = req.file
    // if (file) {
    //     const fileConfirm = await uploadFile(file, {
    //         name: user.userName,
    //         secure: true
    //     })
    //     user.fileConfirm = fileConfirm
    // }

    if (foundCode) {
        const codeRes = await useCode(foundCode, user)
        if (codeRes) {
            if (user.role === user_roles.INREVIEW) {
                user.role = user_roles.ONLINE
            }
        }
    }

    await user.save()
    req.user = user
    return next()
})

const logout = asyncHandler(async (req, res, next) => {

    // if (req.cookies.refreshToken) { //signedCookies
    const refreshToken = req.cookies?.refreshToken ////signedCookies
    const session = await SessionModel.findOne({ refreshToken })

    await clearTokens(req, res)

    if (session) {
        const nowDate = new Date()

        session.logout = nowDate
        session.isLoggedOutAutomatic = false
        await session.save()

        return res.status(204).json()
    } else {
        return next(createError('Something went wrong', 500, statusTexts.FAILED, true))
    }

    // } else {
    //     return next(createError('Something went wrong', 500, statusTexts.FAILED, true))
    // }
})

const islogged = asyncHandler(async (req, res, next) => {
    const user = req.user
    if (user.role === user_roles.NOT_USER) {
        return res.status(204).json()
    }
    res.status(200).json({ status: statusTexts.SUCCESS, values: user })
})

const refreshTokenFc = asyncHandler(async (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken //signedCookies

    const { sessionId } = jwt.verify(refreshToken.split(" ")[1], process.env.REFRESH_TOKEN_SECRET)

    const currentSession = await SessionModel.findById(sessionId)

    if (!currentSession) {
        await clearTokens(req, res)
        return next(createError('Bad Credentials', 400, FAILED, true))
    }

    if (currentSession.logout) {
        await clearTokens(req, res)
        return next(createError('Session ended, please login again', 400, FAILED, true))
    }

    const accessToken = generateAccessToken({ sessionId: currentSession._id })

    res.status(200).json({
        status: statusTexts.SUCCESS, token: accessToken
    })
})

const forgetPassword = asyncHandler(async (req, res, next) => {

    //1) get email to send resetCode.
    const user = await UserModel.findOne({ userName: req.body.userName });
    if (!user) return next(createError('هناك خطا فى اسم المستخدم', 404, statusTexts.FAILED));

    if (user.ResetCodeAt) {
        let currentTime = new Date();
        if ((user.ResetCodeAt.getTime() + (1 * 60000)) >= currentTime) {
            // You should wait 1 minute from previous attempt
            return next(createError("من فضلك انتظر دقيقه لارسال رمز اخر"))
        }
    }

    //2) if this email is exists, Generate random 6 numbers and save in DB .
    const resetCode = Math.floor(Math.random() * 900000) + 100000;
    const hash = crypto
        .createHash("sha256")
        .update(resetCode.toString()) // convert resetCode to string
        .digest("hex");

    // save resetCode into DB
    user.ResetCode = hash;
    //Add expiration time to reset code (10min)
    user.ResetCodeAt = Date.now();
    user.ResetCodeVerified = false;
    await user.save();

    //3) send resetCode to email.
    const message = `Dear ${user.name},

    We have received a request to reset the password for your email account associated with this email address. To proceed with resetting your password, please use the following 6-digit verification code:
    
     <h4>${resetCode}</h4>
    
    Please enter this code on the password reset page to verify your identity and continue the password reset process. This code will expire in 10 minutes for security reasons, so be sure to use it before then.
    
    If you did not make this request, please ignore this message.
    
    If you have any questions or concerns, please contact our support team at ${arLang.LOGO_EN} platform.
    
    Thank you,
    ${arLang.LOGO_EN} platform`;

    const forgetMethod = req.body.method || senderConstants.EMAIL
    try {

        if (forgetMethod === senderConstants.EMAIL) {
            await sendEmail({
                email: user.email,
                subject: "Your Password Reset Code",
                html: message
            });
            return res.status(200).json({ status: statusTexts.SUCCESS, message: 'تم ارسال رمز التحقق على الايميل الخاص بك' });
        }

        if (forgetMethod === senderConstants.WHATSAPP) {
            const message = 'رمز التحقق هو: ' + resetCode + ' ' + "يرجى عدم مشاركته مع احد !"
            await sendWhatsMsgFc(user.phone, message)
            return res.status(200).json({ status: statusTexts.SUCCESS, message: 'تم ارسال رمز التحقق على واتس اب' });
        } else {
            return next(createError("حدث خطا", 500, statusTexts.FAILED));
        }
    } catch (err) {
        user.ResetCode = undefined;
        user.ResetCodeExpireAt = undefined;
        user.ResetCodeVerified = undefined;
        await user.save();
        return next(createError("حدث خطا اثناء ارسال رمز التاكيد بواسطه " + forgetMethod, 500, statusTexts.FAILED));
    }
})

const verifyResetPassword = asyncHandler(async (req, res, next) => {
    const hashedResetCode = crypto
        .createHash("sha256")
        .update(req.body.resetCode) // convert resetCode to string
        .digest("hex");

    //User should resetCodeAt least 10 minutes before
    const user = await UserModel.findOne({ userName: req.body.userName });
    if (!user || !user?.ResetCode || !user?.ResetCodeAt) return next(createError('هناك خطا فى اسم المستخدم', 404, statusTexts.FAILED));
    if (user.ResetCode?.toString() !== hashedResetCode.toString()) return next(createError("كود التحقق غير صحيح", 401, statusTexts.FAILED))
    if ((user.ResetCodeAt.getTime() + (10 * 60 * 1000)) <= new Date()) return next(createError("انتهت صلاحيه الكود", 401, statusTexts.FAILED))

    const hashedPassword = bcrypt.hashSync(req.body.password, 10)
    user.password = hashedPassword;
    user.ResetCode = undefined;
    user.ResetCodeVerified = undefined;
    await user.save();

    return res
        .status(200)
        .json({ status: statusTexts.SUCCESS, message: "تم تحديث الباسورد بنجاح, بالرجاء تسجيل الدخول" });
})

module.exports = { login, signup, logout, islogged, refreshTokenFc, forgetPassword, verifyResetPassword }