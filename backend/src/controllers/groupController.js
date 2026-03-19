const db = require("../config/db");

// GET /api/groups
// Returns all groups, optionally filtered by ?courseCode=CP476
// Each group includes its member count and skill tags.
exports.getAllGroups = async (req, res) => {
  const { courseCode } = req.query;

  try {
    // Base query join courses to get courseCode
    let sql = `
      SELECT  g.groupID, g.title, g.aboutGroup, g.userCount, g.userMax,
              DATE_FORMAT(g.dueDate, '%b %d') AS dueDate,
              g.leaderID, g.courseInstanceID,
              c.courseCode
      FROM    groupsTbl g
      JOIN    courses   c ON c.courseInstanceID = g.courseInstanceID
    `;
    const params = [];

    if (courseCode) {
      sql += " WHERE c.courseCode = ?";
      params.push(courseCode.toUpperCase());
    }

    sql += " ORDER BY g.groupID DESC";

    const [groups] = await db.query(sql, params);

    // For each group, fetch skill tags via a separate query (avoids cartesian joins)
    for (const group of groups) {
      // Skills we store them in usersSkills on users; groups use a freeform approach
      // via the groupsSkills concept stored as comma-separated in a skills TEXT column
      // For now we return an empty array; wire up groupsSkills table when created.
      group.skills = [];

      // Member count is already in userCount column, but also get member initials
      const [members] = await db.query(
        `SELECT p.userID, p.fname, p.lname,
                CONCAT(LEFT(p.fname,1), LEFT(p.lname,1)) AS initials
         FROM   usersGroups ug
         JOIN   userProfiles p ON p.userID = ug.userID
         WHERE  ug.groupID = ?
         LIMIT  8`,
        [group.groupID]
      );
      group.members = members;
    }

    return res.json(groups);
  } catch (err) {
    console.error("getAllGroups error:", err);
    return res.status(500).json({ error: "Failed to fetch groups." });
  }
};

// GET /api/groups/:id
exports.getGroupByID = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT  g.groupID, g.title, g.aboutGroup, g.userCount, g.userMax,
               DATE_FORMAT(g.dueDate, '%b %d') AS dueDate,
               g.leaderID, g.courseInstanceID,
               c.courseCode
       FROM    groupsTbl g
       JOIN    courses   c ON c.courseInstanceID = g.courseInstanceID
       WHERE   g.groupID = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    const group = rows[0];

    // Members
    const [members] = await db.query(
      `SELECT p.userID, p.fname, p.lname,
              CONCAT(LEFT(p.fname,1), LEFT(p.lname,1)) AS initials,
              CASE WHEN p.userID = g.leaderID THEN 'Leader' ELSE 'Member' END AS role
       FROM   usersGroups ug
       JOIN   userProfiles p ON p.userID = ug.userID
       JOIN   groupsTbl    g ON g.groupID = ug.groupID
       WHERE  ug.groupID = ?`,
      [id, id]
    );
    group.members = members;
    group.skills  = [];

    return res.json(group);
  } catch (err) {
    console.error("getGroupByID error:", err);
    return res.status(500).json({ error: "Failed to fetch group." });
  }
};

// POST /api/groups
// Body: { title, aboutGroup, userMax, dueDate, courseInstanceID }
// Auth: required — leaderID comes from JWT
exports.createGroup = async (req, res) => {
  const { title, aboutGroup, userMax, dueDate, courseInstanceID } = req.body;
  const leaderID = req.user.userID;

  // Validation 
  if (!title || !userMax || !dueDate || !courseInstanceID) {
    return res.status(400).json({ error: "title, userMax, dueDate, and courseInstanceID are required." });
  }
  if (!Number.isInteger(Number(userMax)) || userMax < 2 || userMax > 10) {
    return res.status(400).json({ error: "userMax must be between 2 and 10." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert group
    const [groupResult] = await conn.query(
      `INSERT INTO groupsTbl (userCount, userMax, title, aboutGroup, dueDate, leaderID, courseInstanceID)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [userMax, title, aboutGroup || null, dueDate, leaderID, courseInstanceID]
    );
    const newGroupID = groupResult.insertId;

    // Add leader to usersGroups
    await conn.query(
      "INSERT INTO usersGroups (userID, groupID) VALUES (?, ?)",
      [leaderID, newGroupID]
    );

    await conn.commit();
    return res.status(201).json({ message: "Group created.", groupID: newGroupID });
  } catch (err) {
    await conn.rollback();
    console.error("createGroup error:", err);
    return res.status(500).json({ error: "Failed to create group." });
  } finally {
    conn.release();
  }
};

// PATCH /api/groups/:id
// Body: { title?, aboutGroup?, userMax?, dueDate? }
// Auth: only the leader can edit
exports.updateGroup = async (req, res) => {
  const { id }      = req.params;
  const { title, aboutGroup, userMax, dueDate } = req.body;
  const requesterID = req.user.userID;

  try {
    const [rows] = await db.query(
      "SELECT leaderID FROM groupsTbl WHERE groupID = ?", [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Group not found." });
    if (rows[0].leaderID !== requesterID) {
      return res.status(403).json({ error: "Only the group leader can edit this listing." });
    }

    // Build dynamic SET clause
    const fields = [];
    const values = [];
    if (title      !== undefined) { fields.push("title = ?");      values.push(title); }
    if (aboutGroup !== undefined) { fields.push("aboutGroup = ?"); values.push(aboutGroup); }
    if (userMax    !== undefined) { fields.push("userMax = ?");    values.push(userMax); }
    if (dueDate    !== undefined) { fields.push("dueDate = ?");    values.push(dueDate); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields provided to update." });
    }

    values.push(id);
    await db.query(`UPDATE groupsTbl SET ${fields.join(", ")} WHERE groupID = ?`, values);

    return res.json({ message: "Group updated." });
  } catch (err) {
    console.error("updateGroup error:", err);
    return res.status(500).json({ error: "Failed to update group." });
  }
};

// DELETE /api/groups/:id
// Auth: only the leader can delete
exports.deleteGroup = async (req, res) => {
  const { id }      = req.params;
  const requesterID = req.user.userID;

  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT leaderID FROM groupsTbl WHERE groupID = ?", [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Group not found." });
    if (rows[0].leaderID !== requesterID) {
      return res.status(403).json({ error: "Only the group leader can delete this listing." });
    }

    await conn.beginTransaction();
    // Delete child records first to respect FK constraints
    await conn.query("DELETE FROM requests    WHERE groupID = ?", [id]);
    await conn.query("DELETE FROM usersGroups WHERE groupID = ?", [id]);
    await conn.query("DELETE FROM groupsTbl   WHERE groupID = ?", [id]);
    await conn.commit();

    return res.json({ message: "Group deleted." });
  } catch (err) {
    await conn.rollback();
    console.error("deleteGroup error:", err);
    return res.status(500).json({ error: "Failed to delete group." });
  } finally {
    conn.release();
  }
};