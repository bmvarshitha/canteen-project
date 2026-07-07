// server.js
// THE MAIN FILE - This starts everything!
// Run this with: node server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load .env variables

const app = express();

// ─────────────────────────────────────────
// MIDDLEWARE
// These run on every request
// ─────────────────────────────────────────
app.use(cors()); // Allow frontend to talk to backend (different ports)
app.use(express.json()); // Parse JSON request bodies

// ─────────────────────────────────────────
// ROUTES
// Link each route file to a URL prefix
// ─────────────────────────────────────────
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/menu",    require("./routes/menu"));
app.use("/api/orders",  require("./routes/orders"));
app.use("/api/coupons", require("./routes/coupons"));

// ─────────────────────────────────────────
// HOME ROUTE - just to check if server is running
// ─────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({
        message: "🍽️ Canteen Backend is running!",
        routes: {
            auth:    "/api/auth",
            menu:    "/api/menu",
            orders:  "/api/orders",
            coupons: "/api/coupons"
        }
    });
});

// ─────────────────────────────────────────
// CONNECT TO MONGODB, THEN START SERVER
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected!");
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1); // Stop if DB can't connect
    });
