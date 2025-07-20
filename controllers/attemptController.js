const expressAsyncHandler = require("express-async-handler")
const AttemptModel = require("../models/AttemptModel")
const { getAll, getOne, deleteOne } = require("./factoryHandler")
const UserModel = require("../models/UserModel")
const CourseModel = require("../models/CourseModel")
const LectureModel = require("../models/LectureModel")
const sectionConstants = require("../tools/constants/sectionConstants")
const createError = require("../tools/createError")
const { FAILED, SUCCESS } = require("../tools/statusTexts")
const ExamModel = require("../models/ExamModel")
const { getExamMethod } = require("../tools/constants/examMethod")

const attemptParams = (query) => {
    return [
        { key: "mark", value: query.mark, type: 'number' },
        { key: "exam", value: query.exam, operator: 'equal' },
        { key: "user", value: query.user, operator: 'equal' },
        { key: "course", value: query.course, operator: 'equal' },
        { key: "role", value: query.role },
        // { key: "tokenTime", value: query.tokenTime, type: 'number' }, *_*
    ]
}

const populateAttempt = [
    {
        path: 'exam',
        populate: 'questions'
    }, { path: 'answers' }
]
const getAttempts = getAll(AttemptModel, 'attempts', attemptParams, true, 'user')
const getOneAttempt = getOne(AttemptModel, populateAttempt)

const startAttempt = expressAsyncHandler(async (req, res, next) => {
    const exam = req.body.exam
    const courseId = req.body.courseId
    const user = req.user

    const foundExam = await ExamModel.findById(exam).lean()
    const examId = foundExam._id
    if (!foundExam) return next(createError("The exam is not found", 404, FAILED))

    const countAttempts = await AttemptModel.countDocuments({ exam, user: user._id })

    if (countAttempts >= exam.attemptsNums) {
        return res.status(400).json({ message: 'لقد انتهت كل محاولاتك', status: FAILED })
    } else {
        let attempt = null
        if (foundExam.method === getExamMethod({ methodValue: 'question', key: 'value' })) {
            [attempt] = await Promise.all([
                AttemptModel.create({
                    exam: examId, user: user._id, role: user.role, course: courseId
                }),
                UserModel.updateOne(
                    { _id: user._id },
                    { $addToSet: { exams: examId } }, // $addToSet prevents duplicates
                    { new: true } // returns the updated user
                ).lean()])
        }
        res.status(200).json({ values: { attempt }, status: SUCCESS })
    }
})

const getUserInfo = expressAsyncHandler(async (req, res, next) => {
    const userId = req.params.id
    const user = await UserModel.findById(userId).select('exams courses').lean() //
    if (!user) return next(createError("لم يتم العثور على المستخدم", 404, FAILED))

    const courses = await CourseModel.find({ _id: { $in: user.courses } }).select('linkedTo name').lean()

    let coursesIds = courses.reduce((ids, course) => {
        ids.push(course._id)
        if (Array.isArray(course.linkedTo) && course.linkedTo?.length !== 0) {
            ids = [...ids, ...course.linkedTo]
        }
        return ids
    }, [])
    const populateLecture = [
        {
            path: 'exam',
            select: 'time'
        }
    ]

    const populateAttempt = [
        {
            path: 'exam', select: 'time name questions'
        }
    ]
    //attempts
    const userAttempts = await AttemptModel.find({ user: user._id }).lean().populate(populateAttempt)
    const attemptsNot = await LectureModel.find({ // isActive: true
        course: { $in: coursesIds }, exam: { $nin: user.exams },
        sectionType: sectionConstants.EXAM,
    }).populate(populateLecture)
    res.status(200).json({ status: SUCCESS, values: { attempts: userAttempts, examsNotDid: attemptsNot } })
})

const deleteOneAttempt = deleteOne(AttemptModel)
module.exports = { getAttempts, getOneAttempt, startAttempt, getUserInfo, attemptParams, deleteOneAttempt }