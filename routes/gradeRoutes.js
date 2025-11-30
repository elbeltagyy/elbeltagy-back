const { handelOneFile } = require('../controllers/factoryHandler')
const { getGrades, createGrade, updateGrade, getOneGrade, deleteGrade } = require('../controllers/gradeController')
const allowedTo = require('../middleware/allowedTo')
const { secureGetAll } = require('../middleware/secureMiddleware')
const { upload } = require('../middleware/storage')
const verifyToken = require('../middleware/verifyToken')
const { user_roles } = require('../tools/constants/rolesConstants')

const router = require('express').Router()

router.route("/")
    .get(verifyToken(true), secureGetAll({ key: "isActive", value: true }, [user_roles.SUBADMIN, user_roles.ADMIN]), getGrades)
    .post(verifyToken(), allowedTo(user_roles.ADMIN), upload.single('image'), handelOneFile('image'), createGrade)

router.route("/:id")
    .get(getOneGrade)
    .put(verifyToken(), allowedTo(user_roles.ADMIN), upload.single('image'), handelOneFile('image'), updateGrade)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN), deleteGrade)
module.exports = router

