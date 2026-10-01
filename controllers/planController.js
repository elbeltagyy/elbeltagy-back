import { getAll, insertOne, updateOne, deleteOne } from './factoryHandler.js';
import PlanModel from '../models/PlanModel.js';
import PlanTaskModel from '../models/PlanTaskModel.js';

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

export { getPlans, createPlan, updatePlan, deletePlan };