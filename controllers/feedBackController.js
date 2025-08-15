const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const FeedBackModel = require("../models/FeedBackModel");

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
module.exports = { getFeedBacks, getOneFeedBack, createFeedBack, updateFeedBack, deleteFeedBack }