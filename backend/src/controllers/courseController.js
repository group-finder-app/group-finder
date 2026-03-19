const db = require("../config/db");

// GET /api/courses 
// Returns all courses (for populating dropdowns and validating course codes).
// Optional filter: ?schoolID=1
exports.getCourses = async (req, res) => {
  const { schoolID } = req.query;

  try {
    let sql = `
      SELECT courseInstanceID, courseCode, courseName, section, term, schoolID
      FROM   courses
    `;
    const params = [];

    if (schoolID) {
      sql += " WHERE schoolID = ?";
      params.push(schoolID);
    }

    sql += " ORDER BY courseCode ASC";
    const [courses] = await db.query(sql, params);
    return res.json(courses);
  } catch (err) {
    console.error("getCourses error:", err);
    return res.status(500).json({ error: "Failed to fetch courses." });
  }
};

// GET /api/courses/:courseCode
// Validate a course code and return matching course instances.
exports.getCourseByCode = async (req, res) => {
  const { courseCode } = req.params;

  try {
    const [courses] = await db.query(
      "SELECT * FROM courses WHERE courseCode = ? ORDER BY term DESC",
      [courseCode.toUpperCase()]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: "No course found with that code." });
    }
    return res.json(courses);
  } catch (err) {
    console.error("getCourseByCode error:", err);
    return res.status(500).json({ error: "Failed to fetch course." });
  }
};