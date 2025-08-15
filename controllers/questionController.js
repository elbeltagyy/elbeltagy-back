const { insertOne, getAll, deleteOne, updateOne } = require('./factoryHandler');
const QuestionModel = require('../models/QuestionModel');
const AnswerModel = require('../models/AnswerModel');
const AttemptModel = require('../models/AttemptModel');
const { SUCCESS } = require('../tools/statusTexts');
const ExamModel = require('../models/ExamModel');
const getAttemptMark = require('../tools/getAttemptMark');
const UserModel = require('../models/UserModel');
const expressAsyncHandler = require('express-async-handler');
const shuffleArray = require('../tools/fcs/shuffleArray');
const { user_roles } = require('../tools/constants/rolesConstants');


const questionParams = (query) => {
    return [
        { key: "title", value: query.title },
        { key: "hints", value: query.hints },
        { key: "points", value: query.points, type: 'number' },
        { key: "_id", value: query._id, operator: 'equal' },
        { key: "grade", value: query.grade, operator: 'equal' },
        { key: "tags", value: query.tags, operator: 'equal' },
        { key: "isActive", value: query.isActive },
        { key: "createdAt", value: query.createdAt },
    ]
}
const secureRtOption = (req, values) => {
    const user = req.user
    const qs = values.questions

    if (user.role === user_roles.ONLINE || user.role === user_roles.STUDENT) {
        values.questions = qs.map(q => {
            delete q.rtOptionId
            return q
        })
    }
    return values
}
const getQuestions = getAll(QuestionModel, 'questions', questionParams, true, '', secureRtOption)

const createQuestion = insertOne(QuestionModel)
const updateQuestion = updateOne(QuestionModel)
const deleteQuestion = deleteOne(QuestionModel, [], [
    { model: AnswerModel, field: 'question' }
], 'image')

//=============linking ====#
// @desc add tags to one Question
// @route POST /questions/:id/tags
// @access Private
const linkQuestionToTags = expressAsyncHandler(async (req, res, next) => {
    const question = req.params.id
    const tags = req.body.tags

    await QuestionModel.updateOne({ _id: question }, { $addToSet: { tags } })
    res.status(200).json({ message: 'تم ايضافه الروابط بنجاح', status: SUCCESS })
})

// @desc delete tags from one Question
// @route DELETE /questions/:id/tags
// @access Private
const unLinkQuestionToTags = expressAsyncHandler(async (req, res, next) => {
    const question = req.params.id
    const tags = req.body.tags

    await QuestionModel.updateOne(
        { _id: question },
        { $pull: { tags: { $in: tags } } }
    );
    res.status(200).json({ message: 'تم ازاله الروابط بنجاح', status: SUCCESS })
})

// For Many
const createManyQuestions = expressAsyncHandler(async (req, res, next) => {
    const questionsData = req.body || []
    const handledQs = questionsData.map(q => {
        if (q.isShuffle) {
            const options = shuffleArray(q.options)
            q.options = options
        }
        return q
    });
    const questions = await QuestionModel.insertMany(handledQs)
    return res.status(200).json({ message: 'تم انشاء ' + questions.length + ' اسئله', status: SUCCESS })
})

//@desc Question Bank Handel
//@routes POST /questions/bank //has Body
//@access public ==> user
const startQuestionsBank = expressAsyncHandler(async (req, res, next) => {
    const { number = 5, tags = [], method } = req.body //Number => 50
    const user = req.user

    const answeredQuestionIds = await AnswerModel.find({ user: user._id }).distinct('question').lean()

    // Distribute `number` across tags
    const baseCount = Math.floor(number / tags.length);
    const remainder = number % tags.length;

    // Calculate question counts per tag
    const tagLimits = tags.map((tag, index) => ({
        tag,
        limit: baseCount + (index < remainder ? 1 : 0)
    }));
    // Fetch questions for each tag with their limit
    const fetchQuestions = await Promise.all(
        tagLimits.map(({ tag, limit }) =>
            QuestionModel
                .find({ tags: tag, _id: { $nin: answeredQuestionIds }, isActive: true })
                .limit(limit)
                .lean()
        )
    );

    const flattened = fetchQuestions.flat()
    if (flattened.length === 0) return res.status(404).json({ message: 'لا يوجد اسئله, لقد قمت بالايجابه على جميع الاسئله' })
    const { questions } = secureRtOption(req, { questions: flattened })

    res.status(200).json({ values: questions, message: 'تم الحصول على عدد ' + questions?.length + ' اسئله' })
})

module.exports = {
    getQuestions, createQuestion, updateQuestion, deleteQuestion, questionParams,
    createManyQuestions,
    linkQuestionToTags, unLinkQuestionToTags,

    //user
    startQuestionsBank
}