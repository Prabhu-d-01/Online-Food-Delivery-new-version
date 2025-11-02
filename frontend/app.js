// QR Code generation library
const QRCode = {
  generate: (text, size = 200) => {
    // In a real app, you would use a proper QR code library
    // This is a simplified version for demonstration
    const canvas = document.createElement('canvas');
    const qrSize = Math.min(Math.max(size, 100), 1000);
    canvas.width = qrSize;
    canvas.height = qrSize;
    const ctx = canvas.getContext('2d');
    
    // Draw QR code pattern (simplified for demo)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, qrSize, qrSize);
    
    // Add some pattern to simulate a QR code
    ctx.fillStyle = '#000000';
    const moduleSize = qrSize / 21;
    
    // Position markers
    const drawPositionMarker = (x, y) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, 7*moduleSize, 7*moduleSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + moduleSize, y + moduleSize, 5*moduleSize, 5*moduleSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 2*moduleSize, y + 2*moduleSize, 3*moduleSize, 3*moduleSize);
    };
    
    drawPositionMarker(0, 0);
    drawPositionMarker(qrSize - 7*moduleSize, 0);
    drawPositionMarker(0, qrSize - 7*moduleSize);
    
    // Add some random data modules
    ctx.fillStyle = '#000000';
    for (let y = 0; y < 21; y++) {
      for (let x = 0; x < 21; x++) {
        // Skip position markers
        if ((x < 8 && y < 8) || (x > 13 && y < 8) || (x < 8 && y > 13)) continue;
        
        // Random pattern (in a real app, this would be the actual QR code data)
        if (Math.random() > 0.7) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    // Add text below QR code
    ctx.fillStyle = '#000000';
    ctx.font = `${Math.floor(moduleSize * 1.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Pay', qrSize/2, qrSize + moduleSize * 3);
    
    return canvas.toDataURL();
  }
};

const API = (path, opts={}) => fetch(`http://localhost:4000${path}`, {
  headers: { "Content-Type": "application/json" },
  ...opts,
  body: opts.body ? JSON.stringify(opts.body) : undefined
}).then(r => r.json());

const state = {
  menu: [],
  cart: [] // {id,name,price,qty}
};

// DOM Elements
const orderModal = document.getElementById('order-modal');
const paymentModal = document.getElementById('payment-modal');
const confirmationModal = document.getElementById('confirmation-modal');
const orderForm = document.getElementById('order-form');
const closeButtons = document.querySelectorAll('.close, .btn-cancel, #close-confirmation, #cancel-payment');
let currentOrder = null;

// Show modal
function showModal(modal) {
  modal.classList.add('visible');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Hide modal
function hideModal(modal) {
  modal.classList.remove('visible');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modals when clicking outside
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    document.querySelectorAll('.modal').forEach(modal => {
      hideModal(modal);
    });
  }
};

// Close buttons event listeners
closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal');
    hideModal(modal);
  });
});

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
  if (state.cart.length === 0) return alert("Your cart is empty");
  showModal(orderModal);
}

async function submitOrder(event) {
  event.preventDefault();
  
  // Get form data
  const customerName = document.getElementById('customer-name').value;
  const customerPhone = document.getElementById('customer-phone').value;
  const customerAddress = document.getElementById('customer-address').value;
  const customerNotes = document.getElementById('customer-notes').value;
  
  // Create order data
  currentOrder = {
    items: [...state.cart],
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      notes: customerNotes
    },
    total: state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  };
  
  // Show payment modal
  showPaymentModal(currentOrder);
}

function showPaymentModal(order) {
  // Hide order form
  hideModal(orderModal);
  
  // Set payment amount
  document.getElementById('payment-amount').textContent = order.total.toFixed(2);
  
  // Generate and display QR code
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = ''; // Clear previous QR code
  
  // Create payment link (in a real app, this would be a UPI payment link)
  const paymentLink = `upi://pay?pa=your-merchant@upi&pn=Food%20Delivery&am=${order.total}&cu=INR&tn=Order%20${Date.now()}`;
  
  // Generate QR code
  const qrCodeData = QRCode.generate(paymentLink, 200);
  const img = document.createElement('img');
  img.src = qrCodeData;
  img.alt = 'Scan to Pay';
  qrContainer.appendChild(img);
  
  // Show payment modal
  showModal(paymentModal);
}

async function processPayment(order) {
  try {
    // Submit order to backend
    const orderResponse = await API("/api/orders", { 
      method: "POST", 
      body: order
    });
    
    if (orderResponse.error) throw new Error(orderResponse.error);
    
    // Process payment
    const payment = await API("/api/payments/mock", { 
      method: "POST", 
      body: { 
        orderId: orderResponse.id,
        amount: order.total
      }
    });
    
    if (payment.status === "PAID") {
      // Show order confirmation
      showOrderConfirmation(orderResponse, payment);
      
      // Reset form and cart
      orderForm.reset();
      state.cart = [];
      updateCartUI();
      
      // Hide payment modal
      hideModal(paymentModal);
      
      return true;
    } else {
      throw new Error("Payment failed");
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert(`Error processing payment: ${error.message}`);
    return false;
  }
}

function showOrderConfirmation(order, payment) {
  // Hide order form
  hideModal(orderModal);
  
  // Set order details
  document.getElementById('order-id').textContent = order.id;
  
  // Build order summary
  const orderSummary = document.getElementById('order-summary');
  orderSummary.innerHTML = `
    <div style="margin-bottom: 15px;">
      <p><strong>Customer:</strong> ${order.customer.name}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>
      <p><strong>Delivery Address:</strong> ${order.customer.address}</p>
      ${order.customer.notes ? `<p><strong>Notes:</strong> ${order.customer.notes}</p>` : ''}
    </div>
    <div style="border-top: 1px solid #1f2937; padding-top: 10px;">
      ${state.cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>${item.name} (${item.qty}x)</span>
          <span>₹${item.price * item.qty}</span>
        </div>
      `).join('')}
    </div>
    <div style="border-top: 1px solid #1f2937; margin-top: 10px; padding-top: 10px; font-weight: bold;">
      <div style="display: flex; justify-content: space-between;">
        <span>Total:</span>
        <span>₹${order.total}</span>
      </div>
    </div>
  `;
  
  // Show confirmation modal
  showModal(confirmationModal);
}

async function boot() {
  try {
    const menu = await API("/api/menu");
    state.menu = menu;
    renderMenu();
    updateCartUI();

    // Event Listeners
    document.getElementById("checkout").addEventListener("click", checkout);
    document.getElementById("view-cart").addEventListener("click", () => {
      document.getElementById("cart-panel").classList.toggle("hidden");
    });

    // Form submission
    orderForm.addEventListener('submit', submitOrder);
    
    // Payment success button
    document.getElementById('payment-success').addEventListener('click', async () => {
      if (!currentOrder) return;
      
      const success = await processPayment(currentOrder);
      if (success) {
        currentOrder = null;
      }
    });
    
    // Payment method buttons
    document.querySelectorAll('.payment-option').forEach(button => {
      button.addEventListener('click', () => {
        const method = button.dataset.method;
        alert(`Redirecting to ${method} payment...`);
        // In a real app, this would redirect to the payment gateway
      });
    });

    // Set current year in footer
    document.getElementById("year").textContent = new Date().getFullYear();
    
  } catch (error) {
    console.error('Error initializing app:', error);
    alert('Failed to load menu. Please try again later.');
  }
}

boot();

