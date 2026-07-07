// middleware/auth.js
// This runs BEFORE protected routes to check if user is logged in
// It reads the JWT token from the request header and verifies it

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware: Check if user is logged in
const protect = async (req, res, next) => {
    try {
        // Get token from header: "Authorization: Bearer <token>"
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not logged in. Please login first." });
        }

        const token = authHeader.split(" ")[1]; // Extract the actual token

        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user from DB and attach to request
        req.user = await User.findById(decoded.id).select("-password"); // Don't send password

        if (!req.user) {
            return res.status(401).json({ message: "User not found." });
        }

        next(); // User is valid, continue to the route
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token. Please login again." });
    }
};

// Middleware: Check if user is admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next(); // Is admin, allow access
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};

module.exports = { protect, adminOnly };
