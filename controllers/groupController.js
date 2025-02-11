
const expressAsyncHandler = require("express-async-handler")
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler")

const GroupModel = require("../models/GroupModel")
const UserModel = require("../models/UserModel")
const { SUCCESS } = require("../tools/statusTexts")


// @desc getGroups
// @route GET /groups
// @access Private
const getGroups = getAll(GroupModel, 'groups', [])

// @desc create
// @route POST /groups
// @access Private
const createGroup = insertOne(GroupModel, true)

// @desc update
// @route POST /groups
// @access Private
const updateGroup = updateOne(GroupModel)
const deleteGroup = deleteOne(GroupModel,
    [{ model: UserModel, fields: ['groups'] }],
    // [{ model:CodeModel }]
)

const addUserToGroup = expressAsyncHandler(async (req, res, next) => {
    const group = req.params.id
    const user = req.body

    console.log(user, group)
    await UserModel.findByIdAndUpdate(user._id, { $addToSet: { groups: group } }, { new: true })
    res.status(200).json({ message: 'تم ايضافه المستخدم بنجاح', status: SUCCESS })
})

// @desc delete user from group
// @route DELETE /groups/:id/users
// @access Private
const removeUserFromGroup = expressAsyncHandler(async (req, res, next) => {

    const group = req.params.id
    await UserModel.updateMany(
        { groups: { $in: [group] } }, // Filter: Find users where `groups` contains `mygroup`
        { $pull: { groups: group } } // Update: Remove `mygroup` from the `groups` array
    );
    res.status(200).json({ message: 'تم ازاله المستخدم', status: SUCCESS })
})


module.exports = { getGroups, createGroup, updateGroup, deleteGroup, removeUserFromGroup, addUserToGroup }