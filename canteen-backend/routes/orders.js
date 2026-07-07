// routes/orders.js
// Users: Place orders, view their own orders, cancel orders
// Admin: View ALL orders, update order status

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const Coupon = require("../models/Coupon");
const { protect, adminOnly } = require("../middleware/auth");

// ─────────────────────────────────────────
// POST /api/orders
// User: Place a new order
// ─────────────────────────────────────────
router.post("/", protect, async (req, res) => {
    try {
        const { items, slot, couponCode } = req.body;
        // items = [ { menuItemId: "...", quantity: 2 }, ... ]

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Please select at least one item." });
        }

        if (!slot) {
            return res.status(400).json({ message: "Please select a pickup slot." });
        }

        // Build order items and calculate total
        let orderItems = [];
        let totalPrice = 0;

        for (let i of items) {
            const menuItem = await Menu.findById(i.menuItemId);

            if (!menuItem) {
                return res.status(404).json({ message: `Item not found.` });
            }
            if (!menuItem.isAvailable) {
                return res.status(400).json({ message: `Sorry, ${menuItem.name} is not available today.` });
            }

            const qty = i.quantity || 1;
            totalPrice += menuItem.price * qty;

            orderItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: qty
            });
        }

        // Apply coupon if provided
        let discountAmount = 0;
        let couponUsed = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

            if (!coupon) {
                return res.status(400).json({ message: "Invalid coupon code." });
            }
            if (!coupon.isActive) {
                return res.status(400).json({ message: "This coupon is no longer active." });
            }
            if (new Date() > coupon.expiresAt) {
                return res.status(400).json({ message: "This coupon has expired." });
            }
            if (coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({ message: "Coupon usage limit reached." });
            }

            // Calculate discount
            discountAmount = Math.round((totalPrice * coupon.discountPercent) / 100);
            couponUsed = coupon.code;

            // Increment used count
            coupon.usedCount += 1;
            await coupon.save();
        }

        const finalPrice = totalPrice - discountAmount;

        // Create the order
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            slot,
            totalPrice,
            discountAmount,
            finalPrice,
            couponUsed
        });

        res.status(201).json({
            message: "Order placed successfully!",
            order,
            token: order.token,
            waitTime: order.waitTime
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/orders/mine
// User: Get their own order history
// ─────────────────────────────────────────
router.get("/mine", protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 }); // Latest first

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/orders/:id
// User: Get a single order by ID (to show token page)
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: "Order not found." });

        // Users can only see their own orders
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized." });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// PATCH /api/orders/:id/cancel
// User: Cancel their own order (only if still Preparing)
// ─────────────────────────────────────────
router.patch("/:id/cancel", protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: "Order not found." });

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not your order." });
        }

        if (order.status !== "Preparing") {
            return res.status(400).json({ message: "Cannot cancel. Order is already being prepared." });
        }

        order.status = "Cancelled";
        await order.save();

        res.json({ message: "Order cancelled.", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/orders/admin/all
// Admin: Get ALL orders (for the admin panel)
// ─────────────────────────────────────────
router.get("/admin/all", protect, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")  // Show user name/email with each order
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// PATCH /api/orders/admin/:id/status
// Admin: Update order status (Preparing → Almost Ready → Ready)
// ─────────────────────────────────────────
router.patch("/admin/:id/status", protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Preparing", "Almost Ready", "Ready", "Cancelled"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: "Order not found." });

        res.json({ message: `Order marked as ${status}`, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/orders/admin/revenue
// Admin: Total revenue and order stats
// ─────────────────────────────────────────
router.get("/admin/revenue", protect, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: "Cancelled" } });

        const totalRevenue = orders.reduce((sum, o) => sum + o.finalPrice, 0);
        const totalOrders = orders.length;

        res.json({ totalRevenue, totalOrders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
