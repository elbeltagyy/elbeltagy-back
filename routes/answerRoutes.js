import { markQuestion, markAttempt, getAnswers, deleteAnswer, updateAnswer } from '../controllers/answerController.js';
import { filterById } from '../controllers/factoryHandler.js';
import { questionParams } from '../controllers/questionController.js';
import { userParams } from '../controllers/userController.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import verifyToken from '../middleware/verifyToken.js';
import QuestionModel from '../models/QuestionModel.js';
import UserModel from '../models/UserModel.js';

import express from 'express';
const router = express.Router();

router.route('/')
    .get(verifyToken(), filterById(UserModel, userParams, 'user'), filterById(QuestionModel, questionParams, 'question'), secureGetAll(), getAnswers)

router.route('/attempt')
    .post(verifyToken(), markAttempt)//for Attempt

router.route('/:id')
    .post(verifyToken(), markQuestion) //for Single Question 
    .put(verifyToken(), updateAnswer)
    .delete(verifyToken(), deleteAnswer)
export default router;