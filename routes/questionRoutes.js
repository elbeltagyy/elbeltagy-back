import { countStatistics } from '../controllers/videoController.js';
import { getQuestions, createQuestion, deleteQuestion, updateQuestion, createManyQuestions, linkQuestionToTags, unLinkQuestionToTags, startQuestionsBank, formatAI, validateText } from '../controllers/questionController.js';
import allowedTo from '../middleware/allowedTo.js';
import verifyToken from '../middleware/verifyToken.js';


import { user_roles } from '../tools/constants/rolesConstants.js';
import { reCorrectAnswersOnUpdateOneQuestion } from '../controllers/answerController.js';
import { validateUserTag } from '../controllers/tagController.js';
import express from 'express';
const router = express.Router();

router.route("/")
    .get(
        verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        getQuestions)
    .post(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN),
        createManyQuestions)

router.route('/bank')
    .post(verifyToken(),
        allowedTo(user_roles.STUDENT, user_roles.ONLINE), validateUserTag, startQuestionsBank)
router.route("/format/ai")
    .post(verifyToken(),
        allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), validateText, formatAI)

router.route("/:id")
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), reCorrectAnswersOnUpdateOneQuestion, updateQuestion)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteQuestion) //*_* remove all related answers

router.route("/:id/tags")
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), linkQuestionToTags)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), unLinkQuestionToTags)

export default router;