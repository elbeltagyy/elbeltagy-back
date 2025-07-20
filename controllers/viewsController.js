const expressAsyncHandler = require("express-async-handler");
const { getAll, deleteOne, updateOne, getDocCount } = require("./factoryHandler");
const VideoStatisticsModel = require("../models/VideoStatisticsModel.js");
const UserModel = require("../models/UserModel.js");

const convertToObjectIdBySchema = require("../tools/fcs/convertToObjectIdBySchema.js");
const { makeMatch } = require("../tools/makeMatch.js");
const { userParams } = require("./userController.js");


const viewParams = (query) => {
    return [
        { key: "user", value: query.user, operator: "equal" },
        { key: "course", value: query.course, operator: "equal" },
        { key: "lecture", value: query.lecture, operator: "equal" },
        // { key: "role", value: query.role },
        { key: "role", value: query.view_role },
        { key: "totalTime", value: query.totalTime, type: "number" },
        { key: "watchedTime", value: query.watchedTime, type: "number" },
    ]
}

const getViews = getAll(VideoStatisticsModel, 'views', viewParams)
const getViewsCount = getDocCount(VideoStatisticsModel, viewParams)

const getByUserViews = expressAsyncHandler(async (req, res, next) => {
    const query = req.query

    //pagination
    const limit = Number(query.limit) || 10000
    const page = query.page || 1
    const skip = (page - 1) * limit

    // search && filter
    let matchView = makeMatch({}, viewParams(convertToObjectIdBySchema(req.query, VideoStatisticsModel)))
    let matchUser = makeMatch({}, userParams(req.query))

    // console.log(matchView)
    //sort 
    let sort = { createdAt: -1 } //To Make it stable in Pagination
    query.sortkey ? sort[query.sortkey] = Number(query.sortValue) : null

    query.sortkey === 'createdAt' ? sort.createdAt = Number(query.sortValue) : null
    query.sortkey === 'updatedAt' ? sort.updatedAt = Number(query.sortValue) : null


    // Custom sorting logic
    if (query.sortkey) {
        // Clear default sorts if custom sort is applied
        sort = {}
        sort[query.sortkey] = Number(query.sortValue)
        // Always include _id as secondary sort for stability
        sort._id = -1
    }

    // console.log({ matchView, matchUser })
    // console.log(sort)
    const usersWithWatchedTime = await VideoStatisticsModel.aggregate([
        { $match: matchView },
        // Grouping user Docs
        {
            $group: {
                _id: "$user",
                watchedTime: { $sum: "$watchedTime" },
                totalTime: { $sum: "$totalTime" },
                watches: { $sum: 1 },
                createdAt: { $first: "$createdAt" }

            }
        }, {
            $lookup: {
                from: UserModel.collection.name,
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$userId"] },
                            ...matchUser
                        }
                    },
                    {
                        $project: {
                            avatar: 1,
                            name: 1,
                            userName: 1,
                            phone: 1,
                            familyPhone: 1,
                            email: 1,
                            grade: 1,
                            role: 1,
                            isActive: 1,
                            createdAt: 1
                        }
                    }
                ],
                as: "user"
            }
        },
        { $unwind: "$user" }
        , {
            $facet: {
                pagination: [{ $count: "total" }],
                // Get paginated data
                views: [
                    { $sort: sort },
                    { $skip: skip },
                    { $limit: limit },
                ]
            }
        },
        // Transform the output format
        {
            $project: {
                views: 1,
                count: { $ifNull: [{ $arrayElemAt: ["$pagination.total", 0] }, 0] },
            }
        }
    ])
    // const views = await VideoStatisticsModel.find({ ...matchView, ...matchUser }).limit(limit)
    return res.status(200).json({ values: usersWithWatchedTime[0] })//views: views,
})


const getByUsersCount = expressAsyncHandler(async (req, res, next) => {
    const query = req.query

    // search && filter
    let matchView = makeMatch({}, viewParams(convertToObjectIdBySchema(req.query, VideoStatisticsModel)))
    let matchUser = makeMatch({}, userParams(req.query))

    // console.log({ matchView, matchUser })
    // console.log(sort)
    const usersWithWatchedTime = await VideoStatisticsModel.aggregate([
        {
            $match: matchView
        },
        {
            $group: {
                _id: "$user",
            }
        },
        {
            $lookup: {
                from: UserModel.collection.name,
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$userId"] },
                            ...matchUser
                        }
                    }
                ],
                as: "user"
            },
        },
        {
            $count: "count"
        }
    ])

    return res.status(200).json({ values: usersWithWatchedTime[0] || { count: 0 } })//views: views,
})

// const updateSubscription = updateOne(UserCourseModel)

const updateView = updateOne(VideoStatisticsModel)
const removeView = deleteOne(VideoStatisticsModel)

module.exports = { getViews, getViewsCount, getByUserViews, getByUsersCount, updateView, removeView, viewParams }