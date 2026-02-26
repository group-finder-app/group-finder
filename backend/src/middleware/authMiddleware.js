const jwt = require("jsonwebtoken");

// will eventually protect routes by verifying JWT tokens
module.exports = (req, res, next) => {
  //for now, just logging that its reached
  console.log("Auth Middleware triggered: Request passed through.");
  
  next();
};