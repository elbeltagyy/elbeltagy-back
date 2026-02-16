const ChapterModel = require("../models/ChapterModel");
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

        const coursesIds = [...course.linkedTo, course._id]
        const [lectures, chapters] = await Promise.all([
            LectureModel.find({ course: { $in: coursesIds }, isActive: true })
                .populate(populate)
                .lean()
                .sort({ index: 1 }),
            ChapterModel.find({ courses: { $in: coursesIds }, isActive: true })
                .lean()
                .sort({ index: 1 })
        ]);

        // 🧩 Cache common info
        // const userLectures = new Set(user?.lectures || []);
        const isMust = !!course.isMust;
        const userCurrentIndex = userCourse?.currentIndex || 0;

        // 🧠 Pre-group lectures by chapterId
        const lecturesByChapter = lectures.reduce((acc, lec) => {
            const key = String(lec.chapter);
            (acc[key] ||= []).push(lec);
            return acc;
        }, {});

        let globalIndex = 1
        const lessons = chapters.map(chapter => {
            return {
                ...chapter,
                lectures: (lecturesByChapter[String(chapter._id)] || []).map(lecture => {
                    lecture.index = globalIndex++
                    lecture.isSalable = (course.isLecturesSalable ?? true) ? lecture.isSalable : false

                    if (user && !userCourse) {
                        user.accessLectures = user.accessLectures || []
                        lecture.isPaid = user.accessLectures.includes(lecture._id)
                        lecture.locked = false
                    }

                    //Delete Exam Questions
                    if (lecture.sectionType === sectionConstants.EXAM) {
                        lecture.exam.questionsLength = lecture.exam.questions.length
                        delete lecture.exam.questions
                    }

                    //Lock Lecture
                    if (userCurrentIndex < lecture.index && isMust && userCourse) {
                        lecture.locked = true
                    }
                    return lecture
                })
            }
        })

        return [course, lessons] //lectures replacedBy lessons
    } catch (error) {
        throw error
    }
}

module.exports = lockLectures

// lectures.map((lecture, i) => {
//     lecture.index = i + 1
//     //Is Paid
//     if (user) {
//         user.lectures = user.lectures || []
//         lecture.isPaid = user.lectures.includes(lecture._id)
//     }
//     //Delete Exam Questions
//     if (lecture.sectionType === sectionConstants.EXAM) {
//         lecture.exam.questionsLength = lecture.exam.questions.length
//         delete lecture.exam.questions
//     }
// })
// if (userCourse && course.isMust) {
//     //lock lectures
//     lectures.map(lecture => {
//         if (userCourse.currentIndex < lecture.index) {
//             lecture.locked = true
//         }
//         return lecture
//     })
//     //############## Sorting --
//     let startIndex = lectures.findIndex(obj => obj.index === userCourse.currentIndex);

//     if (startIndex < 0) {
//         startIndex = 0
//     }
//     // Slice from the found startIndex to the end, and from the beginning to startIndex
//     const firstPart = lectures.slice(startIndex); // Elements from found index to end
//     const secondPart = lectures.slice(0, startIndex); // Elements from beginning to found index - 1

//     // Concatenate the two parts
//     lectures = firstPart.concat(secondPart);
// }