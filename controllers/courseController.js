const expressAsyncHandler = require("express-async-handler");
const CourseModel = require("../models/CourseModel");
const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const { addToCloud } = require("../middleware/upload/cloudinary");
const mongoose = require('mongoose');
const LectureModel = require("../models/LectureModel");
const UserCourseModel = require("../models/UserCourseModel");
const { user_roles } = require("../tools/constants/rolesConstants");
const { SUCCESS, FAILED } = require("../tools/statusTexts");
const createError = require("../tools/createError");
const sectionConstants = require("../tools/constants/sectionConstants");
const UserModel = require("../models/UserModel");
const ExamModel = require("../models/ExamModel");
const AttemptModel = require("../models/AttemptModel");
const getAttemptMark = require("../tools/getAttemptMark");
const { ObjectId } = require('mongodb');
const { uploadFile, deleteFile } = require("../middleware/upload/uploadFiles");
const lockLectures = require("../tools/lockLectures");
const CouponModel = require("../models/CouponModel");
const codeConstants = require("../tools/constants/codeConstants");


const coursesParams = (query) => {
    return [
        { key: "grade", value: query.grade, operator: "equal" },
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "price", value: query.price },
        { key: "preDiscount", value: query.preDiscount },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "unit", value: query.unit, operator: "equal" },
        { key: "index", value: query.index, operator: "equal" },
    ]
}
const createCourse = insertOne(CourseModel, true)
const getCourses = getAll(CourseModel, 'courses', coursesParams, false) //user admin
const getOneCourse = getOne(CourseModel, 'linkedTo', [
    { path: 'linkedTo', select: 'name _id' }
])
const updateCourse = updateOne(CourseModel)
const deleteCourse = deleteOne(CourseModel)

//route /content/courses/:id
//method Delete
const checkDeleteCourse = expressAsyncHandler(async (req, res, next) => {
    const courseId = req.params.id
    const foundUserCourse = await UserCourseModel.findOne({ course: courseId })
    if (foundUserCourse) return next(createError("هناك اشتراكات فى هذا الكورس, يجب حذف جميع الاشتراكات", 400, FAILED))

    const lecture = await LectureModel.findOne({ course: courseId })
    if (lecture) return next(createError("هناك محاضرات فى هذا الكورس, يجب حذف جميع المحاضرات", 400, FAILED))

    const course = await CourseModel.findById(courseId)
    if (course.thumbnail) {
        await deleteFile(course.thumbnail)
    }

    await CouponModel.deleteMany({
        course: courseId
    })
    next()
})
// @desc push course
// @route POST /content/courses/:id/link
// @access Private   ==> admin/subAdmin
const linkCourse = expressAsyncHandler(async (req, res, next) => {
    const courseId = req.params.id
    const linkers = req.body.linkers

    const updateCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        { linkedTo: linkers, isLinked: linkers.length !== 0 ? true : false },
        { new: true }
    )

    res.status(200).json({ values: updateCourse, status: SUCCESS, message: 'تم التعديل بنجاح' })
})

const uploadCourseImg = expressAsyncHandler(async (req, res, next) => {

    const thumbnail = req.file

    if (thumbnail) {
        const uploadedThumbnail = await uploadFile(thumbnail, {
            folder: 'courses',
            resource_type: "auto",
            secure: true,
            name: req.body?.name
        })
        req.body.thumbnail = uploadedThumbnail
    } else {
        delete req.body.thumbnail
    }
    next()
})

// @desc get one user 
// @route get /content/courses/:index/lectures
// @access Public   ==> admin/user/subAdmin/not
const getCourseLecturesAndCheckForUser = expressAsyncHandler(async (req, res, next) => {
    const index = req.params.id
    const user = req.user

    const currentCourse = await CourseModel.findOne({ index }).lean()
    const courseId = currentCourse._id

    const userCourse = await UserCourseModel.findOne({ course: courseId, user: user?._id }).lean()

    const [course, lectures] = await lockLectures(currentCourse, userCourse)
    return res.status(200).json({ status: SUCCESS, values: { course, lectures, currentIndex: userCourse?.currentIndex || 0 } })
})

//@desc user Subscribe to course
//@routes GET /content/courses/:id/subscribe
//@access Private   ==> user
const subscribe = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const courseId = req.params.id
    const coupon = req.body.coupon

    const isUserSubscribed = await UserCourseModel.findOne({ user: user._id, course: courseId }).lean()
    if (isUserSubscribed) {
        return next(createError('انت بالفعل مشترك بالكورس', 400, FAILED))
    }

    const currentCourse = await CourseModel.findById(courseId).lean()
    let foundCoupon = null
    if (coupon) {
        foundCoupon = await CouponModel.findOne({ isActive: true, coupon, usedBy: { $nin: [user._id] }, numbers: { $gte: 1 } })
        if (!foundCoupon) return next(createError("الكوبون غير صالح", 404, FAILED))

        const course = new mongoose.Types.ObjectId(courseId);
        if ((foundCoupon.type === codeConstants.PRIVATE || foundCoupon.course) && !foundCoupon.course.equals(course)) return next(createError("الكوبون غير صالح", 404, FAILED))

        const couponDiscount = foundCoupon.discount
        const coursePrice = currentCourse.price
        const coursePriceAfterDiscount = (coursePrice - ((couponDiscount / 100) * coursePrice))
        currentCourse.price = coursePriceAfterDiscount

        foundCoupon.usedBy.push(user._id)
        foundCoupon.numbers = foundCoupon.numbers - 1
    }

    if (currentCourse?.price > user.wallet) {
        return next(createError('المحفظه لا تكفى, بالرجاء شحن مبلغ ' + (currentCourse.price - user.wallet) + ' جنيه', 400, FAILED))
    }

    user.wallet = user.wallet - currentCourse.price

    const userCourse = await UserCourseModel.create({
        user: user._id,
        course: currentCourse._id,
        payment: currentCourse.price
    })

    await UserModel.updateOne({ _id: user._id }, {
        $push: { courses: currentCourse._id },
        $set: { wallet: user.wallet }
    })

    if (foundCoupon) {
        await foundCoupon.save() //
    }

    const [course, lectures] = await lockLectures(currentCourse, userCourse)
    res.status(200).json({ status: SUCCESS, values: { course, lectures, currentIndex: userCourse.currentIndex, wallet: user.wallet }, message: 'تم الاشتراك بنجاح فى كورس ' + course.name })
})

//@desc Lecture for subscribed user and populate it
//@routes GET /content/courses/:id/lectures/:lectureId
//@access Private   ==> user
const getLectureAndCheck = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const lectureId = req.params.lectureId
    const courseIndex = req.params.id

    const course = await CourseModel.findOne({ index: courseIndex }).select('_id').lean()
    const userCourse = await UserCourseModel.findOne({
        user: user._id, course: course._id
    }).lean()

    if (!userCourse) {
        return next(createError("انت غير مشترك", 401, FAILED))
    }

    const lecture = await LectureModel.findOne({ _id: lectureId, isActive: true }).lean().populate('exam video file link')
    if (lecture.exam) {
        const userAttempts = await AttemptModel.find({ exam: lecture.exam._id, user: user._id }).lean()
        lecture.exam.attempts = userAttempts
    }

    res.status(200).json({ ...lecture })
})

//@desc pass lecture and make user current index of course = nextIndex
//@routes POST /content/courses/:id/lectures/:id/passed
//@access Private   ==> user
const lecturePassed = expressAsyncHandler(async (req, res, next) => {
    let courseId = req.params.id
    const nextLectureIndex = req.body.nextLectureIndex
    let user = req.user._id

    const userCourse = await UserCourseModel.findOne({ user, course: courseId })
    if (!userCourse) return next(createError('انت غير مشترك', 400, FAILED))

    userCourse.currentIndex = nextLectureIndex
    await userCourse.save()
    return res.json({ message: 'لقد تم الاجتياز بنجاح', status: SUCCESS })
})

// ########## EXAM ##############

//@desc get exam for doing it
//@routes Get /content/courses/:id/exams/:examId
//@access Private   ==> user
const getExam = expressAsyncHandler(async (req, res, next) => {

    const course = req.params.id
    const exam = req.params.examId
    const user = req.user._id

    const userCourse = await UserCourseModel.findOne({ user, course }).lean()
    if (!userCourse) return next(createError("انت غير مشترك", 400, FAILED))

    const foundExam = await ExamModel.findById(exam).lean().select('-questions.rtOptionId')
    const attempts = foundExam.attemptsNums

    const userAttempts = await AttemptModel.countDocuments({ user, exam })
    if (userAttempts >= attempts) return next(createError("لقد استنفزت كل محاولاتك", 400, FAILED))


    //attempts check
    res.json({ values: foundExam })
})

//@desc add user attempt
//@routes POST /content/courses/:id/exams/:id/attempts
//@access Private   ==> user
const createAttempt = expressAsyncHandler(async (req, res, next) => {
    const attempt = req.body
    const user = req.user

    const exam = await ExamModel.findById(attempt.exam).lean()
    if (!exam) return next(createError('لا يوجد هذا الاختبار', 404, FAILED))
    const userAttempts = await AttemptModel.countDocuments({ user: user._id, exam: attempt.exam })

    if (userAttempts >= exam.attemptsNums) return next(createError("لقد استنفزت كل محاولاتك , بالرجاء العوده", 400, FAILED))


    const score = getAttemptMark(exam, attempt.chosenOptions)

    attempt.mark = score
    user.totalPoints += score

    //update user and exam
    const [updatedUser] = await Promise.all([
        await UserModel.findByIdAndUpdate(
            user._id,
            { $addToSet: { exams: exam._id }, totalPoints: user.totalPoints }, // $addToSet prevents duplicates
            { new: true } // returns the updated user
        ), await AttemptModel.create(attempt)])

    //elevate user current index in course
    res.status(201).json({ status: SUCCESS, values: updatedUser.totalPoints, message: "تم الانتهاء من الاختبار بنجاح" })
})

module.exports = {
    getCourses, getOneCourse, uploadCourseImg, createCourse, updateCourse, checkDeleteCourse, deleteCourse, coursesParams,
    getCourseLecturesAndCheckForUser, getLectureAndCheck, lecturePassed, subscribe,
    getExam, createAttempt, linkCourse
}



// if (userCourse) {
//     //he is subscribed and has payed
//     course.isSubscribed = true
//     course.subscribedAt = userCourse.createdAt
// } else {
//     course.isSubscribed = false
// }


// let lectures = await LectureModel.find({ course: { $in: [...course.linkedTo, courseId] }, isActive: true }).populate(populate).lean()

// lectures.map((lecture, i) => {
//     lecture.index = i + 1
//     if (lecture.sectionType === sectionConstants.EXAM) {
//         lecture.exam.questionsLength = lecture.exam.questions.length
//         delete lecture.exam.questions
//     }
// })
// if (userCourse) {
//     //lock lectures
//     lectures.map(lecture => {
//         if (lecture.sectionType === sectionConstants.EXAM) {
//             //info
//         }
//         if (userCourse.currentIndex < lecture.index) {
//             console.log('from calc')
//             lecture.locked = true
//         }
//         return lecture
//     })
// }
