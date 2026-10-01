import express from 'express';
const router = express.Router();

import { login, signup, logout, forgetPassword, verifyResetPassword, refreshTokenFc, islogged } from '../controllers/authController.js';

import SessionModel from '../models/SessionModel.js';

import { makeLoginSession } from '../controllers/factoryHandler.js';
import { imageUpload } from '../middleware/storage.js';
import { expressValidate } from '../middleware/errorsHandler.js';
import { loginSchema, signupSchema } from '../middleware/validationSchema.js';

import verifyToken from '../middleware/verifyToken.js';

//config
import 'dotenv/config';

router.post("/login", loginSchema(), expressValidate, login, makeLoginSession())
router.post('/signup', signupSchema(), expressValidate, signup, makeLoginSession()) //imageUpload.single('fileConfirm'),
router.get('/logout', logout)

router.get("/refresh", refreshTokenFc)
router.get('/is_logged', verifyToken(), islogged)

// use rate limit here
router.post('/forget_password', forgetPassword)
router.post('/verify_password', verifyResetPassword)

export default router;
