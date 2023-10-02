const jwt = require("jsonwebtoken");
const JWT_SECRET = "rahasiadeh";

//bikin token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

//authentifikasi
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
