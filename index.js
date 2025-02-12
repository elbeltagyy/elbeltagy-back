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


// config
// app.set('trust proxy', 'loopback');
dotenv.config()
app.set('trust proxy', 1);
const trustedIps = ["102.189.10.217", '156.197.75.241', '::ffff:192.168.1.16'] //, '::ffff:192.168.1.16'

const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    limit: 120, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
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

app.use(cors(
    {
        origin: ['https://elbeltagy-front.vercel.app', 'http://localhost:3000', 'http://192.168.1.16:3000', 'https://mrelbeltagy.com', 'https://www.mrelbeltagy.com'],
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