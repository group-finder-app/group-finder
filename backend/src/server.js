const express = require("express");
const cors    = require("cors");
const path    = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();

// middleware
app.use(cors());
app.use(express.json());


// __dirname is in group-finder/backend/src
// go up two levels to get to the group-finder root, then into frontend
const frontendPath = path.resolve(__dirname, "..", "..", "frontend");

// Log this so you can verify it in your terminal
console.log("-----------------------------------------");
console.log("Looking for frontend in:", frontendPath);
console.log("-----------------------------------------");

// serve static files from frontend folder
app.use(express.static(frontendPath));

// ROUTES
const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/userRoutes");
const groupRoutes   = require("./routes/groupRoutes");
const courseRoutes  = require("./routes/courseRoutes");
const requestRoutes = require("./routes/requestRoutes");

app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/groups",   groupRoutes);
app.use("/api/courses",  courseRoutes);
app.use("/api/requests", requestRoutes);

// serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});