const expressAsyncHandler = require("express-async-handler")
const ExamModel = require("../models/ExamModel")
const QuestionModel = require("../models/QuestionModel")
const _ = require('lodash')
const shuffleArray = require("../tools/fcs/shuffleArray")
const LectureModel = require("../models/LectureModel")
const { SUCCESS } = require("../tools/statusTexts")
const { reCorrectAnswersLimited } = require("./answerController")

// @route /content/exams || /:id
// @method POST || PUT
const handelExam = expressAsyncHandler(async (req, res, next) => {
    // lecture => exam => questions
    const exam = req.body // {name, desc, questions = []} --+> {name, des, exam = {q = []}}
    const updatedQuestions = await Promise.all(
        exam.questions.map(async q => {
            const isLinked = q._id && exam.linkedQuestions && exam.linkedQuestions?.some(lq => lq._id === q._id) && q.notSchema

            if (isLinked) {
                const existing = exam.linkedQuestions?.find(lq => lq._id === q._id)
                //Handel Values *_*
                const notChanged = _.isEqual(existing, q);

                if (notChanged) {
                    q = existing._id
                    return q
                } else {
                    //has Changed And Create A new Question
                    delete q._id
                    delete q.__v
                    delete q.createdAt
                    delete q.updatedAt
                    q.options.forEach(opt => {
                        delete opt._id
                    });
                }
            } else if (q._id) {
                //only in Update question (PUT Req)
                // *_* edit Scores For Q
                await reCorrectAnswersLimited(q)
                await QuestionModel.updateOne({ _id: q._id }, q)
                return q._id
            }

            if (typeof q !== 'string') {
                if (q.isShuffle) {
                    const options = shuffleArray(q.options)
                    q.options = options
                }
                if (!q.grade) {
                    q.grade = exam.grade
                }
                const saved = await QuestionModel.insertOne(q)
                q = saved._id
            }
            return q
        })
    );

    exam.questions = updatedQuestions
    return next()
})

const createExamAndLecture = expressAsyncHandler(async (req, res, next) => {
    const exam = req.body // pre Handled Questions

    const storedExam = await ExamModel.create(exam)
    req.body.exam = storedExam._id
    next()
})


const updateExam = expressAsyncHandler(async (req, res, next) => {
    const lectureId = req.params.id
    const exam = req.body

    const lecture = await LectureModel.findByIdAndUpdate(lectureId, exam, { new: true })
    const updatedExam = await ExamModel.findByIdAndUpdate(lecture.exam, exam, { new: true })
    await updatedExam.populate('questions')
    res.json({ message: 'تم تعديل الاختبار بنجاح', status: SUCCESS, values: { lecture, updatedExam } })
})



module.exports = { handelExam, createExamAndLecture, updateExam }