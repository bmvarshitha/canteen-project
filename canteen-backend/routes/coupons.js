// routes/coupons.js
// Admin: Create and manage coupons
// Users: Validate a coupon code before ordering

const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const { protect, adminOnly } = require("../middleware/auth");

// ─────────────────────────────────────────
// POST /api/coupons/validate
// User: Check if a coupon code is valid before placing order
// ─────────────────────────────────────────
router.post("/validate", protect, async (req, res) => {
    try {
        const { code, totalPrice } = req.body;

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon || !coupon.isActive) {
            return res.status(400).json({ message: "Invalid or inactive coupon." });
        }

        if (new Date() > coupon.expiresAt) {
            return res.status(400).json({ message: "Coupon has expired." });
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "Coupon limit reached." });
        }

        const discountAmount = Math.round((totalPrice * coupon.discountPercent) / 100);
        const finalPrice = totalPrice - discountAmount;

        res.json({
            valid: true,
            message: `Coupon applied! You save ₹${discountAmount}`,
            discountPercent: coupon.discountPercent,
            discountAmount,
            finalPrice
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// POST /api/coupons
// Admin: Create a new coupon
// ─────────────────────────────────────────
router.post("/", protect, adminOnly, async (req, res) => {
    try {
        const { code, discountPercent, usageLimit, expiresAt } = req.body;

        if (!code || !discountPercent) {
            return res.status(400).json({ message: "Code and discount percent are required." });
        }

        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: "Coupon code already exists." });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountPercent,
            usageLimit: usageLimit || 100,
            expiresAt: expiresAt || undefined
        });

        res.status(201).json({ message: "Coupon created!", coupon });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/coupons
// Admin: Get all coupons
// ─────────────────────────────────────────
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// PATCH /api/coupons/:id/toggle
// Admin: Activate or deactivate a coupon
// ─────────────────────────────────────────
router.patch("/:id/toggle", protect, adminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: "Coupon not found." });

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({
            message: `Coupon ${coupon.code} is now ${coupon.isActive ? "ACTIVE" : "INACTIVE"}`,
            coupon
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// DELETE /api/coupons/:id
// Admin: Delete a coupon
// ─────────────────────────────────────────
router.delete("/:id", protect, adminOnly, async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: "Coupon deleted." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
