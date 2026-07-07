// routes/auth.js
// Handles: Register new user, Login, Get profile

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Helper: Create a JWT token for a user
function createToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" } // Token expires in 7 days
    );
}

// ─────────────────────────────────────────
// POST /api/auth/register
// Create a new user account
// ─────────────────────────────────────────
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, adminSecret } = req.body;

        // Check all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields." });
        }

        // Check if email already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already registered." });
        }

        // Encrypt the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if this person should be admin (they need the secret code)
        const role = adminSecret === process.env.ADMIN_SECRET ? "admin" : "user";

        // Create user in database
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        // Send back token so they're auto-logged in
        res.status(201).json({
            message: "Account created successfully!",
            token: createToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// ─────────────────────────────────────────
// POST /api/auth/login
// Login with email + password
// ─────────────────────────────────────────
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please enter email and password." });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Compare password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        res.json({
            message: "Login successful!",
            token: createToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/auth/profile
// Get logged-in user's details (requires login)
// ─────────────────────────────────────────
router.get("/profile", protect, async (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
