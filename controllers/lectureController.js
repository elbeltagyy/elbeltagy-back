const { getAll, getOne, insertOne, updateOne, deleteOne, pushToModel } = require("./factoryHandler");
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
const CodeModel = require("../models/CodeModel");
const codeConstants = require("../tools/constants/codeConstants");
const { user_roles } = require("../tools/constants/rolesConstants");
const handelExamAndAttempts = require("../tools/fcs/handelExamAndAttempts");

dotenv.config()
const lectureParams = (query) => {
    return [
        { $filter: query.$filter },
        { key: "grade", value: query.grade, type: "number" },
        { key: "unit", value: query.unit, operator: "equal" },
        { key: "course", value: query.course, operator: "equal" },
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "_id", value: query._id, operator: 'equal' },
        { key: "sectionType", value: query.sectionType },
        { key: "isCenter", value: query.isCenter, type: 'boolean' },
        { key: "isFree", value: query.isFree, type: 'boolean' },
        { key: "groups", value: query.groups, type: 'array' },
        { key: "codes", value: query.codes, type: 'array' },
        { key: "isSalable", value: query.isSalable, type: 'boolean' },
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
const insertLecture = insertOne(LectureModel, true)

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

//ProtectLecture MiddleWare
//....
//Protect Lectures all 
const protectGetLectures = expressAsyncHandler(async (req, res, next) => {
    //isFree, codes, groups
    const user = req.user
    // Admins bypass filtering
    if ([user_roles.ADMIN, user_roles.SUBADMIN].includes(user.role)) {
        return next();
    }

    const { isCenter, isFree, codes, paid, isGroups, select, populate } = req.query;
    const orConditions = [];

    // Center condition
    if (isCenter && user.role === user_roles.STUDENT) {
        orConditions.push({ isCenter: true });
    }
    // Free condition
    if (isFree) {
        orConditions.push({ isFree: true });
    }

    // Paid condition
    if (paid && Array.isArray(user.lectures) && user.lectures.length > 0) {
        orConditions.push({ _id: { $in: user.lectures } });
    }

    // Codes condition
    if (codes) {
        const userCodes = await CodeModel.find({
            usedBy: user._id,
            type: codeConstants.LECTURES
        }).select('_id').lean();

        if (userCodes.length > 0) {
            const modifiedCodes = userCodes.map(c => c._id);
            orConditions.push({ codes: { $in: modifiedCodes } });
        }
    }

    // Groups condition
    if (isGroups && Array.isArray(user.groups) && user.groups.length > 0) {
        orConditions.push({ groups: { $in: user.groups } });
    }

    // If no matching conditions → return empty result
    if (orConditions.length === 0) {
        return res.status(200).json({ status: SUCCESS, values: { lectures: [] } });
    }
    // Final query
    req.query = {
        $filter: { $or: orConditions },
        grade: user.grade,
        select,
        populate,
        isModernSort: true
    };
    next()
})

const getOneLecture = getOne(LectureModel)
const updateLecture = updateOne(LectureModel)
const pushLectures = pushToModel(LectureModel)

const getLectureForCenter = expressAsyncHandler(async (req, res, next) => {
    const lectureId = req.params.id
    const user = req.user
    let lecture = await LectureModel
        .findOne({ _id: lectureId, isActive: true })
        .lean().populate('exam video file link')

    let isValid = false

    if (!lecture) return next(createError("المحاضره غير موجوده", 404, FAILED))

    if (lecture.isFree) {
        isValid = true
    }

    if (user.lectures.includes(lecture._id)) {
        isValid = true
    }
    if (!isValid && lecture.isCenter && user.role === user_roles.STUDENT) {
        isValid = true
    }

    if (!isValid && lecture.groups?.length > 0 && user.groups?.length > 0) {

        const userGroupsSet = new Set(user.groups?.map(group => group?.toString())); // Convert ObjectIds to strings
        const hasCommonGroup = lecture.groups.some(group => userGroupsSet.has(group?.toString())); // Convert ObjectIds to strings

        if (hasCommonGroup) {
            isValid = true
        }
    }

    if (!isValid && lecture.codes?.length > 0) {
        const hasCommonCodes = await CodeModel.findOne({ _id: { $in: lecture.codes }, usedBy: user._id })

        if (hasCommonCodes) {
            isValid = true
        }
    }

    if (!isValid) return next(createError("يمكنك التواصل مع الدعم لشراء المحاضره", 401, FAILED))

    if (lecture.exam) {
        lecture = await handelExamAndAttempts(lecture, user)
    }
    res.status(200).json({ values: lecture, status: SUCCESS })
})

const createLecture = expressAsyncHandler(async (req, res, next) => {
    const lecture = req.body

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

//@route /content/lectures/array
//@method POST
const addToLectures = expressAsyncHandler(async (req, res, next) => {

    const lectures = req.body.lectures || []

    let addToSet = {}
    const code = req.body.code
    const group = req.body.group

    if (code) {
        addToSet.codes = code
    }
    if (group) {
        addToSet.groups = group
    }

    await LectureModel.updateMany({ _id: { $in: lectures } }, { $addToSet: addToSet }) //, { new: true }
    res.status(200).json({ message: 'تم ايضافه المحاضره بنجاح', status: SUCCESS })
})

//@route /content/lectures/array
//@method delete
const removeFromLectures = expressAsyncHandler(async (req, res, next) => {

    const lectures = req.body.lectures || []
    let match = { _id: { $in: lectures } }
    const code = req.body.code
    const group = req.body.group

    let toPull = {}
    if (code) {
        match.codes = { $in: [code] }
        toPull.codes = code
    }
    if (group) {
        match.groups = { $in: [group] }
        toPull.groups = group
    }
    await LectureModel.updateMany(
        match,
        { $pull: toPull }
    );
    res.status(200).json({ message: 'تم ازاله المحاضرات', status: SUCCESS })
})
module.exports = {
    getLectures, insertLecture,
    protectGetLectures, getLecturesForAdmin,
    getOneLecture, getLectureForCenter,
    createLecture, updateLecture, handelUpdateLecture, deleteLecture,
    lectureParams,
    removeFromLectures, addToLectures, pushLectures
}





// const duration = lecture.duration
// if (duration) {
//     const durationParams = duration.split(' ')
//     const sum = durationParams.reduce((accumulator, currentValue) => {
//         return accumulator + ms(currentValue);
//     }, 0);

//     lecture.duration = sum
// }