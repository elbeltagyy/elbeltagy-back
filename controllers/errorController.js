const ErrorModel = require("../models/ErrorModel");
const { getAll, insertOne } = require("./factoryHandler");


const params = (query) => {
    return [
        { key: 'message', value: query.message },
        { key: 'stack', value: query.stack },
        { key: 'url', value: query.url },
        { key: 'method', value: query.method },
        { key: 'isOperational', value: query.isOperational },
    ]
}

const getErrors = getAll(ErrorModel, "errors", params);
const createError = insertOne(ErrorModel);

module.exports = {
  getErrors,
  createError,
};
