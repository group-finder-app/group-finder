const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getMyProfile,
  getUserByID,
  getMyGroups,
  vouchUser,
  updateProfile,
} = require("../controllers/userController");

router.get("/me", auth, getMyProfile);          // GET /api/users/me
router.get("/:id", auth, getUserByID);          // GET /api/users/:id
router.get("/me/groups", auth, getMyGroups);    // GET /api/users/me/groups
router.post("/:id/vouch", auth, vouchUser);     // POST /api/users/:id/vouch
router.patch("/me/profile", auth, updateProfile); // PATCH /api/users/me/profile

module.exports = router;