const expressAsyncHandler = require("express-async-handler");
const NotificationModel = require("../models/NotificationModel");
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler")

const notificationParams = (query) => {
    return [
        { key: "user", value: query.user, operator: 'equal' },
        { key: "message", value: query.message },
        { key: "subject", value: query.subject },
        { key: "isSeen", value: query.isSeen, type: 'boolean' },
    ]
} //modify it to be more frontend

const getNotifications = getAll(NotificationModel, 'notifications', notificationParams, true)
const createNotification = insertOne(NotificationModel)

const updateNotification = updateOne(NotificationModel)
const deleteNotification = deleteOne(NotificationModel)

//routes /notifications/seen/:userId
const makeSeen = expressAsyncHandler(async (req, res, next) => {
    const user = req.params.userId
    await NotificationModel.updateMany({ user }, { isSeen: true })
    res.status(204)
})

module.exports = { getNotifications, createNotification, updateNotification, deleteNotification, notificationParams, makeSeen }