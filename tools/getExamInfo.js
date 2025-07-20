const attemptAllInfo = (exam, chosenOptions) => {
    const userMark = exam.questions.reduce((acc, question, i,) => {
        const AnsweredQuestion = chosenOptions.filter(({ questionId }) => questionId === question._id.toString())[0]

        if (question?.rtOptionId === AnsweredQuestion?.chosenOptionId) {
            return acc += question.points
        } else {
            return acc
        }

    }, 0)

    const total = exam.questions.reduce((acc, question) => {
        return acc += question.points || 1
    }, 0)

    const percentage = (userMark / total) * 100
    const rating = percentage >= 85 ? "ممتاز" : percentage >= 75 ? "جيد" : percentage >= 65 ? "متوسط" : "سئ"
    const ratingColor = percentage >= 85 ? 1 : percentage >= 75 ? 2 : percentage >= 65 ? 2 : 3

    assessment = { userMark, percentage, rating, total, ratingColor }
    return [userMark, total, assessment]
}

const getExamMark = (exam) => {
    const total = exam.questions.reduce((acc, question) => {
        return acc += question.points || 1
    }, 0)

    return total
}


const markQuestions = (questions) => {
    const total = questions.reduce((acc, question) => {
        if (question?.rtOptionId === question?.chosenOptionId) {
            question.isCorrect = true
            return acc += question.points
        } else {
            return acc
        }
    }, 0)

    return total
}

const markOneQuestion = (question) => {
    let qInfo = {
        isCorrect: false, mark: 0
    }
    if (question?.rtOptionId === question?.chosenOptionId) {
        question.isCorrect = true
        qInfo.isCorrect = true
        qInfo.mark = question.points
    } else {
        question.isCorrect = false
        qInfo.isCorrect = false
        qInfo.mark = 0
    }
    return [qInfo, question]
}
module.exports = { attemptAllInfo, getExamMark, markQuestions, markOneQuestion }