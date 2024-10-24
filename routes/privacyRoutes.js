const { getPrivacies, createPrivacy, updatePrivacy, deletePrivacy } = require("../controllers/privacyController")

const router = require("express").Router()

router.route("/")
    .get(getPrivacies)
    .post(createPrivacy)

router.route("/:id")
    .put(updatePrivacy)
    .delete(deletePrivacy)

module.exports = router