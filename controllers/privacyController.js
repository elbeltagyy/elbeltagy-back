const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler")
const PrivacyModel = require("../models/PrivacyModel")

const privacyParams = (query) => {
    return [
        { key: "title", value: query.title },
        { key: "isActive", value: query.isActive, type: "boolean" },
    ]
}


const getPrivacies = getAll(PrivacyModel, 'privacy', privacyParams)
const createPrivacy = insertOne(PrivacyModel)

const updatePrivacy = updateOne(PrivacyModel)
const deletePrivacy = deleteOne(PrivacyModel)

module.exports = { getPrivacies, createPrivacy, updatePrivacy, deletePrivacy }