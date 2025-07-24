const expressAsyncHandler = require("express-async-handler");
const AnswerModel = require("../models/AnswerModel");
const { markQuestions, markOneQuestion } = require("../tools/getExamInfo");
const QuestionModel = require("../models/QuestionModel");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const { getAll, deleteOne, updateOne } = require("./factoryHandler");
const ExamModel = require("../models/ExamModel");
const AttemptModel = require("../models/AttemptModel");
const UserModel = require("../models/UserModel");
const createError = require("../tools/createError");

// Use dynamic import() to load p-limit
const pLimit = async () => {
    const module = await import('p-limit');
    return module.default;
};

const answerParams = (query) => {
    return [
        { key: "mark", value: query.mark, type: 'number' },
        { key: "isCorrect", value: query.isCorrect, type: 'boolean' },
        { key: "isHighlighted", value: query.isHighlighted },
        { key: "user", value: query.user, operator: 'equal' },
        { key: "question", value: query.question, operator: 'equal' },
        { key: "createdAt", value: query.createdAt, type: 'date' },
    ]
}

const getAnswers = getAll(AnswerModel, 'answers', answerParams, true, 'question')
const deleteAnswer = deleteOne(AnswerModel)
const updateAnswer = updateOne(AnswerModel)

const checkAttemptForQBased = async (answeredQuestion, user) => {
    let attempt = null;
    let isCreateNewAnswer = false;
    let answer = null

    try {
        if (answeredQuestion.examId) {
            if (answeredQuestion.activeAttemptId) {
                attempt = await AttemptModel.findOne({ _id: answeredQuestion.activeAttemptId, user: user._id }).populate('answers').lean()
                const foundAnswer = attempt.answers.find(a => a?.question?.toString() === answeredQuestion._id.toString())
                answer = foundAnswer
                isCreateNewAnswer = !foundAnswer;
            } else {
                isCreateNewAnswer = true

                attempt = await AttemptModel.create({
                    user: user._id,
                    course: answeredQuestion.course,
                    exam: answeredQuestion.examId,
                    role: user.role,
                    mark: 0
                })
            }
        }
    } catch (error) {
        console.log('error from : checkAttemptForQBased', error)
    }
    return [isCreateNewAnswer, attempt, answer]
}

const markQuestion = expressAsyncHandler(async (req, res, next) => {
    //Real time Question Based
    const answeredQuestion = req.body
    let user = req.user

    // Step 1: Fetch question and previous answer
    const [question, hasAnswered] = await Promise.all([
        QuestionModel.findById(answeredQuestion._id).lean(),
        AnswerModel.findOne({ question: answeredQuestion._id, user: user._id }).lean()
    ]);

    // Step 2: Handle exam/attempt logic
    const [isCreateNewAnswer, attempt, answerInAttempt] = await checkAttemptForQBased(answeredQuestion, user)
    if (answerInAttempt) {
        hasAnswered.chosenOptionId = answerInAttempt?.chosenOptionId
    }
    if (!attempt && answeredQuestion.examId) {
        return res.status(500).json({ message: "حدث خطأ أثناء تجهيز محاولة الإجابة." });
    }



    // Step 3: If already answered and not creating new attempt
    if (hasAnswered && !isCreateNewAnswer) {
        const note = hasAnswered.chosenOptionId !== answeredQuestion.chosenOptionId ? 'هذا السؤال تمت الايجابه عنه من قبل ولن يتم حفظ الايجابه المختاره, الايجابه السابقه هى:' + (question.options.find(opt => opt.id === hasAnswered.chosenOptionId)?.title || 'لم تتم الايجابه')
            : 'تمت الايحابه عن هذا السؤال من قبل'
        return res.status(200)
            .json({
                message: note, status: SUCCESS,
                values: {
                    ...question, answer: hasAnswered,
                    note: hasAnswered.chosenOptionId !== answeredQuestion.chosenOptionId && note,
                }
            })
    }
    // Step 4: Mark question
    const [qInfo] = markOneQuestion({
        ...question,
        rtOptionId: question.rtOptionId, chosenOptionId: answeredQuestion.chosenOptionId
    })

    //Rank Fc
    if (!hasAnswered) {
        if (attempt) {
            const userAttempts = await AttemptModel.countDocuments({ user: user._id, exam: attempt.exam })
            if (userAttempts === 1) {
                user.exam_marks += qInfo.mark
            }
        }

        const exam_marks = user.exam_marks ?? 0
        user = await UserModel.findByIdAndUpdate(user._id, {
            totalPoints: (user.totalPoints + qInfo.mark),
            marks: (user.marks + qInfo.mark),
            exam_marks
        }, { new: true })
    }

    const createdAnswer = await AnswerModel.create({
        question: question._id,
        user: user._id,
        chosenOptionId: answeredQuestion.chosenOptionId,

        isCorrect: qInfo.isCorrect, mark: qInfo.mark
    })

    //for Attempt
    if (attempt) {
        await AttemptModel.updateOne(
            { _id: attempt._id },
            {
                $addToSet: { answers: createdAnswer._id },
                $inc: { mark: qInfo.mark },
                $set: { tokenTime: answeredQuestion.tokenTime, course: answeredQuestion.course }
            }
        )
    }

    res.json({
        values: {
            ...question, chosenOptionId: createdAnswer.chosenOptionId,
            answer: createdAnswer, user, attemptId: attempt?._id || null
        },
        status: SUCCESS
    })
})

const markAttempt = expressAsyncHandler(async (req, res, next) => {

    //scenarios
    //   1- question based => attemptId / 
    //( Answered || Not answered)
    // Answered => totalPoints, exam_marks
    // Not Answered => create Answer - add points

    //2- exam Based => create new Attempt
    // check countDocs

    // 3- Bank question Based => no attemptId / no Exam
    // Answered => note, prevAnswered
    // Not Answered => create Answer - add points

    //4- Bank exam based => no attemptId / no Exam

    //1- From Bank
    const attempt = req.body
    const answers = attempt.answers //[]
    const exam = attempt.exam //id

    let user = req.user
    let userAttempts = 0
    let attemptMarkFound = 0

    //Check Answers of Attempt
    if (attempt.attemptId) {
        const foundAttempt = await AttemptModel.findById(attempt.attemptId).populate('answers').select('answers mark').lean()
        attemptMarkFound = foundAttempt.mark

        const modified = attempt.answers.map(answer => {
            const qId = answer.question
            const foundAnswer = foundAttempt.answers.find(a => a?.question === qId)
            if (foundAnswer) {
                return { ...answer, answer: foundAnswer }
            } else {
                return answer //will be Corrected
            }
        })
        attempt.answers = modified
    } else if (exam) {
        userAttempts = await AttemptModel.countDocuments({ user: user._id, exam: attempt.exam })
        if (userAttempts >= exam.attemptsNums) return next(createError("لقد استنفزت كل محاولاتك , بالرجاء العوده", 400, FAILED))
    }

    //question has been Answered => 
    const markedAnswers = await Promise.all(
        answers.map(async (answer) => {
            // Fetch Question
            const prevAnswer = answer.answer
            const question = await QuestionModel.findById(answer.question).lean();
            if (!question) return next(createError('السؤال غير موجود', 404, FAILED, true))

            if (prevAnswer) return {
                note: prevAnswer.chosenOptionId !== answer.chosenOptionId &&
                    'هذا السؤال تمت الايجابه عنه مسبقا لذلك الايجابه التي ستظهر هى ايجابتك السابقه اما الايجابه التى اخترتها حاليا هى : ' +
                    question.options.find(opt => opt.id === answer.chosenOptionId)?.title || 'لم تتم الايجابه عن هذا السؤال',
                ...question, chosenOptionId: prevAnswer.chosenOptionId, answer: prevAnswer, //prev
            }

            //2 cases ==> 1- Bank - attempt
            const answeredBefore = await AnswerModel.findOne({
                user: user._id,
                question: answer.question
            }).lean();

            if (!attempt.attemptId && answeredBefore && !exam) { //
                const note = answeredBefore.chosenOptionId !== answer.chosenOptionId &&
                    'هذا السؤال تمت الايجابه عنه مسبقا لذلك الايجابه التي ستظهر هى ايجابتك السابقه اما الايجابه التى اخترتها حاليا هى : ' +
                    (question.options.find(opt => opt.id === answer.chosenOptionId)?.title || 'لم تتم الايجابه عن هذا السؤال')

                return {
                    note,
                    ...question, chosenOptionId: answeredBefore.chosenOptionId, answer: answeredBefore, //prev
                }
            }
            // console.log('from here ==>', question.title)
            // Mark Answer
            const [qInfo] = markOneQuestion({
                ...question,
                rtOptionId: question.rtOptionId,
                chosenOptionId: answer.chosenOptionId
            });

            //Rank Fc
            const createdAnswer = await AnswerModel.create({
                question: answer.question,
                user: user._id,
                chosenOptionId: answer.chosenOptionId,
                isCorrect: qInfo.isCorrect,
                mark: qInfo.mark ?? 0
            });

            return {
                ...question, chosenOptionId: createdAnswer.chosenOptionId, answer: createdAnswer,
                isAddMarks: !answeredBefore
            };
        })
    );

    const userMarks = markedAnswers.reduce((prev, val) => {
        if (val.isAddMarks) {
            return prev + val.answer.mark
        }
        return prev
    }, 0)

    //Add User marks for - Answers -
    if (userMarks > 0) {
        user = await UserModel.findByIdAndUpdate(user._id, {
            totalPoints: (user.totalPoints + userMarks),
            marks: (user.marks + userMarks)
        }, { new: true }).lean()
    }

    //if Exam Found ==> save attempt
    if (exam) {
        const foundExam = await ExamModel.findById(exam).lean()
        if (!foundExam) return next(createError('لا يوجد هذا الاختبار', 404, FAILED))

        const attemptMark = markedAnswers.reduce((prev, val) => {
            prev += val.answer.mark
            return prev
        }, 0)
        attempt.answers = markedAnswers.map(a => a.answer._id)
        attempt.mark = attemptMark

        //Rank Fc
        if (Number(attemptMarkFound)) {
            user.totalPoints -= attemptMarkFound
        }

        user.totalPoints = (user.totalPoints + attempt.mark)
        if (userAttempts === 0) {
            user.exam_marks = (user.exam_marks || 0) + attempt.mark
        } else if (attempt.attemptId) {
            user.exam_marks = ((user.exam_marks || 0) - attemptMarkFound) + attempt.mark
        }

        //update user and exam
        const functionToBeUpdated = async (attempt) => {
            try {
                if (attempt.attemptId) {
                    return AttemptModel.findByIdAndUpdate(attempt.attemptId, attempt).lean()
                } else {
                    return AttemptModel.create(attempt)
                }
            } catch (error) {
                return error
            }
        }
        const [updatedUser, createdAttempt] = await Promise.all([
            UserModel.findByIdAndUpdate(
                user._id,
                { $addToSet: { exams: exam._id }, totalPoints: user.totalPoints, exam_marks: user.exam_marks }, // $addToSet prevents duplicates
                { new: true } // returns the updated user
            ).lean(),
            functionToBeUpdated(attempt)
        ])
        attempt._id = createdAttempt._id
        user = updatedUser
    }

    // answer = createdAnswer._id
    //return => {...questions , answer}
    res.json({ values: { user, questions: markedAnswers, attempt: { ...attempt, answers: markedAnswers.map(q => q.answer), createdAt: new Date() } } }) //, tokenTime: ''
})

//Put /questions/:id
const reCorrectAnswersOnUpdateOneQuestion = expressAsyncHandler(async (req, res, next) => {
    const question = req.body
    await reCorrectAnswersLimited(question)
    next()
})

const hasToReCorrect = async (question) => {
    try {
        const foundQuestion = await QuestionModel.findById(question._id).lean()

        const hasToChange =
            String(foundQuestion.rtOptionId) !== String(question.rtOptionId) ||
            Number(foundQuestion.points) !== Number(question.points);

        return hasToChange
    } catch (error) {
        console.log('error from hasToReCorrect ==>', error)
        throw error
    }
}

//Put /questions/:id as reCorrectAnswersOnUpdateOneQuestion 
//Embedded Fc => handelExam   
const reCorrectAnswersLimited = async (questionInput) => {
    const limit = (await pLimit())(10)
    const questions = Array.isArray(questionInput) ? questionInput : [questionInput];
    //Should ReCorrect when Q => score, rtOptionId

    try {
        await Promise.all(questions.map(question => //*_* const question of questions
            limit(async () => {
                const reCorrect = await hasToReCorrect(question)
                if (!reCorrect) return;

                const answers = await AnswerModel.find({ question: question._id }).populate([
                    { path: 'user', select: 'totalPoints marks exam_marks' }
                ]).lean()

                for (const answer of answers) {
                    const user = answer.user;
                    const [qInfo] = markOneQuestion({
                        ...question,
                        rtOptionId: question.rtOptionId,
                        chosenOptionId: answer.chosenOptionId
                    });
                    // Update User
                    const newMarks = (Number(user.marks || 0) - Number(answer.mark || 0)) + qInfo.mark;
                    const newTotalPoints = (Number(user.totalPoints || 0) - Number(answer.mark || 0)) + qInfo.mark;

                    await Promise.all([
                        AnswerModel.updateOne({ _id: answer._id }, {
                            mark: qInfo.mark,
                            isCorrect: qInfo.isCorrect
                        }),
                        UserModel.updateOne({ _id: user._id }, {
                            marks: newMarks,
                            totalPoints: newTotalPoints
                        }),
                    ])

                    // Update related attempts
                    const attempts = await AttemptModel.find({ answers: answer._id }).select('_id mark').lean()

                    //Should update user => exams_marks
                    if (attempts.length > 0) {
                        const updates = attempts.map(attempt => ({
                            updateOne: {
                                filter: { _id: attempt._id },
                                update: {
                                    $set: {
                                        mark: (attempt.mark - answer.mark) + qInfo.mark
                                    }
                                }
                            }
                        }));

                        await Promise.all([
                            AttemptModel.bulkWrite(updates),
                            UserModel.updateOne({ _id: user._id }, {
                                exam_marks: (user.exam_marks - answer.mark) + qInfo.mark,
                                totalPoints: (newTotalPoints - answer.mark) + qInfo.mark
                            })
                        ])
                    }
                }
            })
        ));
        return
    } catch (error) {
        console.error('Error from reCorrectAnswers:', error);
        throw error;
    }
};


const reCorrectQuestionDelete = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const question = req.params.id
    const answers = await AnswerModel.find({ question, user: user._id }).select('mark').lean()

    const marksToRemove = answers.reduce((prev, answer) => {
        prev += answer?.mark
        return prev
    }, 0)

    if (marksToRemove !== 0 && answers.length > 0) {
        await UserModel.updateOne({ _id: user._id }, {
            marks: (user.marks - marksToRemove),
            totalPoints: (user.totalPoints - marksToRemove),
        })
    }
    next()
})

module.exports = {
    reCorrectAnswersLimited, reCorrectAnswersOnUpdateOneQuestion,
    markQuestion, markAttempt,
    getAnswers, deleteAnswer, updateAnswer, answerParams
}

// updatedUser = await UserModel.findByIdAndUpdate(
//     user._id,
//     {
//         $inc: {
//             totalPoints: qInfo.mark,
//             marks: qInfo.mark
//         }
//     },
//     { new: true }
// );

//example Schema
//Attempt =
// user: '6773209b204e4289874de652',
// exam: '674775c649f5ca36c922dd58',
// answers: [
//   {
//     question: '680f7c379e3aab5804dac48a',
//     chosenOptionId: '709cbaac-4c87-4924-8210-1b4e833a5b2f'
//   },
//   {
//     question: '680fcb0b1b8364ff7620c20c',
//     chosenOptionId: '5062aacf-721f-425a-b208-0ce60952280e'
//   }
// ],
// tokenTime: 900000,
// course: '6747751849f5ca36c922dd3c',