// routes/menu.js
// Users can VIEW menu. Admins can ADD, EDIT, DELETE items and toggle availability.

const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");
const { protect, adminOnly } = require("../middleware/auth");

// ─────────────────────────────────────────
// GET /api/menu
// Get all AVAILABLE menu items (what users see)
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        // Only show available items to regular users
        const items = await Menu.find({ isAvailable: true });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/menu/all
// Admin: Get ALL items including unavailable ones
// ─────────────────────────────────────────
router.get("/all", protect, adminOnly, async (req, res) => {
    try {
        const items = await Menu.find(); // No filter - get everything
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// POST /api/menu
// Admin: Add a new menu item
// ─────────────────────────────────────────
router.post("/", protect, adminOnly, async (req, res) => {
    try {
        const { name, price, img, category, description } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: "Name and price are required." });
        }

        const item = await Menu.create({ name, price, img, category, description });
        res.status(201).json({ message: "Menu item added!", item });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// PUT /api/menu/:id
// Admin: Update a menu item (name, price, etc.)
// ─────────────────────────────────────────
router.put("/:id", protect, adminOnly, async (req, res) => {
    try {
        const updated = await Menu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Return the updated document
        );

        if (!updated) return res.status(404).json({ message: "Item not found." });

        res.json({ message: "Item updated!", item: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// PATCH /api/menu/:id/availability
// Admin: Toggle item available/unavailable
// e.g., "No Dosa today" → set isAvailable: false
// ─────────────────────────────────────────
router.patch("/:id/availability", protect, adminOnly, async (req, res) => {
    try {
        const item = await Menu.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found." });

        item.isAvailable = !item.isAvailable; // Toggle true/false
        await item.save();

        res.json({
            message: `${item.name} is now ${item.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}`,
            item
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// DELETE /api/menu/:id
// Admin: Remove a menu item permanently
// ─────────────────────────────────────────
router.delete("/:id", protect, adminOnly, async (req, res) => {
    try {
        const deleted = await Menu.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Item not found." });

        res.json({ message: "Item deleted." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
