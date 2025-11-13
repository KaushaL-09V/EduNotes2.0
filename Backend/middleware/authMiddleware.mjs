// src/middleware/authMiddleware.mjs
import { verifyToken } from "../services/jwt.mjs";
import User from "../models/userModel.mjs";

/**
 * Protect routes - require authentication
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      console.log("🔐 Token received:", token ? "Yes" : "No");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, no token provided",
        });
      }

      // Verify token
      const decoded = verifyToken(token);
      console.log("✅ Token decoded, user ID:", decoded.id);

      // Get user from token (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      console.log("👤 User authenticated:", req.user.email);
      next();
    } catch (error) {
      console.error("❌ Token verification failed:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token",
      });
    }
  } else {
    console.warn("⚠️ No authorization header found");
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

/**
 * Optional authentication - continue even if no token
 */
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.warn("Optional auth failed, continuing without user:", error.message);
      req.user = null;
    }
  }

  next();
};

/**
 * Authorize specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

export default { protect, optionalAuth, authorize };