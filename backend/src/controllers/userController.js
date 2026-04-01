const db = require("../config/db");

// GET /api/users/me
// Returns full profile for the logged-in user (from JWT).
exports.getMyProfile = async (req, res) => {
  const userID = req.user.userID;

  try {
    const [rows] = await db.query(
      `SELECT u.userID, u.email,
              p.fname, p.lname, p.score, p.userYear, p.aboutUser, p.schoolID, p.majorID,
              m.majorName, s.schoolName
       FROM   users        u
       JOIN   userProfiles p ON p.userID  = u.userID
       LEFT JOIN majors    m ON m.majorID = p.majorID
       LEFT JOIN schools   s ON s.schoolID = p.schoolID
       WHERE  u.userID = ?`,
      [userID]
    );

    if (rows.length === 0) return res.status(404).json({ error: "User not found." });

    const user = rows[0];

    // Fetch skills
    const [skills] = await db.query(
      `SELECT sk.skillName
       FROM   usersSkills us
       JOIN   skills      sk ON sk.skillID = us.skillID
       WHERE  us.userID = ?`,
      [userID]
    );
    user.skills = skills.map(s => s.skillName);

    return res.json(user);
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
};

// GET /api/users/:id
// Returns public profile for any user.
exports.getUserByID = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT u.userID, u.email,
              p.fname, p.lname, p.score, p.userYear, p.aboutUser,
              m.majorName, s.schoolName
       FROM   users        u
       JOIN   userProfiles p ON p.userID  = u.userID
       LEFT JOIN majors    m ON m.majorID = p.majorID
       LEFT JOIN schools   s ON s.schoolID = p.schoolID
       WHERE  u.userID = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found." });

    const user = rows[0];
    const [skills] = await db.query(
      `SELECT sk.skillName FROM usersSkills us
       JOIN skills sk ON sk.skillID = us.skillID
       WHERE us.userID = ?`,
      [id]
    );
    user.skills = skills.map(s => s.skillName);

    return res.json(user);
  } catch (err) {
    console.error("getUserByID error:", err);
    return res.status(500).json({ error: "Failed to fetch user." });
  }
};

// GET /api/users/me/groups
// Returns groups the logged-in user manages, is a member of, and has applied to.
exports.getMyGroups = async (req, res) => {
  const userID = req.user.userID;

  try {
    // Groups I lead
    const [managing] = await db.query(
      `SELECT g.groupID, g.title, g.userCount, g.userMax,
              DATE_FORMAT(g.dueDate, '%b %d') AS dueDate,
              c.courseCode
       FROM   groupsTbl g
       JOIN   courses   c ON c.courseInstanceID = g.courseInstanceID
       WHERE  g.leaderID = ?`,
      [userID]
    );

    // For each managed group, fetch pending requests
    for (const g of managing) {
      const [reqs] = await db.query(
        `SELECT r.reqID, r.message, r.reqUserID,
                p.fname, p.lname,
                CONCAT(LEFT(p.fname,1), LEFT(p.lname,1)) AS initials
         FROM   requests r
         JOIN   userProfiles p ON p.userID = r.reqUserID
         WHERE  r.groupID = ? AND r.reqStatus = 'pending'`,
        [g.groupID]
      );
      g.requests = reqs;

      const [members] = await db.query(
        `SELECT p.userID, p.fname, p.lname,
                CONCAT(LEFT(p.fname,1), LEFT(p.lname,1)) AS initials
         FROM   usersGroups ug
         JOIN   userProfiles p ON p.userID = ug.userID
         WHERE  ug.groupID = ?`,
        [g.groupID]
      );
      g.members = members;
    }

    // Groups I'm a member of (but not leader)
    const [memberships] = await db.query(
      `SELECT g.groupID, g.title, c.courseCode
       FROM   usersGroups ug
       JOIN   groupsTbl   g ON g.groupID = ug.groupID
       JOIN   courses     c ON c.courseInstanceID = g.courseInstanceID
       WHERE  ug.userID = ? AND g.leaderID != ?`,
      [userID, userID]
    );

    // Applications I've sent (pending)
    const [applications] = await db.query(
      `SELECT r.reqID, r.reqStatus, g.groupID, g.title, c.courseCode
       FROM   requests  r
       JOIN   groupsTbl g ON g.groupID = r.groupID
       JOIN   courses   c ON c.courseInstanceID = g.courseInstanceID
       WHERE  r.reqUserID = ?`,
      [userID]
    );

    return res.json({ managing, memberships, applications });
  } catch (err) {
    console.error("getMyGroups error:", err);
    return res.status(500).json({ error: "Failed to fetch groups." });
  }
};

// POST /api/users/:id/vouch
// Increment score for a user. One vouch per pair enforced at application layer.
// Auth: required
exports.vouchUser = async (req, res) => {
  const targetID  = Number(req.params.id);
  const voucherID = req.user.userID;

  if (targetID === voucherID) {
    return res.status(400).json({ error: "You cannot vouch for yourself." });
  }

  try {
    // Confirm target user exists
    const [users] = await db.query(
      "SELECT userID FROM users WHERE userID = ?", [targetID]
    );
    if (users.length === 0) return res.status(404).json({ error: "User not found." });

    // Increment score CHECK constraint ensures score >= 0
    await db.query(
      "UPDATE userProfiles SET score = score + 1 WHERE userID = ?",
      [targetID]
    );

    // Return new score
    const [updated] = await db.query(
      "SELECT score FROM userProfiles WHERE userID = ?", [targetID]
    );

    return res.json({ message: "Vouch recorded.", newScore: updated[0].score });
  } catch (err) {
    console.error("vouchUser error:", err);
    return res.status(500).json({ error: "Failed to record vouch." });
  }
};

// PATCH /api/users/me/profile
// Update own profile fields.
// Body: { fname?, lname?, userYear?, aboutUser? }
// PATCH /api/users/me/profile
exports.updateProfile = async (req, res) => {
  const userID = req.user.userID;
  const { fname, lname, userYear, aboutUser, skills } = req.body; 

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Update userProfiles (Name, Year, About Me)
    const fields = [];
    const values = [];
    if (fname     !== undefined) { fields.push("fname = ?");     values.push(fname); }
    if (lname     !== undefined) { fields.push("lname = ?");     values.push(lname); }
    if (userYear  !== undefined) { fields.push("userYear = ?");  values.push(userYear); }
    if (aboutUser !== undefined) { fields.push("aboutUser = ?"); values.push(aboutUser); }

    if (fields.length > 0) {
      values.push(userID);
      await conn.query(`UPDATE userProfiles SET ${fields.join(", ")} WHERE userID = ?`, values);
    }

    // 2. Sync Technical Skills 
    if (skills && Array.isArray(skills)) {
      // Clear existing links for this user
      await conn.query("DELETE FROM usersSkills WHERE userID = ?", [userID]);

      for (let sName of skills) {
        const name = sName.trim();
        if (!name) continue;

        // Find or Create the skill in the master 'skills' table
        let [rows] = await conn.query("SELECT skillID FROM skills WHERE skillName = ?", [name]);
        let sID;

        if (rows.length === 0) {
          const [ins] = await conn.query("INSERT INTO skills (skillName) VALUES (?)", [name]);
          sID = ins.insertId;
        } else {
          sID = rows[0].skillID;
        }

        // Link user to skill
        await conn.query("INSERT INTO usersSkills (userID, skillID) VALUES (?, ?)", [userID, sID]);
      }
    }

    await conn.commit();
    return res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    await conn.rollback();
    console.error("updateProfile error:", err);
    return res.status(500).json({ error: "Failed to update profile." });
  } finally {
    conn.release();
  }
};