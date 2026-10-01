import { getAll, insertOne, updateOne, deleteOne } from './factoryHandler.js';
import PrivacyModel from '../models/PrivacyModel.js';

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

export { getPrivacies, createPrivacy, updatePrivacy, deletePrivacy };