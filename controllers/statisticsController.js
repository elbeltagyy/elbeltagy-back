const CourseModel = require("../models/CourseModel");
const LectureModel = require("../models/LectureModel");
const UnitModel = require("../models/UnitModel");
const UserCourseModel = require("../models/UserCourseModel");
const UserModel = require("../models/UserModel");
const { coursesParams } = require("./courseController");
const { getDocCount } = require("./factoryHandler");
const { lectureParams } = require("./lectureController");
const { unitParams } = require("./unitController");
const { userParams } = require("./userController");
const { userCoursesParams } = require("./userCourseController");

const getUsersCount = getDocCount(UserModel, userParams)

const getUnitsCount = getDocCount(UnitModel, unitParams)

const getCoursesCount = getDocCount(CourseModel, coursesParams)

const getLecturesCount = getDocCount(LectureModel, lectureParams)

const getSubscriptionsCount = getDocCount(UserCourseModel, userCoursesParams)

module.exports = { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount, getSubscriptionsCount }