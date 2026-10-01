import { getAll, getOne, insertOne, updateOne, deleteOne } from './factoryHandler.js';
import FeedBackModel from '../models/FeedBackModel.js';

const feedBackParams = (query) => {
    return [
        { key: "user", value: query.user },
        { key: "subject", value: query.subject },
        { key: "description", value: query.description },
        { key: "type", value: query.type },
        { key: "rating", value: query.rating },
    ]
}



const getFeedBacks = getAll(FeedBackModel, 'feedBacks', feedBackParams)
const getOneFeedBack = getOne(FeedBackModel)

const createFeedBack = insertOne(FeedBackModel)
const updateFeedBack = updateOne(FeedBackModel)

const deleteFeedBack = deleteOne(FeedBackModel)
export { getFeedBacks, getOneFeedBack, createFeedBack, updateFeedBack, deleteFeedBack };