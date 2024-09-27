const CourseModel = require("../models/CourseModel");
const LectureModel = require("../models/LectureModel");
const UnitModel = require("../models/UnitModel");
const UserModel = require("../models/UserModel");
const { coursesParams } = require("./courseController");
const { getDocCount } = require("./factoryHandler");
const { lectureParams } = require("./lectureController");
const { unitParams } = require("./unitController");
const { userParams } = require("./userController");

const getUsersCount = getDocCount(UserModel, userParams)

const getUnitsCount = getDocCount(UnitModel, unitParams)

const getCoursesCount = getDocCount(CourseModel, coursesParams)

const getLecturesCount = getDocCount(LectureModel, lectureParams)
module.exports = { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount }