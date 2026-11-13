import { createOrder, escapeHtml, getCapital, peso } from "../store.js";
import { closeCartDrawer, getSelectedCartItems, removeCheckedOutItems } from "./cart.js";

let onOrderPlaced = () => {};
let showToast = () => {};
let checkoutItems = [];

function closeCheckout() {
  document.getElementById("checkout-backdrop").classList.remove("open");
  document.body.style.overflow = "";
  document.getElementById("cart-toggle").focus();
}

function renderCheckout() {
  const subtotal = checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 250;
  document.getElementById("checkout-modal").innerHTML = `
    <div class="checkout-head">
      <div><div class="eyebrow">Just a few details</div><h2 id="checkout-title">Delivery details</h2><p>Where should we send your HabInyera pieces?</p></div>
      <button class="close-button" id="checkout-close" aria-label="Close checkout"><svg viewBox="0 0 24 24"><path d="m5 5 14 14M19 5 5 19"></path></svg></button>
    </div>
    <form id="checkout-form">
      <div class="form-grid">
        <div class="field full"><label for="seller-name">Seller Name</label><input id="seller-name" name="sellerName" value="HabInyera" required></div>
        <div class="field"><label for="customer-name">Full name</label><input id="customer-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="customer-email">Email address</label><input id="customer-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field full"><label for="customer-phone">Mobile number</label><input id="customer-phone" name="phone" type="tel" autocomplete="tel" placeholder="+63" required></div>
        <div class="field full"><label for="customer-address">Street address</label><input id="customer-address" name="address" autocomplete="street-address" required></div>
        <div class="field"><label for="customer-city">City / municipality</label><input id="customer-city" name="city" autocomplete="address-level2" required></div>
        <div class="field"><label for="customer-region">Province / region</label><input id="customer-region" name="region" autocomplete="address-level1" required></div>
        <div class="field full"><label for="customer-payment">Payment method</label><select id="customer-payment" name="payment" required><option value="Cash on Delivery">Cash on Delivery</option><option value="GCash">GCash</option><option value="Bank transfer">Bank transfer</option></select></div>
        <div class="field full"><label for="customer-notes">Order notes <span class="optional-label">(optional)</span></label><textarea id="customer-notes" name="notes" placeholder="Sizing notes or delivery instructions"></textarea></div>
      </div>
      <div class="checkout-summary">
        <div class="checkout-summary-row"><span>Subtotal · ${checkoutItems.reduce((total, item) => total + item.quantity, 0)} item${checkoutItems.reduce((total, item) => total + item.quantity, 0) === 1 ? "" : "s"}</span><span>${peso.format(subtotal)}</span></div>
        <div class="checkout-summary-row"><span>Delivery</span><span>${shipping ? peso.format(shipping) : "Complimentary"}</span></div>
        <div class="checkout-summary-row total"><span>Order total</span><span>${peso.format(subtotal + shipping)}</span></div>
      </div>
      <button type="submit" class="button checkout-submit">Place your order&nbsp; →</button>
      <p class="checkout-footnote">Payment is confirmed with you after your order is received.</p>
    </form>`;
  document.getElementById("checkout-close").addEventListener("click", closeCheckout);
  document.getElementById("checkout-form").addEventListener("submit", placeOrder);
}

function placeOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const details = Object.fromEntries(new FormData(form).entries());
  const subtotal = checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 250;
  const order = {
    id: `HAB-${Date.now().toString().slice(-7)}`,
    createdAt: new Date().toISOString(),
    customer: {
      name: String(details.name).trim(),
      email: String(details.email),
      phone: String(details.phone).trim(),
      address: String(details.address).trim(),
      city: String(details.city).trim(),
      region: String(details.region).trim()
    },
    sellerName: String(details.sellerName).trim(),
    payment: String(details.payment),
    items: checkoutItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price, capital: getCapital(item.id) })),
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: "Pending"
  };

  try {
    createOrder(order);
  } catch (error) {
    showToast(error.message || "Could not save your order. Please try again.");
    return;
  }

  const firstName = String(details.name).trim().split(/\s+/)[0];
  const checkedOutIds = checkoutItems.map(item => item.id);
  removeCheckedOutItems(checkedOutIds);
  onOrderPlaced();
  document.getElementById("checkout-modal").innerHTML = `
    <div class="order-success">
      <div class="success-mark" aria-hidden="true">✓</div>
      <div class="eyebrow eyebrow-centered">Salamat, ${escapeHtml(firstName)}</div>
      <h2 id="checkout-title">Your order is in good hands.</h2>
      <p>Your order from <strong>${escapeHtml(order.sellerName)}</strong> has been received. We'll be in touch at <strong>${escapeHtml(order.customer.email)}</strong> to confirm your delivery and payment details.</p>
      <button class="button" id="finish-order">Back to the collection</button>
    </div>`;
  document.getElementById("finish-order").addEventListener("click", () => {
    closeCheckout();
    document.getElementById("collection").scrollIntoView({ behavior: "smooth" });
  });
}

export function initCheckout({ toast, orderPlaced }) {
  showToast = toast;
  onOrderPlaced = orderPlaced;
  document.getElementById("checkout-backdrop").addEventListener("click", event => {
    if (event.target === event.currentTarget) closeCheckout();
  });
}

export function openCheckout() {
  checkoutItems = getSelectedCartItems();
  if (!checkoutItems.length) {
    showToast("Select at least one item to check out");
    return;
  }
  closeCartDrawer();
  renderCheckout();
  document.getElementById("checkout-backdrop").classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("customer-name").focus();
}

export function closeCheckoutOnEscape() {
  closeCheckout();
}
