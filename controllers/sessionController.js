const expressAsyncHandler = require("express-async-handler");
const SessionModel = require("../models/SessionModel");
const { getAll } = require("./factoryHandler");
const { SUCCESS } = require("../tools/statusTexts");

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


module.exports = { getSessions, sessionLogout, sessionParams }