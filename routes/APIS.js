import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import codeRoutes from './codeRoutes.js';

import unitRoutes from './unitRoutes.js';
import courseRoutes from './courseRoutes.js';
import lecturesRoutes from './lectureRoutes.js';

import userCourseRoutes from './userCourseRoutes.js';
import statisticsRoutes from './statisticsRoutes.js';

import sessionRoutes from './sessionRoutes.js';
import couponRoutes from './couponRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import feedBackRoutes from './feedBackRoutes.js';
import tagRoutes from './tagRoutes.js';

import gradeRoutes from './gradeRoutes.js';
import chapterRoutes from './chapterRoutes.js';
import examRoutes from './examRoutes.js';
import videoStatisticsRoutes from './videoStatisticsRoutes.js';
import privacyRoutes from './privacyRoutes.js';

import whatsappRoutes from './whatsappRoutes.js';
import reportRoutes from './reportRoutes.js';
import reportFailedRoutes from './reportFailedRoutes.js';

import attemptRoutes from './attemptRoutes.js';
import questionRoutes from './questionRoutes.js';
import answerRoutes from './answerRoutes.js';

import groupRoutes from './groupRoutes.js';

import fileRoutes from './fileRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';

import facebookRoutes from './socials/facebookRoutes.js';
import messengerRoutes from './socials/messengerRoutes.js';
import conversationsRoutes from './socials/conversationsRoutes.js';

import planRoutes from './planRoutes.js';
import planTaskRoutes from './planTaskRoutes.js';
import templateRoutes from './templateRoutes.js';

import bookRoutes from './bookRoutes.js';
import bookOrderRoutes from './bookOrderRoutes.js';
import applicationRoutes from './applicationRoutes.js';

import communityQuestionsRoutes from './communityQuestionsRoutes.js';
import communityCommentsRoutes from './communityCommentsRoutes.js';
import errorRoutes from './errorRoutes.js';

router.use("/sessions", sessionRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/codes", codeRoutes);
router.use("/coupons", couponRoutes);
router.use("/notifications", notificationRoutes);
router.use("/feedBacks", feedBackRoutes);
router.use("/tags", tagRoutes);

router.use("/grades", gradeRoutes);
router.use("/chapters", chapterRoutes);
router.use("/content/units", unitRoutes);
router.use("/content/courses", courseRoutes);
router.use("/content/lectures", lecturesRoutes);
router.use("/content/exams", examRoutes);
router.use('/video_statistics', videoStatisticsRoutes);
router.use("/privacy", privacyRoutes);

router.use("/subscriptions", userCourseRoutes);
router.use("/statistics", statisticsRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/reports", reportRoutes);
router.use("/reports_failed", reportFailedRoutes);

router.use("/attempts", attemptRoutes);
router.use("/questions", questionRoutes);
router.use("/answers", answerRoutes);

router.use("/groups", groupRoutes);

router.use('/files', fileRoutes);
router.use('/payments', paymentRoutes);
router.use('/invoices', invoiceRoutes);

router.use('/facebook', facebookRoutes);
router.use('/messenger', messengerRoutes);
router.use('/conversations', conversationsRoutes);

router.use('/plans', planRoutes);
router.use('/tasks', planTaskRoutes);
router.use('/templates', templateRoutes);

router.use('/books', bookRoutes);
router.use('/booksOrders', bookOrderRoutes);
router.use('/applications', applicationRoutes);

router.use('/community/questions', communityQuestionsRoutes);
router.use('/community/comments', communityCommentsRoutes);
router.use('/errors', errorRoutes);

export default router;