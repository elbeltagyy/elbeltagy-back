const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const LectureModel = require("../models/LectureModel");
const expressAsyncHandler = require("express-async-handler");
const { addToCloud, deleteFromCloud } = require("../middleware/cloudinary");
const createError = require("../tools/createError");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const VideoModel = require("../models/VideoModel");
const CourseModel = require("../models/CourseModel");
const ExamModel = require("../models/ExamModel");
const filePlayer = require("../tools/constants/filePlayer");
const FileModel = require("../models/FileModel");
const LinkModel = require("../models/LinkModel");
const sectionConstants = require("../tools/constants/sectionConstants");
const videoPlayers = require("../tools/constants/videoPlayers");

const { addToBunny } = require("../middleware/bunny");
const ms = require("ms");
const { addToServer } = require("../middleware/uploadServer");

const lectureParams = (query) => {
    return [
        { key: "grade", value: query.grade, operator: "equal" },
        { key: "unit", value: query.unit, operator: "equal" },
        { key: "course", value: query.course, operator: "equal" },
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "_id", value: query._id },
        { key: "sectionType", value: query.sectionType },
    ]
}


const getLectures = getAll(LectureModel, 'lectures', lectureParams, 'video') //used bu users

const getOneLecture = getOne(LectureModel)


const createLecture = expressAsyncHandler(async (req, res, next) => {
    const lecture = req.body
    console.log('from here')
    //validation => courseId, name, grade
    if (lecture.sectionType === sectionConstants.VIDEO) {
        console.log('from videos')
        let video = {
            name: lecture.name,
            player: lecture.player,
            isButton: lecture.isButton || false,
            duration: lecture.duration,
            url: '',
            // only uploaded
            size: '',
            resource_type: 'video/mp4',
            // format: '',
        }
        switch (lecture.player) {
            case videoPlayers.YOUTUBE: //done
                video.url = lecture.url // ### modify video
                break;

            case videoPlayers.BUNNY:
                const srcRegex = /<iframe[^>]+src="([^"]+)"/;
                const match = lecture?.url?.match(srcRegex);
                let iframeSrc = match ? match[1] : null;
                if (iframeSrc) {
                    // Cut the URL at the "?" if it exists
                    iframeSrc = iframeSrc.split('?')[0];
                    video.url = iframeSrc // ### modify video
                } else {
                    return next(createError('Bad Bunny Url', 500, FAILED))
                }
                break;

            case videoPlayers.BUNNY_UPLOAD: //done
                // upload to bunny
                const bunnyVid = await addToBunny(req.file, { name: lecture.name })
                video = { ...video, ...bunnyVid }
                break;

            case videoPlayers.SERVER:
                const serverVid = req.file
                const uploadedVideo = await addToServer(serverVid, { name: lecture.name })
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

        if (lecture.player === filePlayer.SERVER) {
            let file = req.file
            const uploadedFile = await addToServer(file, { name: lecture.name })
            file = { ...file, ...uploadedFile }
        }

        if (lecture.player === filePlayer.BUNNY) {
            const uploadedFile = await addToBunny(req.file, { name: lecture.name })
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

// @route /content/courses/exams
// @method POST
const createExam = expressAsyncHandler(async (req, res, next) => {
    let exam = req.body
    const storedExam = await ExamModel.create(exam)
    req.body.exam = storedExam._id
    next()
})

const updateLecture = updateOne(LectureModel)

// const updateLecture = expressAsyncHandler(async (req, res, next) => {
//     const lecture = req.body
//     const id = req.params.id

//     const { files } = req
//     let results = {}
//     if (files) {

//         for (let file in files) {

//             const uploadedFile = await addToCloud(files[file][0], {
//                 folder: "admin",
//                 resource_type: "auto"
//             })
//             results[file] = uploadedFile
//         }

//     }

//     let savedLecture = await LectureModel.findById(id)
//     savedLecture.name = lecture.name || savedLecture.name
//     savedLecture.description = lecture.description || savedLecture.description
//     savedLecture.isActive = lecture.isActive || savedLecture.isActive

//     console.log('files =', files)
//     if (files && results.video) {
//         //remove vid pre
//         await VideoModel.findByIdAndUpdate(savedLecture.video, results.video)
//     }

//     if (files && results.thumbnail) {
//         //remove thumbnail pre
//         savedLecture.thumbnail = results.thumbnail
//     }

//     await savedLecture.save()

//     res.json({ values: { lecture: savedLecture }, message: 'lecture created ...', status: SUCCESS })
// })

const deleteLecture = expressAsyncHandler(async (req, res, next) => {
    const id = req.params.id

    const lecture = await LectureModel.findById(id).populate('video')

    if (lecture) {
        if (lecture.video?.url) {
            await deleteFromCloud(lecture.video.url)
            await VideoModel.findByIdAndDelete(lecture.video._id)
        }

        if (lecture.thumbnail?.url) {
            await deleteFromCloud(lecture.thumbnail.url)
        }

        const deleteLecture = await LectureModel.findByIdAndDelete(id)
        res.json({ message: 'lecture remove successfully', status: SUCCESS, values: deleteLecture })
    } else {
        next(createError("no lectures found", 404, FAILED))
    }
})
module.exports = { getLectures, getOneLecture, createLecture, updateLecture, deleteLecture, createExam, lectureParams }





// const duration = lecture.duration
// if (duration) {
//     const durationParams = duration.split(' ')
//     const sum = durationParams.reduce((accumulator, currentValue) => {
//         return accumulator + ms(currentValue);
//     }, 0);

//     lecture.duration = sum
// }