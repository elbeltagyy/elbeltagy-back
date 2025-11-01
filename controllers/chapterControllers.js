const expressAsyncHandler = require("express-async-handler")
const ChapterModel = require("../models/ChapterModel")
const { getAll, insertOne, updateOne, deleteMany, deleteOne, pushToModel } = require("./factoryHandler")
const LectureModel = require("../models/LectureModel")
const { handleLectureDelete } = require("./lectureController")

const chapterParams = (query) => {
    return [
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "isActive", value: query.isActive },
        { key: "courses", value: query.courses },
        { key: "_id", value: query._id },
        { key: "grade", value: query.grade },
    ]
}
const getChapters = getAll(ChapterModel, 'chapters', chapterParams)

const createChapter = insertOne(ChapterModel, true)
const updateChapter = updateOne(ChapterModel)

const changeIndex = expressAsyncHandler(async (req, res, next) => {
    const { targetId } = req.body
    //movedIndex => currentIndex || targetIndex = newIndex
    const chapterId = req.params.id

    const targetIndex = await ChapterModel.findById(targetId).select('index')
        .lean().then(doc => doc?.index)
    const chapter = await ChapterModel.findById(chapterId)
    const movedIndex = chapter.index

    const isMovingUp = Number(movedIndex) > Number(targetIndex) // 5

    if (isMovingUp) {
        await ChapterModel.updateMany({
            index: { $gte: targetIndex, $lt: movedIndex } // >= 5 <8
        }, {
            $inc: { index: 1 }
        })
    } else {
        await ChapterModel.updateMany({
            index: { $gt: movedIndex, $lte: targetIndex } // >= 5 <8
        }, {
            $inc: { index: -1 }
        })
    }

    chapter.index = targetIndex
    await chapter.save({ validateBeforeSave: false })
    res.status(204).json({})
})

//Delete chapter => delete its lectures
const deleteManyChapters = deleteMany(ChapterModel, chapterParams)
const removeChapter = deleteOne(ChapterModel)

const preRemoveChapter = expressAsyncHandler(async (req, res, next) => {
    const chapterId = req.params.id
    // Find all lectures for this chapter
    const lectures = await LectureModel.find({ chapter: chapterId }).select('_id').lean();

    // Delete all lectures (and their dependencies)
    await Promise.all(lectures.map(l => handleLectureDelete(l._id)));
    next()
})

const pushAndPullInChapters = pushToModel(ChapterModel)

module.exports = {
    getChapters, createChapter, updateChapter, removeChapter, pushAndPullInChapters,
    changeIndex, preRemoveChapter
}