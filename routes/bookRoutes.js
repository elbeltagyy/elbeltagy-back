
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")

const { user_roles } = require("../tools/constants/rolesConstants")
const { getBooks, createBook, updateBook, deleteBook, countBooks } = require("../controllers/bookController")
const { secureGetAll } = require("../middleware/secureMiddleware")
const { upload } = require("../middleware/storage")
const { handelMultipleFiles } = require("../controllers/factoryHandler")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(true), secureGetAll({ key: 'isActive', value: true }), getBooks)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'file', maxCount: 1 }, // adjust maxCount as needed
    ]), handelMultipleFiles(['avatar', 'file']), createBook)

router.route('/count')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), countBooks)

router.route("/:id")
    // .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'file', maxCount: 1 }, // adjust maxCount as needed
    ]), handelMultipleFiles(['avatar', 'file']), updateBook)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteBook)

module.exports = router