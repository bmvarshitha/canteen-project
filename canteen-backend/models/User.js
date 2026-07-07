// models/User.js
// This defines how a "User" is stored in MongoDB

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,   // No two users can have same email
        lowercase: true
    },
    password: {
        type: String,
        required: true  // Will be stored as encrypted hash
    },
    role: {
        type: String,
        enum: ["user", "admin"],  // Only these two roles allowed
        default: "user"
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model("User", userSchema);
