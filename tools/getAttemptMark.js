module.exports = (exam, chosenOptions) => {
    const score = exam.questions.reduce((acc, question, i,) => {
        const AnsweredQuestion = chosenOptions.filter(({ questionId }) => questionId === question._id.toString())[0]

        if (question?.rtOptionId === AnsweredQuestion?.chosenOptionId) {
            return acc += question.points
        } else {
            return acc
        }

    }, 0)
    return score
} 