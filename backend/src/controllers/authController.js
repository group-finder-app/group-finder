const db = require("../config/db");

// stubs, need db 
exports.register = async (req, res) => {
  res.json({ message: "Registration endpoint - Database pending" });
};

exports.login = async (req, res) => {
  res.json({ message: "Login endpoint - Database pending" });
};