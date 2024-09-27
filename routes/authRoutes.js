const { login, signup, logout } = require("../controllers/authController")

const router = require("express").Router()
const createError = require("../tools/createError");
const expressAsyncHandler = require("express-async-handler");
const SessionModel = require("../models/SessionModel");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const { generateAccessToken } = require("../middleware/generateAccessToken");
const jwt = require('jsonwebtoken');
const { makeLoginSession } = require("../controllers/factoryHandler");

const { expressValidate } = require("../middleware/errorsHandler");
const { loginSchema, signupSchema } = require("../middleware/validationSchema");
const upload = require("../middleware/storage");
const clearTokens = require("../tools/clearTokens");

//config
require("dotenv").config()

router.post("/login", loginSchema(), expressValidate, login, makeLoginSession())

router.post('/signup', upload.single('fileConfirm'), signupSchema(), expressValidate, signup, makeLoginSession())
router.get('/logout', logout)

router.get("/refresh", expressAsyncHandler(async (req, res, next) => {
    const refreshToken = req.signedCookies?.refreshToken

    const storedToken = await SessionModel.findOne({ refreshToken })

    if (!storedToken) {
        await clearTokens(req, res)
        return next(createError('Bad Credentials', 400, FAILED, true))
    }

    if (storedToken.logout) {
        await clearTokens(req, res)
        return next(createError('Session end, please login again', 400, FAILED, true))
    }

    const { userId } = jwt.verify(refreshToken.split(" ")[1], process.env.REFRESH_TOKEN_SECRET)

    const accessToken = generateAccessToken({ userId })
    res.status(200).json({
        status: SUCCESS, token: accessToken
    })
}))

module.exports = router
