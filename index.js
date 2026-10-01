import express from 'express';
const app = express();
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import device from 'express-device';

import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';
import helmet from 'helmet';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// get fc routes
import Apis from './routes/APIS.js'
import { notFound, errorrHandler } from './middleware/errorsHandler.js';
import testRoutes from './routes/testRoutes.js';
import AnswerModel from './models/AnswerModel.js';
import ExamModel from './models/ExamModel.js';
import AttemptModel from './models/AttemptModel.js';
import QuestionModel from './models/QuestionModel.js';
import ms from 'ms';
import UserModel from './models/UserModel.js';
import CourseModel from './models/CourseModel.js';
import LectureModel from './models/LectureModel.js';
import ChapterModel from './models/ChapterModel.js';
import GradeModel from './models/GradeModel.js';
import PlanModel from './models/PlanModel.js';
import SocialModel from './models/SocialModel.js';
import PaymentModel from './models/PaymentModel.js';

// config
// app.set('trust proxy', 'loopback');
dotenv.config();
app.set("trust proxy", 1);
const trustedIps = []; //, '::ffff:192.168.1.16' , '::ffff:192.168.1.16'

// process.env.NODE_ENV === 'development' && trustedIps.push('::ffff:192.168.1.16')

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 2 minutes
  limit: 400, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  message: "Too many requests, please try again after 2 minutes.",
  skip: (req) => {
    return trustedIps.includes(req.ip);
  },
  // store: ... , // Redis, Memcached, etc. See below.
});
app.use(limiter);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json({ limit: '3mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '3mb' }))

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(device.capture());

app.use("/api/get-ip", (req, res, next) => {
  // req.ip === req.socket.remoteAddress if proxy trust not 1 (loopback)
  // req.headers['x-forwarded-for'] === req.headers['x-real-ip']
  // console.log("the ip ===>", req.ip);
  // console.log("X-remote-ip:", req.socket.remoteAddress);
  // console.log("===");
  // console.log("X-Forwarded-For:", req.headers["x-forwarded-for"]);
  // console.log("X-real-ip:", req.headers["x-real-ip"]);
  // console.log("##################---##############");

  res.json({
    msg: "done here",
    ip: req.ip,
    // remote: req.socket.remoteAddress,
    // x: req.headers['x-forwarded-for'],
    // real: req.headers['x-real-ip'],
  });
});
// 'http://localhost:3000', , 'https://www.mrelbeltagy.com' 'http://192.168.1.16:3000',

const origin = [
  "https://elbeltagy-front.vercel.app",
  "https://mrelbeltagy.com",
  // 'http://192.168.1.9:3000'
];
process.env.NODE_ENV === "development" &&
  origin.push(...["http://localhost:3000"]);

app.use(
  cors({
    origin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

process.env.NODE_ENV === "development" && app.use(morgan("tiny"));
process.env.NODE_ENV === "development" && app.use("/test", testRoutes);
process.env.NODE_ENV === "development" && app.use("/api/test", testRoutes);

const port = process.env.PORT || 3030;
const DB_URI = process.env.MONGO_URI;

app.use("/storage", express.static(path.join(__dirname, "storage")));
//routes config
app.use((req, res, next) => {
  // const excludedRoutes = ['/', '/payment/callback', '/payment/webhook'];
  const excludedPrefixes = ["/api/invoices/webhook", '/api/facebook', '/api/messenger']; //webhook

  // If current route is excluded, skip the check
  if (excludedPrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return next();
  }

  const clientX = "teacher";
  const poweredByText = "Menassty ,";

  const client = req.headers["x-client"];
  const poweredBy = req.headers["x-powered-by"];
  if (clientX === client && poweredBy === poweredByText) {
    return next();
  } else {
    return res.status(403).render("denied");
  }
});

app.use("/api", Apis);

// for secure folders

// app.use("/storage/secure", (req, res, next) => {
//     next()
// })

// for errors
app.use(notFound);
app.use(errorrHandler);

const connectDb = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("connected");

    // fixGrades()
  } catch (error) {
    console.log("failed to connect ==>", error);
  }
};
connectDb();

app.listen(port, "0.0.0.0", async () => {
  console.log(`the app is working on port: ${port}`);
});
