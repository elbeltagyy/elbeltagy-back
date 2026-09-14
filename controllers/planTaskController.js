const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler")
const PlanTaskModel = require("../models/PlanTaskModel")
const PlanModel = require("../models/PlanModel")

const params = () => []
const relatedDocs = [
    { model: PlanModel, fields: ['tasks'], refValue: 'plan' }
]

const getTasks = getAll(PlanTaskModel, 'tasks', params)
const createTask = insertOne(PlanTaskModel, null, null, relatedDocs)

const updateTask = updateOne(PlanTaskModel)
const deleteTask = deleteOne(PlanTaskModel, relatedDocs)

module.exports = { getTasks, createTask, updateTask, deleteTask }