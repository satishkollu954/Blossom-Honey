//sever/Middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../Model/User"); // Assuming you have a User model here

/**
 * @desc Protects routes, ensuring only authenticated users can proceed.
 * Checks for a JWT in cookies or the Authorization header.
 */
const protect = asyncHandler(async (req, res, next) => {
  console.log(req.cookies.token);
  let token;

  // 1. Check for token in cookies (preferred for MERN/HTTP-only setup)
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // 2. Fallback: Check for 'Bearer' token in Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    console.log(req.headers.authorization.split(" ")[1]);
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      // Decode the token (assuming JWT_SECRET is in your .env)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from the token payload and exclude the password
      req.user = await User.findById(decoded.userId).select("-password");
      console.log(req.user.role);
      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

/**
 * @desc Middleware to restrict access only to users with the 'admin' role.
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    console.log("===", req.user);
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error("Not authorized as an admin");
  }
};

/**
 * @desc Middleware to restrict access only to users with the 'seller' or 'admin' role.
 */
const seller = (req, res, next) => {
  if (req.user && (req.user.role === "seller" || req.user.role === "admin")) {
    console.log("===", req.user.role);
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error("Not authorized as a seller");
  }
};

module.exports = { protect, admin, seller };
