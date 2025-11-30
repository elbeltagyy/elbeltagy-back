
const expressAsyncHandler = require("express-async-handler")
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler")

const GroupModel = require("../models/GroupModel")
const UserModel = require("../models/UserModel")
const { SUCCESS } = require("../tools/statusTexts")
const LectureModel = require("../models/LectureModel")

const groupParams = (query) => {
    return [
        { key: "_id", value: query._id, operator: 'equal' },
        { key: "grade", value: query.grade },
        { key: "name", value: query.name },
    ]
}

// @desc getGroups
// @route GET /groups
// @access Private
const getGroups = getAll(GroupModel, 'groups', groupParams)

// @desc create
// @route POST /groups
// @access Private
const createGroup = insertOne(GroupModel, true)

// @desc update
// @route POST /groups
// @access Private
const updateGroup = updateOne(GroupModel)
const deleteGroup = deleteOne(GroupModel,
    [
        { model: UserModel, fields: ['groups'] },
        { model: LectureModel, fields: ['groups'] }
    ],
    // [{ model:CodeModel }]
)

const addUserToGroup = expressAsyncHandler(async (req, res, next) => {
    const group = req.params.id
    const users = req.body.users

    await UserModel.updateMany({ _id: { $in: users } }, { $addToSet: { groups: group } }, { new: true })
    res.status(200).json({ message: 'تم ايضافه المستخدمين بنجاح', status: SUCCESS })
})

// @desc delete user from group
// @route DELETE /groups/:id/users
// @access Private
const removeUserFromGroup = expressAsyncHandler(async (req, res, next) => {

    const group = req.params.id
    const users = req.body.users

    await UserModel.updateMany(
        { groups: { $in: [group] }, _id: { $in: users } },
        { $pull: { groups: group } }
    );
    res.status(200).json({ message: 'تم ازاله المستخدمين بنجاح', status: SUCCESS })
})

// @desc add Lecture to group
// @route POST /groups/:id/lectures
// @access Private
const addLectureToGroup = expressAsyncHandler(async (req, res, next) => {
    const group = req.params.id
    const lectures = req.body.lectures || []

    await LectureModel.updateMany({ _id: { $in: lectures } }, { $addToSet: { groups: group } }, { new: true })
    res.status(200).json({ message: 'تم ايضافه المحاضره بنجاح', status: SUCCESS })
})

// @desc delete Lecture from group
// @route DELETE /groups/:id/lectures
// @access Private
const removeLectureFromGroup = expressAsyncHandler(async (req, res, next) => {

    const group = req.params.id
    const lectures = req.body.lectures || []

    await LectureModel.updateMany(
        { groups: { $in: [group] }, _id: { $in: lectures } },
        { $pull: { groups: group } }
    );
    res.status(200).json({ message: 'تم ازاله المحاضرات', status: SUCCESS })
})

module.exports = {
    getGroups, createGroup, updateGroup, deleteGroup,
    removeUserFromGroup, addUserToGroup,
    addLectureToGroup, removeLectureFromGroup
}