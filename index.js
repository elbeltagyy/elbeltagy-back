const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const bodyParser = require("body-parser")
const helmet = require("helmet")
const morgan = require("morgan")
const app = express()
const { default: mongoose } = require("mongoose")
var cookieParser = require('cookie-parser')
const crypto = require('crypto')
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

// config
dotenv.config()
const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: "Too many login attempts, please try again later.",
    // store: ... , // Redis, Memcached, etc. See below.
})
app.use(limiter)

app.use(helmet());
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(device.capture());

app.use(cors(
    {
        origin: ['https://elbeltagy-front.vercel.app', 'http://localhost:3000', 'http://192.168.1.16:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    }
))

process.env.NODE_ENV === 'development' && app.use(morgan('tiny'))

const port = process.env.PORT || 5001
const DB_URI = process.env.MONGO_URI


//routes config
app.use("/api/test", testRoutes)
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
app.get("/test", testRoutes)

// for secure folders
app.use("/storage/secure", (req, res, next) => {
    next()
})
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

const connectDb = async () => {
    try {
        await mongoose.connect(DB_URI)
        console.log('connected')
    } catch (error) {
        console.log('failed to connect ==>', error)
    }

}

connectDb()

app.listen(port, async () => {
    console.log(`the app is working on port: ${port}`)
})
