const API = (path, opts={}) => fetch(`http://localhost:4000${path}`, {
  headers: { "Content-Type": "application/json" },
  ...opts
}).then(r => r.json());

const state = {
  menu: [],
  cart: [] // {id,name,price,qty}
};

// no auth UI in simple client

function renderMenu() {
  const el = document.getElementById("menu");
  el.innerHTML = state.menu.map(item => `
    <div class="card">
      <div class="img">${item.img || "🍽️"}</div>
      <h3>${item.name}</h3>
      <div class="row">
        <p>₹ ${item.price}</p>
        <button onclick="addToCart('${item.id}')">Add</button>
      </div>
    </div>
  `).join("");
}

function addToCart(id) {
  const item = state.menu.find(m => m.id === id);
  const row = state.cart.find(c => c.id === id);
  if (row) row.qty += 1;
  else state.cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  updateCartUI();
}

function updateCartUI() {
  const list = document.getElementById("cart-list");
  const total = state.cart.reduce((s, c) => s + (c.price * c.qty), 0);
  document.getElementById("cart-total").textContent = total;
  document.getElementById("cart-count").textContent = state.cart.reduce((s,c)=>s+c.qty,0);

  list.innerHTML = state.cart.length === 0 ? "<p>Your cart is empty.</p>" :
    state.cart.map(c => `
      <div class="cart-item">
        <div>${c.name}</div>
        <div class="qty">
          <button onclick="decr('${c.id}')">-</button>
          <span>${c.qty}</span>
          <button onclick="incr('${c.id}')">+</button>
        </div>
        <div>₹ ${c.price * c.qty}</div>
      </div>
    `).join("");
}

function incr(id){ const r = state.cart.find(c=>c.id===id); r.qty++; updateCartUI(); }
function decr(id){ const i = state.cart.findIndex(c=>c.id===id); if (i>-1){ state.cart[i].qty--; if(state.cart[i].qty<=0) state.cart.splice(i,1); updateCartUI(); } }

async function checkout() {
  if (state.cart.length === 0) return alert("Cart empty");
  const order = await API("/api/orders", { method:"POST", body: JSON.stringify({ items: state.cart }) });
  if (order.error) return alert(order.error);
  // mock pay
  const paid = await API("/api/payments/mock", { method:"POST", body: JSON.stringify({ orderId: order.id }) });
  if (paid.status === "PAID") {
    alert(`Payment success! Order #${paid.id}\nTotal ₹${paid.total}`);
    state.cart = [];
    updateCartUI();
  } else {
    alert("Payment failed");
  }
}

async function boot() {
  const menu = await API("/api/menu");
  state.menu = menu;
  renderMenu();
  updateCartUI();

  document.getElementById("checkout").addEventListener("click", checkout);
  document.getElementById("view-cart").addEventListener("click", () => {
    document.getElementById("cart-panel").classList.toggle("hidden");
  });

  document.getElementById("year").textContent = new Date().getFullYear();
}

boot();

