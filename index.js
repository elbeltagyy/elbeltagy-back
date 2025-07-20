const express = require("express")
const app = express()
const dotenv = require("dotenv")
const path = require('path')
const bodyParser = require("body-parser")
const { default: mongoose } = require("mongoose")
var cookieParser = require('cookie-parser')
var device = require('express-device');

const cors = require("cors")
const { rateLimit } = require("express-rate-limit")
const morgan = require("morgan")
const helmet = require("helmet")

// get fc routes
const { notFound, errorrHandler } = require("./middleware/errorsHandler")
const testRoutes = require("./routes/testRoutes")
const AnswerModel = require("./models/AnswerModel")
const ExamModel = require("./models/ExamModel")
const AttemptModel = require("./models/AttemptModel")
const QuestionModel = require("./models/QuestionModel")
const ms = require("ms")
const UserModel = require("./models/UserModel")


// config
// app.set('trust proxy', 'loopback');
dotenv.config()
app.set('trust proxy', 1);
const trustedIps = ["102.189.10.217", '156.197.75.241'] //, '::ffff:192.168.1.16' , '::ffff:192.168.1.16'

process.env.NODE_ENV === 'development' && trustedIps.push('::ffff:192.168.1.16')

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 2 minutes
    limit: 400, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: "Too many requests, please try again after 2 minutes.",
    skip: (req) => {
        return trustedIps.includes(req.ip);
    },
    // store: ... , // Redis, Memcached, etc. See below.
})
app.use(limiter)

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(device.capture());

app.use('/api/get-ip', (req, res, next) => {
    // req.ip === req.socket.remoteAddress if proxy trust not 1 (loopback)
    // req.headers['x-forwarded-for'] === req.headers['x-real-ip']
    console.log('the ip ===>', req.ip)
    console.log('X-remote-ip:', req.socket.remoteAddress);
    console.log('===')
    console.log('X-Forwarded-For:', req.headers['x-forwarded-for']);
    console.log('X-real-ip:', req.headers['x-real-ip']);
    console.log('##################---##############')

    res.json({
        msg: 'done here',
        ip: req.ip,
        // remote: req.socket.remoteAddress,
        // x: req.headers['x-forwarded-for'],
        // real: req.headers['x-real-ip'],
    })
})
// 'http://localhost:3000', , 'https://www.mrelbeltagy.com' 'http://192.168.1.16:3000',

const origin = ['https://elbeltagy-front.vercel.app', 'https://mrelbeltagy.com']
process.env.NODE_ENV === 'development' && origin.push(...['http://192.168.1.16:3000', 'http://localhost:3000', 'http://192.168.1.13:3000'])

app.use(cors(
    {
        origin,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true
    }
))

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

process.env.NODE_ENV === 'development' && app.use(morgan('tiny'))
process.env.NODE_ENV === 'development' && app.use("/test", testRoutes)
process.env.NODE_ENV === 'development' && app.use("/api/test", testRoutes)

const port = process.env.PORT || 3030
const DB_URI = process.env.MONGO_URI


//routes config
app.use((req, res, next) => {
    const clientX = 'teacher'
    const poweredByText = 'Menassty ,'

    const client = req.headers['x-client'];
    const poweredBy = req.headers['x-powered-by'];
    if (clientX === client && poweredBy === poweredByText) {
        return next();
    } else {
        return res.status(403).render('denied');
    }
});
app.use('/api', require('./routes/APIS'))

// for secure folders

// app.use("/storage/secure", (req, res, next) => {
//     next()
// })
app.use('/storage', express.static(path.join(__dirname, 'storage')))

// for errors 
app.use(notFound)
app.use(errorrHandler)

const connectDb = async () => {
    try {



        await mongoose.connect(DB_URI)
        console.log('connected')

        // // Exams => save question to prevQuestions
        // for (const exam of exams) {
        // // change questions in model
        //     exam.prevQuestions = exam.questions;
        //     await exam.save();
        // }     
        // console.log('questions modified')

        const exams = await ExamModel.find()

        for (const exam of exams) {

            delete exam.questions
            exam.questions = []
            for (question of exam.prevQuestions) {

                const createdQuestion = await QuestionModel.create({
                    prevId: question._id,
                    grade: 1,
                    title: question.title,
                    hints: question.hints,
                    points: question.points,

                    options: question.options,
                    rtOptionId: question.rtOptionId,

                    isActive: true,
                    image: question.image
                })
                exam.questions.push(createdQuestion._id)
            }
            await exam.save();
        }
        console.log('saved Exam with questions ids')
        //take prevQuestion to create new question

        await UserModel.updateMany({}, {
            totalPoints: 0,
            exam_marks: 0,
            marks: 0
        })
        console.log('reset score to 0')

        //create Answers from Exam
        const attempts = await AttemptModel.find().populate('user exam')
        for (const attempt of attempts) {
            const user = attempt.user

            attempt.answers = []
            for (const chosenOption of attempt.chosenOptions) {

                const itsQuestion = await QuestionModel.findOne({
                    prevId: chosenOption.questionId
                })
                const mark = chosenOption.chosenOptionId === itsQuestion.rtOptionId ? itsQuestion.points : 0
                //create Answer
                const answer = await AnswerModel.create({
                    user: user._id,
                    question: itsQuestion._id,

                    chosenOptionId: chosenOption.chosenOptionId,
                    mark,

                    isCorrect: chosenOption.chosenOptionId === itsQuestion.rtOptionId ? true : false,
                })
                attempt.answers.push(answer._id)
            }

            attempt.preservedTime = attempt.tokenTime
            attempt.tokenTime = ms(attempt.exam.time) - attempt.tokenTime

            await attempt.save()
        }

        console.log('saved Attempts')

        const users = await UserModel.find()
        for (const user of users) {
            const attempts = await AttemptModel.find({ user: user._id })
            console.log('before reduce')
            const marks = attempts.reduce((prev, attempt) => prev += (attempt.mark || 0), 0)
            console.log('after reduce')
            
            user.totalPoints = marks
            user.marks = marks
            user.exam_marks = marks
            await user.save()
        }
        console.log('done attempts')

        //embed Answer to Exam answers
    } catch (error) {
        console.log('failed to connect ==>', error)
    }

}

connectDb()

app.listen(port, '0.0.0.0', async () => {
    console.log(`the app is working on port: ${port}`)
})