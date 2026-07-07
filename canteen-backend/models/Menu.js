// models/Menu.js
// This defines how a Menu Item is stored in MongoDB
// Admin can add/edit/delete items and mark them unavailable

const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    img: {
        type: String,
        default: "images/default.png"
    },
    category: {
        type: String,
        enum: ["Breakfast", "Lunch", "Drinks", "Snacks", "Dinner"],
        default: "Snacks"
    },
    isAvailable: {
        type: Boolean,
        default: true   // Admin sets this to false when item runs out (e.g., no dosa today)
    },
    description: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Menu", menuSchema);
