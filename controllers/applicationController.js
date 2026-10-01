import { deleteOne, getAll, insertOne, updateOne, getDocCount, getOne } from './factoryHandler.js';
import ApplicationModel from '../models/ApplicationModel.js';

const applicationParams = (query) => {
    return [
        { key: "title", value: query.title },
        { key: "description", value: query.description },
        { key: "isActive", value: query.isActive },
        { key: "courses", value: query.courses },
        { key: "grade", value: query.grade },
        { key: "_id", value: query._id },

    ]
}

const getApplications = getAll(ApplicationModel, 'applications', applicationParams)
const countApplications = getDocCount(ApplicationModel, applicationParams)
const updateApplication = updateOne(ApplicationModel)

const getOneApplication = getOne(ApplicationModel, 'courses')

const createApplication = insertOne(ApplicationModel)
const deleteApplication = deleteOne(ApplicationModel)


export { getApplications, getOneApplication, countApplications, updateApplication, createApplication, deleteApplication };