import expressAsyncHandler from 'express-async-handler';
import SessionModel from '../models/SessionModel.js';
import { getAll } from './factoryHandler.js';
import { SUCCESS } from '../tools/statusTexts.js';

const sessionParams = (query) => {
    return [
        // { key: "isExpired", value: query.isExpired, type: "boolean" },
        { key: "browserName", value: query.browserName },
        { key: "deviceType", value: query.deviceType },
        { key: "user", value: query.user, operator: 'equal' },
        { key: "isLoggedOutAutomatic", value: query.isLoggedOutAutomatic, type: "boolean" },
        { key: "ip", value: query.ip },
    ]
}


const getSessions = getAll(SessionModel, 'sessions', sessionParams, true, 'user')


const sessionLogout = expressAsyncHandler(async (req, res, next) => {
    const sessionId = req.params.sessionId

    const session = await SessionModel.findOne({ _id: sessionId })
    session.logout = new Date()
    session.isLoggedOutAutomatic = false

    await session.save()
    res.status(200).json({ messsage: 'تم تسجيل الخروج بنجاح من هذا الجهاز', status: SUCCESS })
})


export { getSessions, sessionLogout, sessionParams };