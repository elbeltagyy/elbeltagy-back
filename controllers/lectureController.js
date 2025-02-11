const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const LectureModel = require("../models/LectureModel");
const expressAsyncHandler = require("express-async-handler");
const { addToCloud, deleteFromCloud } = require("../middleware/upload/cloudinary");
const createError = require("../tools/createError");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const VideoModel = require("../models/VideoModel");
const CourseModel = require("../models/CourseModel");
const ExamModel = require("../models/ExamModel");
const AttemptModel = require("../models/AttemptModel");
const FileModel = require("../models/FileModel");
const LinkModel = require("../models/LinkModel");
const sectionConstants = require("../tools/constants/sectionConstants");
const filePlayers = require("../tools/constants/filePlayers");

const { addToBunny } = require("../middleware/bunny");
const { addToServer } = require("../middleware/upload/uploadServer");
const { uploadFile, deleteFile } = require("../middleware/upload/uploadFiles");
const dotenv = require("dotenv");
const UserModel = require("../models/UserModel");
const VideoStatisticsModel = require("../models/VideoStatisticsModel");

dotenv.config()
const lectureParams = (query) => {
    return [
        { key: "grade", value: query.grade, operator: "equal" },
        { key: "unit", value: query.unit, operator: "equal" },
        { key: "course", value: query.course, operator: "equal" },
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "_id", value: query._id, operator: 'equal' },
        { key: "sectionType", value: query.sectionType },
        { key: "isCenter", value: query.isCenter, type: 'boolean' },
    ]
}

const getGoogleDrivePreviewLink = (originalLink) => {
    const fileIdRegex = /\/d\/(.*?)\//;
    const match = originalLink.match(fileIdRegex);

    if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
    } else {
        console.error('Invalid Google Drive link');
        return null;
    }
};



const getLectures = getAll(LectureModel, 'lectures', lectureParams, false, 'video') //used bu users

const getLecturesForAdmin = expressAsyncHandler(async (req, res, next) => {
    const courseId = req.query.course


    const course = await CourseModel.findById(courseId).lean().select('linkedTo _id')
    if (!course) return next(createError('Course Not Found', 404, FAILED))

    const populate = [
        {
            path: 'course',
            select: 'name',
        }
    ];

    let lectures = await LectureModel.find(
        { course: { $in: [...course.linkedTo, course._id] } }
    ).lean().populate(populate)

    res.json({ status: SUCCESS, values: { lectures } })
})

const getOneLecture = getOne(LectureModel)
const updateLecture = updateOne(LectureModel)

const getLectureForCenter = expressAsyncHandler(async (req, res, next) => {
    const lectureId = req.params.id
    const user = req.user
    const lecture = await LectureModel.findOne({ _id: lectureId, isActive: true }).lean().populate('exam video file link')
    if (lecture.exam) {
        const userAttempts = await AttemptModel.find({ exam: lecture.exam._id, user: user._id }).lean()
        lecture.exam.attempts = userAttempts
    }
    res.status(200).json({ ...lecture })
})

const createLecture = expressAsyncHandler(async (req, res, next) => {
    const lecture = req.body
    console.log('from here create lecture')
    //validation => courseId, name, grade
    if (lecture.sectionType === sectionConstants.VIDEO) {
        let video = {
            name: lecture.name,
            player: lecture.player,
            resource_type: 'video/mp4',
            url: '',

            isButton: lecture.isButton || false,
            duration: lecture.duration,
        }
        switch (lecture.player) {
            case filePlayers.YOUTUBE: //done
                video.url = lecture.url // ### modify video
                break;
            case filePlayers.BUNNY:
                video.url = lecture.url // ### modify video
                break;

            case filePlayers.BUNNY_UPLOAD: //done
                // upload to bunny
                const bunnyVid = await addToBunny(req.file, { name: lecture.name })
                video = { ...video, ...bunnyVid }
                break;

            case filePlayers.SERVER:
                const serverVid = req.file
                const uploadedVideo = await uploadFile(serverVid,
                    { name: lecture.name, secure: true })
                video = { ...video, ...uploadedVideo }
                break;
            default:
                return
        }

        // return res.status(200).json({ values: { ...lecture, video } })
        const savedVideo = await VideoModel.create({ ...video })
        lecture.video = savedVideo._id
    }

    if (lecture.sectionType === sectionConstants.FILE) {
        let file = {}
        file.name = lecture.name
        file.player = lecture.player
        file.url = lecture.url
        file.resource_type = 'application/pdf'

        if (lecture.player === filePlayers.GOOGLE_DRIVE) {
            file.url = getGoogleDrivePreviewLink(lecture.url)
        }

        if (lecture.player === filePlayers.SERVER) {
            const uploadedFile = await uploadFile(req.file, { name: lecture.name, secure: true })
            file = { ...file, ...uploadedFile }
        }

        if (lecture.player === filePlayers.BUNNY) {
            const uploadedFile = await addToBunny(req.file, { name: lecture.name, secure: true })
            file = { ...file, ...uploadedFile }
        }
        // return res.status(200).json({ values: { ...lecture, file } })

        const savedFile = await FileModel.create({ ...file, name: lecture.name })
        lecture.file = savedFile._id
    }

    if (lecture.sectionType === sectionConstants.LINK) {
        const link = {}
        link.isVideo = lecture.isVideo || false
        link.url = lecture.url

        // return res.status(200).json({ values: { ...lecture, link } })
        const savedLink = await LinkModel.create(link)
        lecture.link = savedLink._id
    }
    return next()
})

//route content/lectures/:id
const handelUpdateLecture = expressAsyncHandler(async (req, res, next) => {
    const lecture = req.body
    const id = req.params.id

    const file = req.file
    delete lecture.video

    const savedLecture = await LectureModel.findByIdAndUpdate(id, lecture, { new: true }).populate("link video file") //edit it
    if (savedLecture.file) {
        let uploadedFile = {}
        if (file) {
            uploadedFile = await uploadFile(file, { name: lecture.name, secure: true })
        }
        if (lecture.player === filePlayers.GOOGLE_DRIVE) {
            lecture.url = getGoogleDrivePreviewLink(lecture.url)
        }

        const updatedFile = await FileModel.findByIdAndUpdate(savedLecture.file._id, { ...lecture, ...uploadedFile }, { new: true })
        savedLecture.file = updatedFile
    }
    if (savedLecture.video) {
        const updatedVideo = await VideoModel.findByIdAndUpdate(savedLecture.video, lecture, { new: true })
        savedLecture.video = updatedVideo
    }
    if (savedLecture.link) {
        const updatedLink = await LinkModel.findByIdAndUpdate(savedLecture.link, lecture, { new: true })
        savedLecture.link = updatedLink
    }

    res.json({ values: { lecture: savedLecture }, message: 'تم تعديل المحاضره بنجاح', status: SUCCESS })
})
//route content/lectures/:id
//method DELETE
const deleteLecture = expressAsyncHandler(async (req, res, next) => {
    const lectureId = req.params.id

    const lecture = await LectureModel.findById(lectureId).populate("exam video link file").lean()
    if (lecture.file) {
        await Promise.all([
            deleteFile(lecture.file),
            FileModel.findByIdAndDelete(lecture.file._id)
        ])
    }
    if (lecture.exam) {
        const examId = lecture.exam._id
        lecture.exam.questions.forEach(async question => {
            if (question.image) {
                await deleteFile(question.image)
            }
        })

        await Promise.all([
            AttemptModel.deleteMany({ exam: examId }),
            ExamModel.findByIdAndDelete(lecture.exam._id),
            UserModel.updateMany(
                { exams: lecture.exam._id },
                { $pull: { exams: lecture.exam._id } }
            )])
    }

    if (lecture.link) {
        await LinkModel.findByIdAndDelete(lecture.link._id)
    }

    if (lecture.video) {
        await Promise.all([
            VideoModel.findByIdAndDelete(lecture.video._id),
            UserModel.updateMany(
                { lectures: lecture._id },
                { $pull: { lectures: lecture._id } }
            ),
            VideoStatisticsModel.deleteMany({
                lecture: lecture._id
            }),
        ])
    }
    
    await LectureModel.findByIdAndDelete(lectureId)
    res.status(200).json({ message: 'تم الحذف بنجاح', status: SUCCESS })
})

// @route /content/courses/exams
// @method POST
const createExam = expressAsyncHandler(async (req, res, next) => {
    let exam = req.body
    const storedExam = await ExamModel.create(exam)
    req.body.exam = storedExam._id
    next()
})

// @route /content/courses/exams/:id
// @method PUT
const updateOneExam = expressAsyncHandler(async (req, res, next) => {
    const lectureId = req.params.id
    const exam = req.body

    const lecture = await LectureModel.findByIdAndUpdate(lectureId, exam, { new: true })
    const updatedExam = await ExamModel.findByIdAndUpdate(lecture.exam, exam, { new: true })
    res.json({ message: 'تم تعديل الاختبار بنجاح', status: SUCCESS, values: { lecture, updatedExam } })
})

module.exports = { getLectures, getLecturesForAdmin, getOneLecture, getLectureForCenter, createLecture, updateLecture, handelUpdateLecture, deleteLecture, createExam, updateOneExam, lectureParams }





// const duration = lecture.duration
// if (duration) {
//     const durationParams = duration.split(' ')
//     const sum = durationParams.reduce((accumulator, currentValue) => {
//         return accumulator + ms(currentValue);
//     }, 0);

//     lecture.duration = sum
// }