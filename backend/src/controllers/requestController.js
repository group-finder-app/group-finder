const db = require("../config/db");

// POST /api/requests
// Submit a request to join a group.
// Body: { groupID, message }
// Auth: required — reqUserID comes from JWT
exports.submitRequest = async (req, res) => {
  const { groupID, message } = req.body;
  const reqUserID = req.user.userID;

  if (!groupID) {
    return res.status(400).json({ error: "groupID is required." });
  }

  try {
    // Confirm group exists and has space
    const [groups] = await db.query(
      "SELECT groupID, userCount, userMax, leaderID FROM groupsTbl WHERE groupID = ?",
      [groupID]
    );
    if (groups.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }
    const group = groups[0];

    if (group.userCount >= group.userMax) {
      return res.status(409).json({ error: "This group is already full." });
    }
    if (group.leaderID === reqUserID) {
      return res.status(400).json({ error: "You cannot request to join your own group." });
    }

    // Check for existing request (DB has UNIQUE constraint on reqUserID + groupID)
    const [existing] = await db.query(
      "SELECT reqID FROM requests WHERE reqUserID = ? AND groupID = ?",
      [reqUserID, groupID]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "You have already requested to join this group." });
    }

    await db.query(
      "INSERT INTO requests (reqStatus, message, reqUserID, groupID) VALUES ('pending', ?, ?, ?)",
      [message || null, reqUserID, groupID]
    );

    return res.status(201).json({ message: "Request submitted." });
  } catch (err) {
    console.error("submitRequest error:", err);
    return res.status(500).json({ error: "Failed to submit request." });
  }
};

// GET /api/requests/group/:groupID
// Get all pending requests for a group (leader only).
exports.getGroupRequests = async (req, res) => {
  const { groupID } = req.params;
  const requesterID = req.user.userID;

  try {
    // Verify requester is the leader
    const [groups] = await db.query(
      "SELECT leaderID FROM groupsTbl WHERE groupID = ?", [groupID]
    );
    if (groups.length === 0) return res.status(404).json({ error: "Group not found." });
    if (groups[0].leaderID !== requesterID) {
      return res.status(403).json({ error: "Only the group leader can view requests." });
    }

    const [requests] = await db.query(
      `SELECT r.reqID, r.reqStatus, r.message, r.reqUserID,
              p.fname, p.lname, p.score
       FROM   requests     r
       JOIN   userProfiles p ON p.userID = r.reqUserID
       WHERE  r.groupID   = ? AND r.reqStatus = 'pending'`,
      [groupID]
    );

    return res.json(requests);
  } catch (err) {
    console.error("getGroupRequests error:", err);
    return res.status(500).json({ error: "Failed to fetch requests." });
  }
};

// PATCH /api/requests/:reqID
// Approve or decline a request.
// Body: { status: 'accepted' | 'rejected' }
// Auth: only the group leader can act on it
exports.updateRequest = async (req, res) => {
  const { reqID }   = req.params;
  const { status }  = req.body;
  const requesterID = req.user.userID;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be 'accepted' or 'rejected'." });
  }

  const conn = await db.getConnection();
  try {
    // Fetch request + group in one query
    const [rows] = await conn.query(
      `SELECT r.reqID, r.reqUserID, r.reqStatus, r.groupID,
              g.leaderID, g.userCount, g.userMax
       FROM   requests  r
       JOIN   groupsTbl g ON g.groupID = r.groupID
       WHERE  r.reqID = ?`,
      [reqID]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Request not found." });
    const req_ = rows[0];

    if (req_.leaderID !== requesterID) {
      return res.status(403).json({ error: "Only the group leader can action this request." });
    }
    if (req_.reqStatus !== "pending") {
      return res.status(409).json({ error: "This request has already been actioned." });
    }
    if (status === "accepted" && req_.userCount >= req_.userMax) {
      return res.status(409).json({ error: "Group is already full." });
    }

    await conn.beginTransaction();

    // Update request status
    await conn.query(
      "UPDATE requests SET reqStatus = ? WHERE reqID = ?",
      [status, reqID]
    );

    if (status === "accepted") {
      // Add user to usersGroups
      await conn.query(
        "INSERT INTO usersGroups (userID, groupID) VALUES (?, ?)",
        [req_.reqUserID, req_.groupID]
      );
      // Increment userCount
      await conn.query(
        "UPDATE groupsTbl SET userCount = userCount + 1 WHERE groupID = ?",
        [req_.groupID]
      );
    }

    await conn.commit();
    return res.json({ message: `Request ${status}.` });
  } catch (err) {
    await conn.rollback();
    console.error("updateRequest error:", err);
    return res.status(500).json({ error: "Failed to update request." });
  } finally {
    conn.release();
  }
};