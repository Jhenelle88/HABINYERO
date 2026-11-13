import { products } from "../products.js";
import { escapeHtml, getStock, LOW_STOCK_LIMIT, orders, peso } from "../store.js";

export function renderOverview() {
  const lowStock = products.filter(product => getStock(product.id) <= LOW_STOCK_LIMIT);
  const pending = orders.filter(order => order.status === "Pending").length;
  document.getElementById("metric-orders").textContent = orders.length;
  document.getElementById("metric-pending").textContent = pending;
  document.getElementById("metric-low-stock").textContent = lowStock.length;
  document.getElementById("stock-alert-count").textContent = `${lowStock.length} product${lowStock.length === 1 ? "" : "s"}`;
  document.getElementById("admin-today").textContent = new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(new Date());

  document.getElementById("low-stock-list").innerHTML = lowStock.length ? lowStock.map(product => `
    <tr>
      <td><div class="admin-product-cell"><img src="${product.image}" alt=""><div><strong>${escapeHtml(product.name)}</strong><span>${peso.format(product.price)}</span></div></div></td>
      <td>${escapeHtml(product.category)}</td>
      <td class="stock-low">${getStock(product.id)} left</td>
      <td><button class="stock-save" type="button" data-open-admin-tab="inventory">Manage stock</button></td>
    </tr>`).join("") : '<tr><td class="admin-empty" colspan="4">All products have healthy stock.</td></tr>';

  const recentOrders = [...orders].reverse().slice(0, 5);
  document.getElementById("recent-orders-list").innerHTML = recentOrders.length ? recentOrders.map(order => `
    <tr>
      <td><button class="waybill-link" type="button" data-waybill="${escapeHtml(order.id)}">${escapeHtml(order.id)}</button><span class="admin-secondary">${escapeHtml(new Date(order.createdAt).toLocaleDateString("en-PH"))}</span></td>
      <td>${escapeHtml(order.customer.name)}</td>
      <td class="admin-order-items">${order.items.map(item => `${escapeHtml(item.name)} × ${item.quantity}`).join("<br>")}</td>
      <td>${peso.format(order.total)}</td>
      <td>${escapeHtml(order.status)}</td>
    </tr>`).join("") : '<tr><td class="admin-empty" colspan="5">No orders yet.</td></tr>';
}
