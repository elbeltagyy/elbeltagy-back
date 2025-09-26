const AttemptModel = require("../../models/AttemptModel")

const handelExamAndAttempts = (lecture, user) => new Promise(async (resolve, reject) => {
    try {
        const userAttempts = await AttemptModel.find({ exam: lecture.exam._id, user: user._id }).populate('answers').lean()

        lecture.exam.attempts = userAttempts.map(attempt => {
            if (attempt.answers) {
                attempt.answers = attempt.answers.map(answer => {
                    const itsQuestion = lecture.exam.questions.find(q => q?._id.toString() === answer?.question?.toString())
                    answer.rtOptionId = itsQuestion?.rtOptionId
                    return answer
                })
            } else {
                attempt.answers = []
            }
            return attempt
        })

        lecture.exam.questions = lecture.exam.questions.map(q => {
            delete q.rtOptionId
            return q
        })

        resolve(lecture)
    } catch (error) {
        console.log('error from handelExamAndAttempts ==>', error)
        reject(error)
    }
})

module.exports = handelExamAndAttempts