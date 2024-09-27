const CourseModel = require("../models/CourseModel");
const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");



const coursesParams = (query) => {
    return [
        { key: "grade", value: query.grade, operator: "equal" },
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "price", value: query.price },
        { key: "preDiscount", value: query.preDiscount },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "unit", value: query.unit, operator: "equal" },
        { key: "index", value: query.index, operator: "equal" },
    ]
}

const getCourses = getAll(CourseModel, 'courses', coursesParams)
const getOneCourse = getOne(CourseModel)

const createCourse = insertOne(CourseModel, true)
const updateCourse = updateOne(CourseModel)
const deleteCourse = deleteOne(CourseModel)


module.exports = { getCourses, getOneCourse, createCourse, updateCourse, deleteCourse, coursesParams }

