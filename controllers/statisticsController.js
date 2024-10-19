const expressAsyncHandler = require("express-async-handler");
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
const { makeMatch } = require("../tools/makeMatch");
const { SUCCESS } = require("../tools/statusTexts");
const NotificationModel = require("../models/NotificationModel");
const { notificationParams } = require("./notificationController");

const getUsersCount = getDocCount(UserModel, userParams)

const getUnitsCount = getDocCount(UnitModel, unitParams)

const getCoursesCount = getDocCount(CourseModel, coursesParams)

// const getLecturesCount = getDocCount(LectureModel, lectureParams)
const getLecturesCount = expressAsyncHandler(async (req, res, next) => {
    const courseId = req.query.course

    const course = await CourseModel.findById(courseId).lean().select("linkedTo")
    let ids = []
    if (course) {
        ids = [...course.linkedTo, course._id]
    }

    const query = req.query

    // search && filter
    const match = {}
    makeMatch(match, lectureParams(query))

    const count = await LectureModel.countDocuments({ ...match, course: { $in: ids } })
    return res.status(200).json({ status: SUCCESS, values: { count } })

})

const getSubscriptionsCount = getDocCount(UserCourseModel, userCoursesParams)

const getNotificationsCount = getDocCount(NotificationModel, notificationParams)

module.exports = { getUsersCount, getUnitsCount, getCoursesCount, getLecturesCount, getSubscriptionsCount, getNotificationsCount }