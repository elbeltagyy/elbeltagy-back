const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const bodyParser = require("body-parser")
// const helmet = require("helmet")
const morgan = require("morgan")
const app = express()
const { default: mongoose } = require("mongoose")
var cookieParser = require('cookie-parser')
var device = require('express-device');
const path = require('path')
const { rateLimit } = require("express-rate-limit")

// get fc routes
const verifyToken = require("./middleware/verifyToken")
const createError = require("./tools/createError")
const { notFound, errorrHandler } = require("./middleware/errorsHandler")
const testRoutes = require("./routes/testRoutes")

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const codeRoutes = require("./routes/codeRoutes")

const unitRoutes = require("./routes/unitRoutes")
const courseRoutes = require("./routes/courseRoutes")
const lecturesRoutes = require("./routes/lectureRoutes")

const userCourseRoutes = require("./routes/userCourseRoutes")
const statisticsRoutes = require("./routes/statisticsRoutes")

const UserModel = require("./models/UserModel")
const governments = require("./tools/constants/governments")
const makeRandom = require("./tools/makeRandom")
const AttemptModel = require("./models/AttemptModel")
const CourseModel = require("./models/CourseModel")
const UserCourseModel = require("./models/UserCourseModel")

// config
dotenv.config()
app.set('trust proxy', 'loopback');
const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: "Too many requests, please try again later.",
    // store: ... , // Redis, Memcached, etc. See below.
})
// app.use(limiter)

// 
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(device.capture());

app.use('/api/get-ip', (req, res, next) => {
    console.log('the ip ===>', req.ip)
    console.log('X-Forwarded-For:', req.headers['x-forwarded-for']);
    console.log('X-real-ip:', req.headers['x-real-ip']);
    console.log('X-remote-ip:', req.socket.remoteAddress);

    res.json({
        msg: 'done here',
        ip: req.ip,
        x: req.headers['x-forwarded-for'],
        real: req.headers['x-real-ip'],
        remote: req.socket.remoteAddress
    })
})


app.use(cors(
    {
        origin: ['https://elbeltagy-front.vercel.app', 'http://localhost:3000', 'http://192.168.1.16:3000', 'https://mrelbeltagy.com', 'https://www.mrelbeltagy.com'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    }
))

process.env.NODE_ENV === 'development' && app.use(morgan('tiny'))
process.env.NODE_ENV === 'development' && app.use("/test", testRoutes)
process.env.NODE_ENV === 'development' && app.use("/api/test", testRoutes)

// process.env.NODE_ENV === 'production' && app.use(helmet());

const port = process.env.PORT || 3030
const DB_URI = process.env.MONGO_URI


//routes config

app.use("/api/sessions", require("./routes/sessionRoutes"))
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/codes", codeRoutes)
app.use("/api/coupons", require("./routes/couponRoutes"))
app.use("/api/notifications", require('./routes/notificationRoutes'))

app.use("/api/content/units", unitRoutes)
app.use("/api/content/courses", courseRoutes)
app.use("/api/content/lectures", lecturesRoutes)
app.use("/api/attempts", require('./routes/attemptRoutes'))
app.use("/api/privacy", require('./routes/privacyRoutes'))

app.use("/api/subscriptions", userCourseRoutes)
app.use("/api/statistics", statisticsRoutes)

app.use('/api/files', require('./routes/fileRoutes'))


// for secure folders
// app.use("/storage/secure", (req, res, next) => {
//     next()
// })
app.use('/storage', express.static(path.join(__dirname, 'storage')))


// for errors 
app.use(notFound)
app.use(errorrHandler)

const createUsers = async () => {
    try {
        console.log('start Injection')

        for (let i = 0; i < 10000; i++) {
            const randomFrom1To0 = makeRandom(1, 2, 1)
            const radnomAll = makeRandom(1, 9, 1)

            const user = {
                userName: 'usermee' + i,
                grade: randomFrom1To0,
                name: 'name is ' + i,
                email: 'test@gmail.com',
                password: '$2a$10$K2Vu6hIa3O5mgAxDsk7jUOGJLmsiQgvc2161T7EDkkjXlpIODEH3C',
                phone: '01000' + i,
                familyPhone: '010' + i,
                role: 'اونلاين',
                government: radnomAll
            }
            await UserModel.create(user)
        }
        console.log('injected done')
    } catch (error) {
        console.log('failed ==>', error)
    }
}

const handelAttempts = async () => {
    // linked to 
    console.log('start modifiynig')
    const attempts = await AttemptModel.find()
    // const bigCourse = await CourseModel.findById('673c5d58236a64fb00c48a1f')

    attempts.forEach(async (attempt) => {
        const user = await UserModel.findById(attempt.user).select('courses')
        const userCourse = await UserCourseModel.findOne({
            user: attempt.user,
            currentIndex: { $gte: 3 }
        })
        if (attempt.course) {
            return
        }

        if (user.courses.length === 1) {
            attempt.course = user.courses[0]
        } else {
            attempt.course = userCourse.course
        }
        await attempt.save()
        console.log('user Name ==>', user.name, '|| courses number ==> ', user.courses.length, ' || userCourse CurrentIndex ===', userCourse.currentIndex)
    })

    console.log('finish modifiynig')

}

const connectDb = async () => {
    try {
        await mongoose.connect(DB_URI, {
            useNewUrlParser: true,            // Use the new URL string parser
            useUnifiedTopology: true,         // Use the new Server Discover and Monitoring engine
        })
        console.log('connected')
    } catch (error) {
        console.log('failed to connect ==>', error)
    }

}

connectDb()

app.listen(port, async () => {
    console.log(`the app is working on port: ${port}`)
})
