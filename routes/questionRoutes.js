const { countStatistics } = require("../controllers/videoController")
const { getQuestions, createQuestion, deleteQuestion, updateQuestion, createManyQuestions, linkQuestionToTags, unLinkQuestionToTags, startQuestionsBank, formatAI, validateText } = require("../controllers/questionController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")


const { user_roles } = require("../tools/constants/rolesConstants")
const { reCorrectAnswersOnUpdateOneQuestion } = require("../controllers/answerController")
const { validateUserTag } = require("../controllers/tagController")
const router = require("express").Router()

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

module.exports = router