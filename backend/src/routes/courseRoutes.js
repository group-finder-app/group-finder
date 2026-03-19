const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/authMiddleware");
const { getCourses, getCourseByCode } = require("../controllers/courseController");

router.get("/",           auth, getCourses);       // GET /api/courses
router.get("/:courseCode", auth, getCourseByCode); // GET /api/courses/CP476

module.exports = router;