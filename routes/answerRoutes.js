const { markQuestion, markAttempt, getAnswers, deleteAnswer, updateAnswer } = require("../controllers/answerController")
const { filterById } = require("../controllers/factoryHandler")
const { questionParams } = require("../controllers/questionController")
const { userParams } = require("../controllers/userController")
const { secureGetAll } = require("../middleware/secureMiddleware")
const verifyToken = require("../middleware/verifyToken")
const QuestionModel = require("../models/QuestionModel")
const UserModel = require("../models/UserModel")

const router = require("express").Router()

router.route('/')
    .get(verifyToken(), filterById(UserModel, userParams, 'user'), filterById(QuestionModel, questionParams, 'question'), secureGetAll(), getAnswers)

router.route('/attempt')
    .post(verifyToken(), markAttempt)//for Attempt

router.route('/:id')
    .post(verifyToken(), markQuestion) //for Single Question 
    .put(verifyToken(), updateAnswer)
    .delete(verifyToken(), deleteAnswer)
module.exports = router