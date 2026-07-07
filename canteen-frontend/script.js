const API = "http://localhost:5000/api";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function getToken() { return localStorage.getItem("authToken"); }
function getUser()  { return JSON.parse(localStorage.getItem("user") || "null"); }

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

function showNotification(msg, color = "#28a745") {
    let box = document.createElement("div");
    box.innerText = msg;
    box.className = "notify";
    box.style.background = color;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
}

// ─────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────
async function login() {
    const nameEl  = document.getElementById("name");
    const phoneEl = document.getElementById("phone");
    const emailEl = document.getElementById("email");
    const passEl  = document.getElementById("password");
    const isAdmin = document.getElementById("adminTab").classList.contains("active");

    if (isAdmin) {
        // Admin login
        const email    = emailEl.value.trim();
        const password = passEl.value.trim();
        if (!email || !password) { alert("Enter email and password"); return; }

        try {
            const res  = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message); return; }
            if (data.user.role !== "admin") { alert("Not an admin account!"); return; }

            localStorage.setItem("authToken", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "admin.html";

        } catch (e) { alert("Server not running! Start backend first."); }

    } else {
        // User login — name + phone
        const name  = nameEl.value.trim();
        const phone = phoneEl.value.trim();
        if (!name || !phone) { alert("Enter name and phone number"); return; }
        if (phone.length !== 10) { alert("Enter valid 10-digit phone number"); return; }

        // Use phone as email internally: phone@canteen.com
        const fakeEmail = phone + "@canteen.com";
        const password  = phone; // password = phone number

        // Try login first, if not found then register
        try {
            let res = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: fakeEmail, password })
            });
            let data = await res.json();

            if (!res.ok) {
                // User not found, register them
                res = await fetch(`${API}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email: fakeEmail, password, phone })
                });
                data = await res.json();
                if (!res.ok) { alert(data.message); return; }
            }

            localStorage.setItem("authToken", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "menu.html";

        } catch (e) { alert("Server not running! Start backend first."); }
    }
}

// Tab switching on login page
function switchTab(tab) {
    document.getElementById("userTab").classList.toggle("active", tab === "user");
    document.getElementById("adminTab").classList.toggle("active", tab === "admin");
    document.getElementById("userFields").style.display  = tab === "user"  ? "block" : "none";
    document.getElementById("adminFields").style.display = tab === "admin" ? "block" : "none";
}

// ─────────────────────────────────────────
// MENU PAGE
// ─────────────────────────────────────────
let menuData = []; // Store fetched menu globally for search

async function loadMenu() {
    if (!document.getElementById("menuList")) return;

    const user = getUser();
    if (!user) { window.location.href = "index.html"; return; }
    const nameEl = document.getElementById("userName");
    if (nameEl) nameEl.innerText = "Hi, " + user.name + "! 👋";

    try {
        const res   = await fetch(`${API}/menu`);
        menuData    = await res.json();
        renderMenu(menuData);
    } catch (e) {
        document.getElementById("menuList").innerHTML = "<p style='color:white'>Could not load menu. Is backend running?</p>";
    }
}

function renderMenu(items) {
    const list = document.getElementById("menuList");
    if (items.length === 0) {
        list.innerHTML = "<p style='color:white;text-align:center'>No items found!</p>";
        return;
    }
    list.innerHTML = items.map(item => `
        <div class="card">
            <img src="${item.img}" onerror="this.src='images/default.png'">
            <h3>${item.name}</h3>
            <p class="price">₹${item.price}</p>
            <p class="cat">${item.category}</p>
            <button onclick="orderItem('${item._id}', '${item.name}', ${item.price})">Order</button>
        </div>
    `).join("");
}

function searchFood() {
    const input    = document.getElementById("search").value.toLowerCase();
    const filtered = menuData.filter(i => i.name.toLowerCase().includes(input));
    renderMenu(filtered);
}

function orderItem(id, name, price) {
    const slot = document.getElementById("slot").value;
    if (!slot) { alert("Please select a time slot!"); return; }

    localStorage.setItem("orderItemId",   id);
    localStorage.setItem("orderItemName", name);
    localStorage.setItem("orderPrice",    price);
    localStorage.setItem("orderSlot",     slot);

    window.location.href = "payment.html";
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// ─────────────────────────────────────────
// PAYMENT PAGE
// ─────────────────────────────────────────
let discountAmount = 0;
let couponApplied  = "";

function loadPayment() {
    if (!document.getElementById("payItem")) return;

    const name  = localStorage.getItem("orderItemName");
    const price = localStorage.getItem("orderPrice");

    document.getElementById("payItem").innerText  = "Item: " + name;
    document.getElementById("payPrice").innerText = "Price: ₹" + price;
    document.getElementById("finalAmt").innerText = "Total: ₹" + price;
}

async function applyCoupon() {
    const code       = document.getElementById("couponInput").value.trim();
    const totalPrice = parseInt(localStorage.getItem("orderPrice"));

    if (!code) { alert("Enter a coupon code!"); return; }

    try {
        const res  = await fetch(`${API}/coupons/validate`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ code, totalPrice })
        });
        const data = await res.json();

        if (!res.ok) { alert(data.message); return; }

        discountAmount = data.discountAmount;
        couponApplied  = code;

        document.getElementById("couponMsg").innerText  = data.message;
        document.getElementById("couponMsg").style.color = "green";
        document.getElementById("finalAmt").innerText   = "Total: ₹" + data.finalPrice;

    } catch (e) { alert("Error applying coupon"); }
}

async function pay() {
    const menuItemId = localStorage.getItem("orderItemId");
    const slot       = localStorage.getItem("orderSlot");

    if (!menuItemId || !slot) { alert("Something went wrong. Go back to menu."); return; }

    try {
        const body = {
            items: [{ menuItemId, quantity: 1 }],
            slot,
        };
        if (couponApplied) body.couponCode = couponApplied;

        const res  = await fetch(`${API}/orders`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (!res.ok) { alert(data.message); return; }

        localStorage.setItem("currentOrderId", data.order._id);
        window.location.href = "token.html";

    } catch (e) { alert("Error placing order. Is backend running?"); }
}

// ─────────────────────────────────────────
// TOKEN PAGE
// ─────────────────────────────────────────
async function loadToken() {
    if (!document.getElementById("tokenNum")) return;

    const orderId = localStorage.getItem("currentOrderId");
    if (!orderId) { window.location.href = "menu.html"; return; }

    try {
        const res   = await fetch(`${API}/orders/${orderId}`, { headers: authHeaders() });
        const order = await res.json();

        document.getElementById("tokenNum").innerText  = order.token;
        document.getElementById("tokItem").innerText   = "🍽️ " + order.items.map(i => i.name).join(", ");
        document.getElementById("tokPrice").innerText  = "💰 ₹" + order.finalPrice;
        document.getElementById("tokSlot").innerText   = "🕐 Slot: " + order.slot;
        document.getElementById("tokWait").innerText   = "⏱️ Ready in: " + order.waitTime + " mins";
        document.getElementById("tokStatus").innerText = "📊 Status: " + order.status;

        // Auto update status after few seconds (simulate)
        setTimeout(() => {
            document.getElementById("tokStatus").innerText = "📊 Status: Almost Ready";
        }, 5000);
        setTimeout(() => {
            document.getElementById("tokStatus").innerText = "📊 Status: Ready ✅";
            showNotification("🔔 Your order is ready! Token: " + order.token);
        }, 10000);

    } catch (e) {
        document.getElementById("tokenNum").innerText = "Error loading order";
    }
}

async function cancelOrder() {
    const orderId = localStorage.getItem("currentOrderId");
    if (!orderId) return;

    if (!confirm("Are you sure you want to cancel?")) return;

    try {
        const res  = await fetch(`${API}/orders/${orderId}/cancel`, {
            method: "PATCH",
            headers: authHeaders()
        });
        const data = await res.json();

        if (!res.ok) { alert(data.message); return; }

        alert("Order cancelled!");
        window.location.href = "menu.html";

    } catch (e) { alert("Error cancelling order"); }
}

// ─────────────────────────────────────────
// HISTORY PAGE
// ─────────────────────────────────────────
async function loadHistory() {
    if (!document.getElementById("historyList")) return;

    try {
        const res    = await fetch(`${API}/orders/mine`, { headers: authHeaders() });
        const orders = await res.json();

        if (orders.length === 0) {
            document.getElementById("historyList").innerHTML = "<p>No orders yet!</p>";
            return;
        }

        document.getElementById("historyList").innerHTML = orders.map(o => `
            <div class="history-card">
                <p>🍽️ ${o.items.map(i => i.name).join(", ")}</p>
                <p>💰 ₹${o.finalPrice} ${o.couponUsed ? '<span class="badge">🎟️ ' + o.couponUsed + '</span>' : ''}</p>
                <p>🎟️ Token: <strong>${o.token}</strong></p>
                <p>🕐 Slot: ${o.slot}</p>
                <p class="status-${o.status.replace(' ','')}">📊 ${o.status}</p>
            </div>
            <hr>
        `).join("");

    } catch (e) {
        document.getElementById("historyList").innerHTML = "<p>Error loading history</p>";
    }
}

// ─────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────
async function loadAdmin() {
    if (!document.getElementById("adminOrders")) return;

    const user = getUser();
    if (!user || user.role !== "admin") {
        alert("Admin access only!");
        window.location.href = "index.html";
        return;
    }

    await loadAdminOrders();
    await loadAdminMenu();
    await loadAdminCoupons();
    await loadRevenue();
}

async function loadRevenue() {
    try {
        const res  = await fetch(`${API}/orders/admin/revenue`, { headers: authHeaders() });
        const data = await res.json();
        document.getElementById("revenue").innerText =
            `💰 Total Revenue: ₹${data.totalRevenue} | 📦 Total Orders: ${data.totalOrders}`;
    } catch (e) {}
}

async function loadAdminOrders() {
    try {
        const res    = await fetch(`${API}/orders/admin/all`, { headers: authHeaders() });
        const orders = await res.json();

        document.getElementById("adminOrders").innerHTML = orders.length === 0
            ? "<p>No orders yet!</p>"
            : orders.map(o => `
            <div class="admin-card">
                <strong>${o.user ? o.user.name : "User"}</strong> ordered
                <strong>${o.items.map(i => i.name).join(", ")}</strong><br>
                🎟️ Token: <strong>${o.token}</strong> | 🕐 ${o.slot} | 💰 ₹${o.finalPrice}<br>
                <span class="status-badge">${o.status}</span>
                <div class="btn-row">
                    <button onclick="updateStatus('${o._id}', 'Preparing')">Preparing</button>
                    <button onclick="updateStatus('${o._id}', 'Almost Ready')">Almost Ready</button>
                    <button class="btn-green" onclick="updateStatus('${o._id}', 'Ready')">✅ Ready</button>
                    <button class="btn-red" onclick="updateStatus('${o._id}', 'Cancelled')">❌ Cancel</button>
                </div>
            </div>
        `).join("");
    } catch (e) {
        document.getElementById("adminOrders").innerHTML = "<p>Error loading orders</p>";
    }
}

async function updateStatus(orderId, status) {
    try {
        const res = await fetch(`${API}/orders/admin/${orderId}/status`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showNotification("Order marked as " + status);
            await loadAdminOrders();
            await loadRevenue();
        }
    } catch (e) { alert("Error updating status"); }
}

async function loadAdminMenu() {
    try {
        const res   = await fetch(`${API}/menu/all`, { headers: authHeaders() });
        const items = await res.json();

        document.getElementById("adminMenu").innerHTML = items.map(item => `
            <div class="admin-card ${item.isAvailable ? '' : 'unavailable'}">
                <strong>${item.name}</strong> — ₹${item.price} (${item.category})
                <span class="avail-badge">${item.isAvailable ? "✅ Available" : "❌ Unavailable"}</span>
                <div class="btn-row">
                    <button onclick="toggleAvailability('${item._id}')">
                        ${item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                    </button>
                </div>
            </div>
        `).join("");
    } catch (e) {}
}

async function toggleAvailability(itemId) {
    try {
        const res = await fetch(`${API}/menu/${itemId}/availability`, {
            method: "PATCH",
            headers: authHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            showNotification(data.message);
            await loadAdminMenu();
        }
    } catch (e) { alert("Error updating item"); }
}

async function loadAdminCoupons() {
    try {
        const res     = await fetch(`${API}/coupons`, { headers: authHeaders() });
        const coupons = await res.json();

        document.getElementById("adminCoupons").innerHTML = coupons.map(c => `
            <div class="admin-card ${c.isActive ? '' : 'unavailable'}">
                <strong>${c.code}</strong> — ${c.discountPercent}% off
                | Used: ${c.usedCount}/${c.usageLimit}
                | ${c.isActive ? "✅ Active" : "❌ Inactive"}
                <div class="btn-row">
                    <button onclick="toggleCoupon('${c._id}')">${c.isActive ? "Deactivate" : "Activate"}</button>
                    <button class="btn-red" onclick="deleteCoupon('${c._id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join("");
    } catch (e) {}
}

async function addCoupon() {
    const code     = document.getElementById("newCode").value.trim().toUpperCase();
    const discount = document.getElementById("newDiscount").value.trim();
    const limit    = document.getElementById("newLimit").value.trim() || 100;

    if (!code || !discount) { alert("Enter coupon code and discount!"); return; }

    try {
        const res  = await fetch(`${API}/coupons`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ code, discountPercent: parseInt(discount), usageLimit: parseInt(limit) })
        });
        const data = await res.json();
        if (!res.ok) { alert(data.message); return; }

        showNotification("Coupon " + code + " created!");
        document.getElementById("newCode").value = "";
        document.getElementById("newDiscount").value = "";
        await loadAdminCoupons();
    } catch (e) { alert("Error creating coupon"); }
}

async function toggleCoupon(id) {
    try {
        await fetch(`${API}/coupons/${id}/toggle`, { method: "PATCH", headers: authHeaders() });
        await loadAdminCoupons();
    } catch (e) {}
}

async function deleteCoupon(id) {
    if (!confirm("Delete this coupon?")) return;
    try {
        await fetch(`${API}/coupons/${id}`, { method: "DELETE", headers: authHeaders() });
        showNotification("Coupon deleted", "#dc3545");
        await loadAdminCoupons();
    } catch (e) {}
}

// ─────────────────────────────────────────
// PAGE INIT — runs on every page load
// ─────────────────────────────────────────
window.onload = function () {
    loadMenu();
    loadPayment();
    loadToken();
    loadHistory();
    loadAdmin();
};
