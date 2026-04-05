const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/authMiddleware");
const {
  getAllGroups,
  getGroupByID,
  createGroup,
  updateGroup,
  deleteGroup,
  removeMember,
} = require("../controllers/groupController");

router.get("/",    auth, getAllGroups);    // GET  /api/groups?courseCode=CP476
router.get("/:id", auth, getGroupByID);   // GET  /api/groups/:id
router.post("/",   auth, createGroup);    // POST /api/groups
router.patch("/:id", auth, updateGroup);  // PATCH /api/groups/:id
router.delete("/:id", auth, deleteGroup); // DELETE /api/groups/:id
router.delete("/:id/members/:memberID", auth, removeMember); // DELETE /api/groups/:id/members/:memberID

module.exports = router;