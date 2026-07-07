// models/Coupon.js
// Admin creates coupons. Users apply them at checkout for discount.

const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true   // e.g., "SAVE20", "WELCOME10"
    },
    discountPercent: {
        type: Number,
        required: true,
        min: 1,
        max: 100          // e.g., 20 means 20% off
    },
    isActive: {
        type: Boolean,
        default: true     // Admin can deactivate a coupon anytime
    },
    usageLimit: {
        type: Number,
        default: 100      // Max times this coupon can be used
    },
    usedCount: {
        type: Number,
        default: 0        // How many times it's been used so far
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
