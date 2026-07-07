console.log("JS loaded");

// MENU DATA
const menu = [
    { name: "Tea", price: 10, img: "images/tea.png" },
    { name: "Coffee", price: 20, img: "images/coffee.png" },
    { name: "Masala Dosa", price: 50, img: "images/masaladosa.jpg" },
    { name: "Idli Vada", price: 40, img: "images/idli.webp" },
    { name: "Poori", price: 45, img: "images/poori.png" },
    { name: "Chapathi", price: 30, img: "images/chapathi.avif" },
    { name: "Meals", price: 80, img: "images/vegmeals.png" },
    { name: "Biriyani", price: 120, img: "images/biriyani.avif" },
    { name: "Pav Bhaji", price: 60, img: "images/pavbhaji.webp" },
    { name: "Juice", price: 40, img: "images/juice.jpg" }
];

// LOGIN
function login() {
    let name = document.getElementById("name").value;

    if (!name) {
        alert("Enter your name");
        return;
    }

    localStorage.setItem("name", name);
    window.location.href = "menu.html";
}

// SHOW MENU
if (document.getElementById("menuList")) {
    let output = "";

    menu.forEach(item => {
        output += `
        <div class="card">
            <img src="${item.img}">
            <h3>${item.name}</h3>
            <p>₹${item.price}</p>
            <button onclick="orderItem('${item.name}', ${item.price})">Order</button>
        </div>
        `;
    });

    document.getElementById("menuList").innerHTML = output;
}

// ORDER
function orderItem(item, price) {
    let slot = document.getElementById("slot").value;

    localStorage.setItem("item", item);
    localStorage.setItem("price", price);
    localStorage.setItem("slot", slot);

    window.location.href = "payment.html";
}

// PAYMENT
function pay() {
    let token = Math.floor(Math.random() * 1000);
    let wait = Math.floor(Math.random() * 10) + 5;

    let newOrder = {
        name: localStorage.getItem("name"),
        item: localStorage.getItem("item"),
        price: localStorage.getItem("price"),
        slot: localStorage.getItem("slot"),
        token: token,
        wait: wait,
        status: "Preparing"
    };

    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(newOrder);

    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("currentToken", token);

    window.location.href = "token.html";
}

// TOKEN PAGE
if (document.getElementById("token")) {

    let token = localStorage.getItem("currentToken");
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    let current = orders.find(o => o.token == token);

    if (current) {
        document.getElementById("name").innerText = "Name: " + current.name;
        document.getElementById("item").innerText = "Item: " + current.item;
        document.getElementById("price").innerText = "Price: ₹" + current.price;
        document.getElementById("token").innerText = "Token: " + current.token;
        document.getElementById("slot").innerText = "Slot: " + current.slot;
        document.getElementById("wait").innerText = "Ready in: " + current.wait + " mins";
        document.getElementById("status").innerText = "Status: " + current.status;
        setTimeout(() => {
    current.status = "Almost Ready";
    document.getElementById("status").innerText = "Status: Almost Ready";

    localStorage.setItem("orders", JSON.stringify(orders));
}, 5000);

setTimeout(() => {
    current.status = "Ready";
    document.getElementById("status").innerText = "Status: Ready";

    localStorage.setItem("orders", JSON.stringify(orders));

    showNotification("🔔 Your order is ready!");
}, 10000);
        let progress = Math.floor(Math.random() * 100);
        document.getElementById("progress").innerText =
             "Preparation: " + progress + "%";

        let position = orders.findIndex(o => o.token == token);
        document.getElementById("queue").innerText =
            "People ahead of you: " + position;
    }
}

// ADMIN PANEL
if (document.getElementById("orders")) {
    output = "<h3>Total Revenue: ₹" + total + "</h3>" + output;
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let output = "";
    let total = 0;
orders.forEach(o => total += parseInt(o.price));
    orders.forEach((o, index) => {
        output += `
        <p>${o.name} ordered ${o.item} 
        | Token: ${o.token} 
        | Status: ${o.status}
        <button onclick="markReady(${index})">Ready</button>
        </p>`;
    });

    document.getElementById("orders").innerHTML = output;
}

// MARK READY
function markReady(index) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders[index].status = "Ready";

    localStorage.setItem("orders", JSON.stringify(orders));
    alert("Order Ready!");
    location.reload();
}

// HISTORY PAGE
if (document.getElementById("historyList")) {

    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let output = "";

    orders.forEach(o => {
        output += `
        <p>
        🍽️ ${o.item} | ₹${o.price} <br>
        🎟️ Token: ${o.token} <br>
        📊 Status: ${o.status}
        </p>
        <hr>
        `;
    });

    document.getElementById("historyList").innerHTML = output;
}

function goHistory() {
    window.location.href = "history.html";
}

function searchFood() {

    let input = document.getElementById("search").value.toLowerCase();
    let filtered = menu.filter(item =>
        item.name.toLowerCase().includes(input)
    );

    let output = "";

    filtered.forEach(item => {
        output += `
        <div class="card">
            <img src="${item.img}">
            <h3>${item.name}</h3>
            <p>₹${item.price}</p>
            <button onclick="orderItem('${item.name}', ${item.price})">Order</button>
        </div>
        `;
    });

    document.getElementById("menuList").innerHTML = output;
}
function cancelOrder() {

    let token = localStorage.getItem("currentToken");
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders = orders.filter(o => o.token != token);

    localStorage.setItem("orders", JSON.stringify(orders));

    alert("Order Cancelled");

    window.location.href = "menu.html";
}

function showNotification(msg) {

    let box = document.createElement("div");
    box.innerText = msg;
    box.className = "notify";

    document.body.appendChild(box);

    setTimeout(() => {
        box.remove();
    }, 3000);
}