import { escapeHtml, orders, peso, updateOrderStatus } from "../store.js";

let waybillTrigger = null;
let orderSearch = "";
let orderStatusFilter = "All";
const statusOptions = ["Pending", "Processing", "Completed", "Cancelled"];

export function renderOrders() {
  const summary = [
    { label: "Total Orders", status: "All", count: orders.length },
    ...statusOptions.map(status => ({
      label: status,
      status,
      count: orders.filter(order => order.status === status).length
    }))
  ];
  document.getElementById("order-summary").innerHTML = summary.map(item => `
    <button class="order-summary-card${orderStatusFilter === item.status ? " active" : ""}" type="button" data-order-filter="${item.status}" aria-pressed="${orderStatusFilter === item.status}">
      <span>${item.label}</span><strong>${item.count}</strong>
    </button>`).join("");

  const query = orderSearch.trim().toLowerCase();
  const visibleOrders = [...orders].reverse().filter(order => {
    const matchesStatus = orderStatusFilter === "All" || order.status === orderStatusFilter;
    const searchable = `${order.id} ${order.sellerName || ""} ${order.customer.name} ${order.items.map(item => item.name).join(" ")}`.toLowerCase();
    return matchesStatus && searchable.includes(query);
  });
  document.getElementById("orders-count").textContent = `${visibleOrders.length} of ${orders.length} orders`;
  document.getElementById("orders-list").innerHTML = visibleOrders.length ? visibleOrders.map(order => {
    const customer = `<div class="admin-customer"><strong>${escapeHtml(order.customer.name)}</strong><span class="admin-secondary">${escapeHtml(order.customer.email)}</span><span class="admin-secondary">${escapeHtml(order.customer.phone)}</span></div>`;
    const items = order.items.map(item => `${escapeHtml(item.name)} × ${item.quantity}`).join("<br>");
    const address = [order.customer.address, order.customer.city, order.customer.region].filter(Boolean).join(", ");
    return `<tr>
      <td><button class="waybill-link" type="button" data-waybill="${escapeHtml(order.id)}">${escapeHtml(order.id)}</button><span class="admin-secondary">${escapeHtml(new Date(order.createdAt).toLocaleString("en-PH"))}</span></td>
      <td>${escapeHtml(order.sellerName || "—")}</td>
      <td>${customer}</td>
      <td>${escapeHtml(address)}</td>
      <td class="admin-order-items">${items}</td>
      <td>${escapeHtml(order.payment)}</td>
      <td><strong>${peso.format(order.total)}</strong></td>
      <td><select class="order-status" data-order-status="${escapeHtml(order.id)}" aria-label="Order status for ${escapeHtml(order.id)}">${statusOptions.map(status => `<option ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></td>
    </tr>`;
  }).join("") : `<tr><td class="admin-empty" colspan="8">${orders.length ? "No orders match this search and status." : "No customer orders yet. Completed checkouts will appear here."}</td></tr>`;
}

export function setOrderSearch(query) {
  orderSearch = query;
  renderOrders();
}

export function setOrderFilter(status) {
  if (status !== "All" && !statusOptions.includes(status)) return;
  orderStatusFilter = status;
  renderOrders();
}

export function setOrderStatus(orderId, status) {
  updateOrderStatus(orderId, status);
}

export function openWaybill(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order) throw new Error("The requested order was not found.");

  const address = [order.customer.address, order.customer.city, order.customer.region].filter(Boolean).join(", ");
  const rows = order.items.map(item => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${peso.format(item.price)}</td>
      <td>${peso.format(item.price * item.quantity)}</td>
    </tr>`).join("");
  const createdAt = new Date(order.createdAt).toLocaleString("en-PH");
  document.getElementById("waybill-content").innerHTML = `
    <header class="waybill-heading">
      <div><h1>Waybill</h1><p>Order ${escapeHtml(order.id)}</p></div>
      <div class="waybill-date"><span>Order date</span><strong>${escapeHtml(createdAt)}</strong></div>
    </header>
    <section class="waybill-recipient">
      <h2>Ship to</h2>
      <strong>${escapeHtml(order.customer.name)}</strong>
      <p>${escapeHtml(address)}</p>
      <p>${escapeHtml(order.customer.phone)} · ${escapeHtml(order.customer.email)}</p>
    </section>
    <div class="waybill-meta">
      <div><span>Payment method</span><strong>${escapeHtml(order.payment)}</strong></div>
      <div><span>Order status</span><strong>${escapeHtml(order.status)}</strong></div>
    </div>
    <table class="waybill-items">
      <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="waybill-totals">
      <div><span>Subtotal</span><strong>${peso.format(order.subtotal)}</strong></div>
      <div><span>Delivery</span><strong>${order.shipping ? peso.format(order.shipping) : "Complimentary"}</strong></div>
      <div class="waybill-total"><span>Total</span><strong>${peso.format(order.total)}</strong></div>
    </div>`;
  waybillTrigger = document.activeElement;
  document.getElementById("waybill-backdrop").classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("waybill-close").focus();
}

export function closeWaybill() {
  const backdrop = document.getElementById("waybill-backdrop");
  if (!backdrop.classList.contains("open")) return;
  backdrop.classList.remove("open");
  document.body.style.overflow = "";
  if (waybillTrigger?.isConnected) waybillTrigger.focus();
  waybillTrigger = null;
}
