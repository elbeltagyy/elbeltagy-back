import { getAll, insertOne, updateOne, deleteOne } from './factoryHandler.js';
import PlanTaskModel from '../models/PlanTaskModel.js';
import PlanModel from '../models/PlanModel.js';

const params = () => []
const relatedDocs = [
    { model: PlanModel, fields: ['tasks'], refValue: 'plan' }
]

const getTasks = getAll(PlanTaskModel, 'tasks', params)
const createTask = insertOne(PlanTaskModel, null, null, relatedDocs)

const updateTask = updateOne(PlanTaskModel)
const deleteTask = deleteOne(PlanTaskModel, relatedDocs)

export { getTasks, createTask, updateTask, deleteTask };