# 🍽️ Canteen Backend - Setup Guide
## Digital Canteen Order & Token Management System

---

## 📁 FOLDER STRUCTURE

```
canteen-backend/
├── server.js          ← Main file, run this to start
├── seed.js            ← Run once to add sample data
├── package.json       ← Project dependencies
├── .env.example       ← Copy this to .env and fill values
├── models/
│   ├── User.js        ← User/Admin schema
│   ├── Menu.js        ← Food items schema
│   ├── Order.js       ← Orders schema
│   └── Coupon.js      ← Coupon codes schema
├── routes/
│   ├── auth.js        ← Register, Login
│   ├── menu.js        ← View/manage menu
│   ├── orders.js      ← Place/view/manage orders
│   └── coupons.js     ← Apply/manage coupons
└── middleware/
    └── auth.js        ← Login protection
```

---

## 🛠️ STEP-BY-STEP SETUP

### STEP 1 — Install Node.js
- Go to https://nodejs.org → Download LTS version → Install it
- Open Command Prompt and type: `node --version`
- You should see something like: `v18.17.0`

---

### STEP 2 — Set Up MongoDB Atlas (Free Cloud Database)
1. Go to https://www.mongodb.com/atlas → Sign up (free)
2. Create a free cluster (M0 - free tier)
3. Click "Connect" → "Connect your application"
4. Copy the connection string — looks like:
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
5. Replace `<password>` with your actual password

---

### STEP 3 — Set Up the Project
Open Command Prompt in the `canteen-backend` folder, then run:

```bash
# Install all required packages
npm install

# Create your .env file (copy the example)
copy .env.example .env
```

Now open `.env` in Notepad and fill in:
```
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxx.mongodb.net/canteen_db
JWT_SECRET=any_long_random_string_here
PORT=5000
ADMIN_SECRET=admin123
```

---

### STEP 4 — Add Sample Data to Database
```bash
node seed.js
```
This creates:
- All 10 menu items (Tea, Coffee, Dosa, etc.)
- 3 sample coupons (WELCOME10, SAVE20, STUDENT5)
- Admin account: admin@canteen.com / admin123

---

### STEP 5 — Start the Server
```bash
node server.js
```
You should see:
```
✅ MongoDB Connected!
🚀 Server running at http://localhost:5000
```

---

## 🔗 ALL API ROUTES

### AUTH
| Method | URL | What it does |
|--------|-----|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get my info (login required) |

### MENU
| Method | URL | Who can use |
|--------|-----|------------|
| GET | /api/menu | Everyone - get available items |
| GET | /api/menu/all | Admin only - all items |
| POST | /api/menu | Admin only - add item |
| PUT | /api/menu/:id | Admin only - edit item |
| PATCH | /api/menu/:id/availability | Admin only - toggle available/unavailable |
| DELETE | /api/menu/:id | Admin only - delete item |

### ORDERS
| Method | URL | Who can use |
|--------|-----|------------|
| POST | /api/orders | User - place order |
| GET | /api/orders/mine | User - my orders |
| GET | /api/orders/:id | User - one order details |
| PATCH | /api/orders/:id/cancel | User - cancel order |
| GET | /api/orders/admin/all | Admin - all orders |
| PATCH | /api/orders/admin/:id/status | Admin - update status |
| GET | /api/orders/admin/revenue | Admin - total revenue |

### COUPONS
| Method | URL | Who can use |
|--------|-----|------------|
| POST | /api/coupons/validate | User - check if coupon valid |
| POST | /api/coupons | Admin - create coupon |
| GET | /api/coupons | Admin - all coupons |
| PATCH | /api/coupons/:id/toggle | Admin - activate/deactivate |
| DELETE | /api/coupons/:id | Admin - delete |

---

## 🧪 TEST WITH POSTMAN

Download Postman: https://www.postman.com/downloads/

### Test 1: Register
- Method: POST
- URL: http://localhost:5000/api/auth/register
- Body (JSON): `{ "name": "Ravi", "email": "ravi@test.com", "password": "test123" }`

### Test 2: Login
- Method: POST
- URL: http://localhost:5000/api/auth/login
- Body (JSON): `{ "email": "ravi@test.com", "password": "test123" }`
- Copy the `token` from the response!

### Test 3: Get Menu
- Method: GET
- URL: http://localhost:5000/api/menu
- No auth needed!

### Test 4: Place Order (need token from Test 2)
- Method: POST
- URL: http://localhost:5000/api/orders
- Headers: `Authorization: Bearer <paste token here>`
- Body (JSON):
```json
{
  "items": [{ "menuItemId": "<paste menu item _id>", "quantity": 1 }],
  "slot": "12:00 PM",
  "couponCode": "WELCOME10"
}
```

---

## 🔌 HOW FRONTEND CONNECTS TO BACKEND

In your frontend JavaScript, instead of using localStorage everywhere, call the API:

```javascript
// LOGIN
async function login() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
        localStorage.setItem("token", data.token);   // Save token
        localStorage.setItem("name", data.user.name);
        window.location.href = "menu.html";
    } else {
        alert(data.message);
    }
}

// GET MENU
async function loadMenu() {
    const response = await fetch("http://localhost:5000/api/menu");
    const items = await response.json();
    // Use items array to render cards
}

// PLACE ORDER (needs login token)
async function placeOrder(menuItemId, slot) {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token  // Send token in header
        },
        body: JSON.stringify({
            items: [{ menuItemId, quantity: 1 }],
            slot
        })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem("currentOrderId", data.order._id);
        window.location.href = "token.html";
    }
}
```

---

## 🚨 COMMON ERRORS & FIXES

| Error | Fix |
|-------|-----|
| `MongooseError: bad connection string` | Check MONGO_URI in .env |
| `Cannot find module 'express'` | Run `npm install` again |
| `401 Unauthorized` | Token missing or expired, login again |
| `403 Forbidden` | You're not an admin |
| `EADDRINUSE port 5000` | Another app using port 5000, change PORT in .env |
