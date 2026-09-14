const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler")
const PlanModel = require("../models/PlanModel")
const PlanTaskModel = require("../models/PlanTaskModel")

const params = (query) => [
    { key: "title", value: query.title },
    { key: "month", value: query.month },
]

const relatedModels = [
    { model: PlanTaskModel, field: 'plan' }
]

const getPlans = getAll(PlanModel, 'plans', params, true, 'tasks')
const createPlan = insertOne(PlanModel)

const updatePlan = updateOne(PlanModel)
const deletePlan = deleteOne(PlanModel, null, relatedModels)

module.exports = { getPlans, createPlan, updatePlan, deletePlan }