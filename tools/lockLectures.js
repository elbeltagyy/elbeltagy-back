const LectureModel = require("../models/LectureModel");
const sectionConstants = require("./constants/sectionConstants");


const lockLectures = async (course, userCourse) => {
    const populate = [
        {
            path: 'video',
            select: 'duration', // Only select the `duration` field from the `video`
        },
        {
            path: 'exam',
            select: 'questions attemptsNums time', // Select `questions` field from `exam`
        }
    ];

    try {
        if (userCourse) {
            //he is subscribed and has payed
            course.isSubscribed = true
            course.subscribedAt = userCourse.createdAt
        } else {
            course.isSubscribed = false
        }
        let lectures = await LectureModel.find({ course: { $in: [...course.linkedTo, course._id] }, isActive: true }).populate(populate).lean()

        lectures.map((lecture, i) => {
            lecture.index = i + 1
            if (lecture.sectionType === sectionConstants.EXAM) {
                lecture.exam.questionsLength = lecture.exam.questions.length
                delete lecture.exam.questions
            }
        })

        if (userCourse && course.isMust) {
            //lock lectures
            lectures.map(lecture => {
                if (lecture.sectionType === sectionConstants.EXAM) {
                    //info
                }
                if (userCourse.currentIndex < lecture.index) {
                    lecture.locked = true
                }
                return lecture
            })
        }

        return [course, lectures]
    } catch (error) {
        return error
    }
}

module.exports = lockLectures