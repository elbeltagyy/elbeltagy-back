const AttemptModel = require("../models/AttemptModel")
const { getAll, getOne } = require("./factoryHandler")

const attemptParams = (query) => {
    return [
        { key: "mark", value: query.mark, type: 'number' },
        { key: "exam", value: query.exam, operator: 'equal' },
        { key: "user", value: query.user, operator: 'equal' },
    ]
}

const getAttempts = getAll(AttemptModel, 'attempts', attemptParams, 'user')
const getOneAttempt = getOne(AttemptModel, 'exam')


module.exports = { getAttempts, getOneAttempt }