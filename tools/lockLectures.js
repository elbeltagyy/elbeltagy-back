import ChapterModel from '../models/ChapterModel.js';
import LectureModel from '../models/LectureModel.js';
import sectionConstants from './constants/sectionConstants.js';


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
        const userCurrentIndex = userCourse?.currentIndex ?? 0;

        // 🧠 Pre-group lectures by chapterId
        const lecturesByChapter = lectures.reduce((acc, lec) => {
            const key = String(lec.chapter);
            (acc[key] ||= []).push(lec);
            return acc;
        }, {});

        // 🧩 Fetch child lectures No course || No chapter || only linked to Lecture
        const parentLectureIds = lectures.map(lec => lec._id)
        const childLectures = parentLectureIds.length
            ? await LectureModel.find({ parent: { $in: parentLectureIds }, isActive: true })
                .populate(populate)
                .lean()
            : []

        // 🧠 Pre-group child lectures by parent lecture id
        const lecturesByParent = childLectures.reduce((acc, lec) => {
            //Delete Exam Questions
            if (lec.sectionType === sectionConstants.EXAM) {
                lec.exam.questionsLength = lec.exam.questions.length
                delete lec.exam.questions
            }

            const key = String(lec.parent);
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
                    //Lock Lecture
                    if (userCurrentIndex < lecture.index && isMust && userCourse) {
                        lecture.locked = true
                    }
                    //Build children if any lecture has this lecture as parent
                    const children = lecturesByParent[String(lecture._id)]
                    if (children && children.length > 0) {
                        lecture.children = children
                    }

                    //Delete Exam Questions
                    if (lecture.sectionType === sectionConstants.EXAM) {
                        lecture.exam.questionsLength = lecture.exam.questions.length
                        delete lecture.exam.questions
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

export default lockLectures;

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