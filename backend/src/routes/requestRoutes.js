const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/authMiddleware");
const {
  submitRequest,
  getGroupRequests,
  updateRequest,
} = require("../controllers/requestController");

router.post("/",                    auth, submitRequest);     // POST  /api/requests
router.get("/group/:groupID",       auth, getGroupRequests);  // GET   /api/requests/group/:groupID
router.patch("/:reqID",             auth, updateRequest);     // PATCH /api/requests/:reqID

module.exports = router;