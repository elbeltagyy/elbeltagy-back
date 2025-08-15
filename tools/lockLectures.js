const LectureModel = require("../models/LectureModel");
const sectionConstants = require("./constants/sectionConstants");


const lockLectures = async (course, userCourse, user = null) => {
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
            //Is Paid
            if (user) {
                user.lectures = user.lectures || []
                lecture.isPaid = user.lectures.includes(lecture._id)
            }
            //Delete Exam Questions
            if (lecture.sectionType === sectionConstants.EXAM) {
                lecture.exam.questionsLength = lecture.exam.questions.length
                delete lecture.exam.questions
            }
        })

        if (userCourse && course.isMust) {
            //lock lectures
            lectures.map(lecture => {
                if (userCourse.currentIndex < lecture.index) {
                    lecture.locked = true
                }
                return lecture
            })

            let startIndex = lectures.findIndex(obj => obj.index === userCourse.currentIndex);

            if (startIndex < 0) {
                startIndex = 0
            }
            // Slice from the found startIndex to the end, and from the beginning to startIndex
            const firstPart = lectures.slice(startIndex); // Elements from found index to end
            const secondPart = lectures.slice(0, startIndex); // Elements from beginning to found index - 1

            // Concatenate the two parts
            lectures = firstPart.concat(secondPart);
        }

        return [course, lectures]
    } catch (error) {
        return error
    }
}

module.exports = lockLectures