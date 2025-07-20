const router = require("express").Router()

const { login, signup, logout, forgetPassword, verifyResetPassword, refreshTokenFc, islogged } = require("../controllers/authController")

const SessionModel = require("../models/SessionModel");

const { makeLoginSession } = require("../controllers/factoryHandler");
const { imageUpload } = require("../middleware/storage");
const { expressValidate } = require("../middleware/errorsHandler");
const { loginSchema, signupSchema } = require("../middleware/validationSchema");

const verifyToken = require("../middleware/verifyToken");

//config
require("dotenv").config()

router.post("/login", loginSchema(), expressValidate, login, makeLoginSession())
router.post('/signup',  signupSchema(), expressValidate, signup, makeLoginSession()) //imageUpload.single('fileConfirm'),
router.get('/logout', logout)

router.get("/refresh", refreshTokenFc)
router.get('/is_logged', verifyToken(), islogged)

// use rate limit here
router.post('/forget_password', forgetPassword)
router.post('/verify_password', verifyResetPassword)

module.exports = router
