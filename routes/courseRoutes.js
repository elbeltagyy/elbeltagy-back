import { getCourses, createCourse, getOneCourse, updateCourse, deleteCourse, uploadCourseImg, getCourseLecturesAndCheckForUser, subscribe, getLectureAndCheck, lecturePassed, getExam, createAttempt, linkCourse, checkDeleteCourse, getUserCoursesMiddleware } from '../controllers/courseController.js';
import { upload } from '../middleware/storage.js';

import { user_roles } from '../tools/constants/rolesConstants.js';
import verifyToken from '../middleware/verifyToken.js';
import allowedTo from '../middleware/allowedTo.js';

import express from 'express';
import { secureGetAll } from '../middleware/secureMiddleware.js';
const router = express.Router();

router.route("/")
    .get(verifyToken(true), secureGetAll({ key: 'isActive', value: true }), getCourses)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('thumbnail'), uploadCourseImg, createCourse)

router.route("/user")
    .get(verifyToken(false, {
        populate: {
            path: 'user',
            select: '+courses'
        }
    }), secureGetAll({ key: 'isActive', value: true }), getUserCoursesMiddleware, getCourses)

router.route("/:id")
    .get(verifyToken(true), secureGetAll({ key: 'isActive', value: true }), getOneCourse)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.single('thumbnail'), uploadCourseImg, updateCourse)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), checkDeleteCourse, deleteCourse)

router.route("/:id/link")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), linkCourse)

// USER LECTURES ROUTES ######
router.route('/:id/lectures') //most important id === index
    .get(verifyToken(true), getCourseLecturesAndCheckForUser)

router.route('/:id/lectures/:lectureId') //most important id === index || lectureId ===_id
    .get(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), getLectureAndCheck)

router.route('/:id/lectures/:lectureId/pass') //most important id === course._id || lectureId ===_id
    .post(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), lecturePassed)

// EXAMS ROUTES ##########
router.route('/:id/exams/:examId') //most important id === course._id || lectureId ===_id
    .get(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), getExam)

router.route('/:id/attempts') //calc mark, most important id === course._id || lectureId ===_id
    .post(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), createAttempt)

router.route('/:id/subscribe') //most important id === _id
    .post(verifyToken(), allowedTo(user_roles.ONLINE, user_roles.STUDENT), subscribe)

export default router;
