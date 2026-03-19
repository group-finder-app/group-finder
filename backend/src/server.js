const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// routes
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

// check
app.get("/", (req, res) => res.send("Grouper API is running..."));

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));