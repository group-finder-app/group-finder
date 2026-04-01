const db     = require("../config/db");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
 
// POST /api/auth/register
// Body: { email, password, fname, lname, userYear, majorID, schoolID }
exports.register = async (req, res) => {
  const { email, password, fname, lname, userYear, majorID, schoolID } = req.body;
 
  // Server-side validation
  if (!email || !password || !fname || !lname || !userYear || !majorID || !schoolID) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (!Number.isInteger(Number(userYear)) || userYear < 1 || userYear > 6) {
    return res.status(400).json({ error: "userYear must be between 1 and 6." });
  }
 
  try {
    // Check for duplicate email
    const [existing] = await db.query(
      "SELECT userID FROM users WHERE email = ?", [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
 
    // Hash password
    const hashPass = await bcrypt.hash(password, 12);
 
    // Insert into users table
    const [userResult] = await db.query(
      "INSERT INTO users (email, hashPass) VALUES (?, ?)",
      [email, hashPass]
    );
    const newUserID = userResult.insertId;
 
    // Insert into userProfiles table
    await db.query(
      `INSERT INTO userProfiles (userID, fname, lname, score, userYear, aboutUser, schoolID, majorID)
       VALUES (?, ?, ?, 0, ?, NULL, ?, ?)`,
      [newUserID, fname, lname, userYear, schoolID, majorID]
    );
 
    return res.status(201).json({ message: "Account created successfully.", userID: newUserID });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error during registration." });
  }
};
 
// POST /api/auth/login
// Body: { email, password }
exports.login = async (req, res) => {
  const { email, password } = req.body;
 
  // Server-side validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
 
  try {
    // Fetch user + profile in one JOIN
    const [rows] = await db.query(
      `SELECT u.userID, u.email, u.hashPass,
              p.fname, p.lname, p.score, p.userYear, p.aboutUser, p.schoolID, p.majorID
       FROM users u
       JOIN userProfiles p ON p.userID = u.userID
       WHERE u.email = ?`,
      [email]
    );
 
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
 
    const user = rows[0];
 
    // Compare password
    const match = await bcrypt.compare(password, user.hashPass);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
 
    // Sign JWT... expires in 8 hours
    const token = jwt.sign(
      { userID: user.userID, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
 
    // Return token + safe user data (never return hashPass)
    return res.json({
      token,
      user: {
        userID:    user.userID,
        email:     user.email,
        fname:     user.fname,
        lname:     user.lname,
        score:     user.score,
        userYear:  user.userYear,
        aboutUser: user.aboutUser,
        schoolID:  user.schoolID,
        majorID:   user.majorID,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login." });
  }
};