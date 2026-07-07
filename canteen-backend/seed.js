// seed.js
// Run this ONCE to add default menu items and a test admin to the database
// Command: node seed.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Menu = require("./models/Menu");
const User = require("./models/User");
const Coupon = require("./models/Coupon");

const menuItems = [
    { name: "Tea",         price: 10,  category: "Drinks",    img: "images/tea.png",        description: "Hot masala tea" },
    { name: "Coffee",      price: 20,  category: "Drinks",    img: "images/coffee.png",     description: "Filter coffee" },
    { name: "Masala Dosa", price: 50,  category: "Breakfast", img: "images/masaladosa.jpg", description: "Crispy dosa with chutney" },
    { name: "Idli Vada",   price: 40,  category: "Breakfast", img: "images/idli.webp",      description: "Soft idli with vada" },
    { name: "Poori",       price: 45,  category: "Breakfast", img: "images/poori.png",      description: "Poori with potato curry" },
    { name: "Chapathi",    price: 30,  category: "Breakfast", img: "images/chapathi.avif",  description: "2 chapathis with curry" },
    { name: "Meals",       price: 80,  category: "Lunch",     img: "images/vegmeals.png",   description: "Full veg meals" },
    { name: "Biriyani",    price: 120, category: "Lunch",     img: "images/biriyani.avif",  description: "Veg biriyani" },
    { name: "Pav Bhaji",   price: 60,  category: "Snacks",    img: "images/pavbhaji.webp",  description: "Pav bhaji with butter" },
    { name: "Juice",       price: 40,  category: "Drinks",    img: "images/juice.jpg",      description: "Fresh fruit juice" }
];

const coupons = [
    { code: "WELCOME10", discountPercent: 10, usageLimit: 200 },
    { code: "SAVE20",    discountPercent: 20, usageLimit: 50 },
    { code: "STUDENT5",  discountPercent: 5,  usageLimit: 500 }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Clear old data
        await Menu.deleteMany();
        await Coupon.deleteMany();
        console.log("Old data cleared.");

        // Insert menu items
        await Menu.insertMany(menuItems);
        console.log("✅ Menu items added!");

        // Insert coupons
        await Coupon.insertMany(coupons);
        console.log("✅ Coupons added!");

        // Create a test admin (if doesn't exist)
        const adminExists = await User.findOne({ email: "admin@canteen.com" });
        if (!adminExists) {
            await User.create({
                name: "Admin",
                email: "admin@canteen.com",
                password: await bcrypt.hash("admin123", 10),
                role: "admin"
            });
            console.log("✅ Admin created! Email: admin@canteen.com | Password: admin123");
        }

        console.log("\n🎉 Database seeded successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Seed error:", err.message);
        process.exit(1);
    }
}

seed();
