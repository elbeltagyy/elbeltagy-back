import expressAsyncHandler from 'express-async-handler';
import NotificationModel from '../models/NotificationModel.js';
import { getAll, insertOne, updateOne, deleteOne } from './factoryHandler.js';
import { senderConstants, notificationMethods } from '../tools/constants/sendersConstants.js';
import UserModel from '../models/UserModel.js';
import sendEmail from '../tools/sendEmail.js';
import { sendWhatsMsgFc } from './whatsappController.js';
import sendUserReport from '../tools/sendUserReport.js';
import createError from '../tools/createError.js';
import { FAILED, SUCCESS } from '../tools/statusTexts.js';
import selectUsers from '../tools/fcs/selectUsers.js';
import senderByMethod from '../tools/fcs/senderByMethod.js';

// Use dynamic import() to load p-limit
const pLimit = async () => {
    const module = await import('p-limit');
    return module.default;
};

const notificationParams = (query) => {
    return [
        { key: "user", value: query.user },
        { key: "message", value: query.message },
        { key: "subject", value: query.subject },
        { key: "isSeen", value: query.isSeen },
        { key: "phone", value: query.phone },
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

//before create Notification
const handelNotification = expressAsyncHandler(async (req, res, next) => {
    const method = req.body.method
    const userId = req.body.user
    const message = req.body.message
    const subject = req.body.subject

    const user = await UserModel.findById(userId).lean()
    if (!user) return next(createError("المستخدم غير موجود", 404, FAILED))

    await senderByMethod({ method, user, subject, message })
    req.successMsg = 'تم ارسال : ' + notificationMethods.find(n => n.value === method).label

    next()
})

const sendNotificationsToMany = expressAsyncHandler(async (req, res, next) => {
    const limit = (await pLimit())(5); // Limit to 5 concurrent operations
    //grb routes
    const method = req.body.method
    const message = req.body.message
    const subject = req.body.subject

    //Who receive
    const match = selectUsers(req.body)
    const users = await UserModel.find(match).lean();

    let failedNums = 0
    // Process each user in parallel
    await Promise.all(users.map(user => limit(async () => {
        try {
            await senderByMethod({ method, user, message, subject })
        } catch (error) {
            failedNums += 1
            console.log('failed to send in sendNotificationByWhats ==>', error)
        }
    })));

    const messageToSend = 'تم ارسال : ' + (notificationMethods.find(n => n.value === method).label) + ' ' + 'العدد = ' + (users.length - failedNums)
    return res.status(200).json({ status: SUCCESS, values: '', message: messageToSend })
})
export { getNotifications, handelNotification, createNotification, sendNotificationsToMany, updateNotification, deleteNotification, notificationParams, makeSeen };