const { getCourses, createCourse, getOneCourse, updateCourse, deleteCourse } = require("../controllers/courseController")

const router = require("express").Router()

router.route("/")
    .get(getCourses)
    .post(createCourse)

router.route("/:id")
    .get(getOneCourse)
    .put(updateCourse)
    .delete(deleteCourse)

module.exports = router
