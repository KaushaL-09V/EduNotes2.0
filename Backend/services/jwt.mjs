// src/services/jwt.mjs
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-bkg1zK9qmjvoS70gAru5UFQrDIawJ7KRbqXheA3FYXUVdpPl44jnhOh7bfySHmDJ-key-change-in-production";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
  console.log("🔑 Generating token for user ID:", userId);
  
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  
  console.log("✅ Token generated successfully");
  return token;
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("✅ Token verified for user ID:", decoded.id);
    return decoded;
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    throw new Error("Invalid or expired token");
  }
};

/**
 * Decode token without verification (useful for debugging)
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
};