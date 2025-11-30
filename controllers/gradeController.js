const GradeModel = require("../models/GradeModel");
const { getAll, insertOne, updateOne, deleteOne, getOne } = require("./factoryHandler");

const gradeParams = (query) => {
    return [
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "index", value: query.index },
        { key: "isActive", value: query.isActive },
    ]
}


const getGrades = getAll(GradeModel, 'grades', gradeParams)
const getOneGrade = getOne(GradeModel)

const createGrade = insertOne(GradeModel, true)
const updateGrade = updateOne(GradeModel)

const deleteGrade = deleteOne(GradeModel)

module.exports = { getGrades, getOneGrade, createGrade, updateGrade ,deleteGrade}