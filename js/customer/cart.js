import { products } from "../products.js";
import { getStock, peso } from "../store.js";

let cart = [];
let showToast = () => {};
let onCheckout = () => {};

function itemCount() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function selectedItems() {
  return cart.filter(item => item.selected);
}

function itemsTotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function syncCartPrices() {
  cart.forEach(item => {
    const product = products.find(entry => entry.id === item.id);
    if (product) item.price = product.price;
  });
}

function renderCart() {
  syncCartPrices();
  const count = itemCount();
  const selected = selectedItems();
  const selectedCount = selected.reduce((total, item) => total + item.quantity, 0);
  const subtotal = itemsTotal(selected);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("bag-item-count").textContent = count ? `(${count})` : "";
  const items = document.getElementById("cart-items");
  const summary = document.getElementById("cart-summary");

  if (!cart.length) {
    items.innerHTML = `<div class="cart-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"></path><path d="M9 9V6a3 3 0 0 1 6 0v3"></path></svg><p>Your bag is waiting.</p><span>Find a piece you'll treasure for years.</span></div>`;
    summary.innerHTML = '<a class="continue-link" href="#collection" id="empty-shop-link">Explore the collection</a>';
    document.getElementById("empty-shop-link").addEventListener("click", closeCart);
    return;
  }

  items.innerHTML = `<div class="cart-select-all">
    <label class="cart-select-label"><input id="select-all-cart" type="checkbox" aria-label="Select all items" ${selected.length === cart.length ? "checked" : ""}> Select all</label>
    <span>${count} item${count === 1 ? "" : "s"} in bag</span>
  </div>${cart.map(item => `
    <div class="cart-line">
      <label class="cart-item-select"><input type="checkbox" data-cart-select="${item.id}" aria-label="Select ${item.name} for checkout" ${item.selected ? "checked" : ""}></label>
      <img src="${item.image}" alt="${item.alt}">
      <div class="cart-line-info">
        <h3>${item.name}</h3><span>${item.category} · ${item.color}</span>
        <span class="cart-stock-note">Stocks: ${getStock(item.id)}</span>
        <div class="quantity-control" aria-label="Quantity for ${item.name}">
          <button data-quantity="${item.id}" data-change="-1" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button data-quantity="${item.id}" data-change="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-line-end"><strong>${peso.format(item.price * item.quantity)}</strong><button class="remove-item" data-remove="${item.id}">Remove</button></div>
    </div>`).join("")}`;

  const selectAll = document.getElementById("select-all-cart");
  selectAll.indeterminate = selected.length > 0 && selected.length < cart.length;
  const remaining = Math.max(0, 5000 - subtotal);
  summary.innerHTML = `<div class="subtotal-row"><span>Selected subtotal · ${selectedCount} item${selectedCount === 1 ? "" : "s"}</span><strong>${peso.format(subtotal)}</strong></div>
    <p class="shipping-note">${!selectedCount ? "Select one or more items to continue." : remaining ? `You're ${peso.format(remaining)} away from complimentary delivery.` : "Complimentary delivery unlocked."}</p>
    <button class="button" id="checkout-button" ${selectedCount ? "" : "disabled"}>Checkout selected&nbsp; →</button>
    <a class="continue-link" href="#collection" id="continue-shopping">Continue shopping</a>`;
  document.getElementById("checkout-button").addEventListener("click", onCheckout);
  document.getElementById("continue-shopping").addEventListener("click", closeCart);
}

function openCart() {
  renderCart();
  document.getElementById("cart-overlay").classList.add("open");
  const drawer = document.getElementById("cart-drawer");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("cart-close").focus();
}

function closeCart() {
  document.getElementById("cart-overlay").classList.remove("open");
  const drawer = document.getElementById("cart-drawer");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.getElementById("cart-toggle").focus();
}

export function getSelectedCartItems() {
  syncCartPrices();
  return selectedItems().map(item => ({ ...item }));
}

export function refreshCart() {
  renderCart();
}

export function removeCheckedOutItems(checkedOutIds) {
  const ids = new Set(checkedOutIds);
  cart = cart.filter(item => !ids.has(item.id));
  renderCart();
}

export function initCart({ toast, checkout }) {
  showToast = toast;
  onCheckout = checkout;
  renderCart();
  document.getElementById("cart-toggle").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  document.getElementById("cart-overlay").addEventListener("click", closeCart);

  document.getElementById("cart-items").addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-quantity]");
    const removeButton = event.target.closest("[data-remove]");
    if (quantityButton) {
      const item = cart.find(entry => entry.id === quantityButton.dataset.quantity);
      const amount = Number(quantityButton.dataset.change);
      if (item && amount > 0 && item.quantity >= getStock(item.id)) {
        showToast("Sorry, there is not enough stock available.");
        return;
      }
      if (item) {
        item.quantity += amount;
        if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== item.id);
        renderCart();
      }
    }
    if (removeButton) {
      cart = cart.filter(item => item.id !== removeButton.dataset.remove);
      renderCart();
    }
  });

  document.getElementById("cart-items").addEventListener("change", event => {
    if (event.target.id === "select-all-cart") {
      cart.forEach(item => { item.selected = event.target.checked; });
      renderCart();
      return;
    }
    const selectedInput = event.target.closest("[data-cart-select]");
    const item = selectedInput && cart.find(entry => entry.id === selectedInput.dataset.cartSelect);
    if (item) {
      item.selected = selectedInput.checked;
      renderCart();
    }
  });
}

export function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (getStock(id) <= (existing?.quantity || 0)) {
    showToast("Sorry, there is not enough stock available.");
    return;
  }
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1, selected: true });
  renderCart();
  showToast(`${product.name} added to your bag`);
}

export function closeCartDrawer() {
  closeCart();
}
