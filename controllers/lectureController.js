const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const LectureModel = require("../models/LectureModel");
const expressAsyncHandler = require("express-async-handler");
const { addToCloud, deleteFromCloud } = require("../middleware/cloudinary");
const createError = require("../tools/createError");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const VideoModel = require("../models/VideoModel");


const lectureParams = (query) => {
    return [
        { key: "grade", value: query.grade, operator: "equal" },
        { key: "unit", value: query.unit, operator: "equal" },
        { key: "course", value: query.course, operator: "equal" },
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "_id", value: query._id },
    ]
}


const getLectures = getAll(LectureModel, 'lectures', lectureParams, 'video')
const getOneLecture = getOne(LectureModel)

const createLecture = expressAsyncHandler(async (req, res, next) => {
    const lecture = req.body

    const { files } = req
    let results = {}

    for (let file in files) {
        const result = await addToCloud(files[file][0], {
            folder: "admin",
            resource_type: "auto"
        })

        if (result) {
            const { original_filename, resource_type, secure_url, url, format, bytes } = result
            results[file] = { original_filename, resource_type, url: secure_url, format, size: bytes }
        }
    }

    if (files && results.video) {
        // lecture.video = results.video
        const video = await VideoModel.create(results.video)
        lecture.video = video._id
    }

    if (files && results.thumbnail) {
        lecture.thumbnail = results.thumbnail
    }

    const savedLecture = await LectureModel.create(lecture)
    res.json({ values: savedLecture, message: 'lecture created ...', status: SUCCESS })
})

const updateLecture = expressAsyncHandler(async (req, res, next) => {
    const lecture = req.body
    const id = req.params.id

    const { files } = req
    let results = {}
    if (files) {

        for (let file in files) {

            const result = await addToCloud(files[file][0], {
                folder: "admin",
                resource_type: "auto"
            })

            if (result) {
                const { original_filename, resource_type, secure_url, url, format, bytes } = result
                results[file] = { original_filename, resource_type, url: secure_url, format, size: bytes }
            }
        }

    }

    let savedLecture = await LectureModel.findById(id)
    savedLecture.name = lecture.name || savedLecture.name
    savedLecture.description = lecture.description || savedLecture.description
    savedLecture.isActive = lecture.isActive || savedLecture.isActive

    console.log('files =', files)
    if (files && results.video) {
        //remove vid pre
        await VideoModel.findByIdAndUpdate(savedLecture.video, results.video)
    }

    if (files && results.thumbnail) {
        //remove thumbnail pre
        savedLecture.thumbnail = results.thumbnail
    }

    await savedLecture.save()

    res.json({ values: { lecture: savedLecture }, message: 'lecture created ...', status: SUCCESS })
})

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
module.exports = { getLectures, getOneLecture, createLecture, updateLecture, deleteLecture, lectureParams }