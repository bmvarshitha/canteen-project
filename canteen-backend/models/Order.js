// models/Order.js
// Every order placed by any user is stored here
// This is the MAIN model - connects users, menu items, coupons

const mongoose = require("mongoose");

// Auto-generate a token number (like a queue number)
function generateToken() {
    return Math.floor(100 + Math.random() * 900); // 3-digit number like 247
}

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",        // Links to User model
        required: true
    },
    items: [
        {
            menuItem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Menu"   // Links to Menu model
            },
            name: String,     // Store name separately in case menu changes
            price: Number,
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],
    slot: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    finalPrice: {
        type: Number,
        required: true
    },
    couponUsed: {
        type: String,
        default: null
    },
    token: {
        type: Number,
        default: generateToken
    },
    status: {
        type: String,
        enum: ["Preparing", "Almost Ready", "Ready", "Cancelled"],
        default: "Preparing"
    },
    waitTime: {
        type: Number,
        default: () => Math.floor(Math.random() * 10) + 5  // 5-15 mins
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
