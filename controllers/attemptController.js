const expressAsyncHandler = require("express-async-handler")
const AttemptModel = require("../models/AttemptModel")
const { getAll, getOne, deleteOne } = require("./factoryHandler")
const UserModel = require("../models/UserModel")
const CourseModel = require("../models/CourseModel")
const LectureModel = require("../models/LectureModel")
const sectionConstants = require("../tools/constants/sectionConstants")
const createError = require("../tools/createError")
const { FAILED, SUCCESS } = require("../tools/statusTexts")

const attemptParams = (query) => {
    return [
        { key: "mark", value: query.mark, type: 'number' },
        { key: "exam", value: query.exam, operator: 'equal' },
        { key: "user", value: query.user, operator: 'equal' },
        { key: "course", value: query.course, operator: 'equal' },
        { key: "role", value: query.attemptRole },
        // { key: "tokenTime", value: query.tokenTime, type: 'number' },
    ]
}

const getAttempts = getAll(AttemptModel, 'attempts', attemptParams, true, 'user')
const getOneAttempt = getOne(AttemptModel, 'exam')

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
module.exports = { getAttempts, getOneAttempt, getUserInfo, attemptParams }