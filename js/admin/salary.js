import {
  escapeHtml,
  getCapital,
  getMonthlyExpenses,
  orders,
  peso,
  updateMonthlyExpenses
} from "../store.js";

const orderScopes = {
  "all-active": ["Pending", "Processing", "Completed"],
  "processing-completed": ["Processing", "Completed"],
  completed: ["Completed"]
};

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

let selectedMonth = currentMonth();
let selectedOrderScope = "all-active";

function ordersForPeriod() {
  const statuses = orderScopes[selectedOrderScope];
  return orders.filter(order => {
    const date = new Date(order.createdAt);
    return !Number.isNaN(date.getTime())
      && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === selectedMonth
      && statuses.includes(order.status);
  });
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month) {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(new Date(year, value - 1, 1));
}

function recentMonths() {
  const [year, value] = selectedMonth.split("-").map(Number);
  return Array.from({ length: 6 }, (_, index) => monthKey(new Date(year, value - 6 + index, 1)));
}

function calculateFinancialSummary(month, monthOrders) {
  const revenue = monthOrders.reduce((total, order) => total + order.total, 0);
  const productCapital = monthOrders.reduce((total, order) => total + order.items.reduce((orderTotal, item) => {
    const capital = Number.isSafeInteger(item.capital) && item.capital >= 0 ? item.capital : getCapital(item.id);
    return orderTotal + capital * item.quantity;
  }, 0), 0);
  const expenses = getMonthlyExpenses(month).expenses;
  return { revenue, productCapital, expenses, profit: revenue - productCapital - expenses };
}

function monthlySummary(month) {
  const statuses = orderScopes[selectedOrderScope];
  const monthOrders = orders.filter(order => {
    const date = new Date(order.createdAt);
    return !Number.isNaN(date.getTime()) && monthKey(date) === month && statuses.includes(order.status);
  });
  return { month, ...calculateFinancialSummary(month, monthOrders) };
}

function renderMonthlyHistory() {
  const summaries = recentMonths().map(monthlySummary);
  const series = [
    { key: "revenue", label: "Revenue", className: "revenue-series" },
    { key: "productCapital", label: "Product capital", className: "capital-series" },
    { key: "expenses", label: "Expenses", className: "expenses-series" },
    { key: "profit", label: "Profit", className: "profit-series" }
  ];
  const chart = document.getElementById("finance-history-chart");
  const width = 840;
  const height = 330;
  const left = 82;
  const right = 18;
  const top = 18;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = summaries.flatMap(summary => series.map(item => summary[item.key]));
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const padding = Math.max(500, (maximum - minimum) * 0.1);
  const lower = minimum < 0 ? minimum - padding : 0;
  const upper = maximum > 0 ? maximum + padding : padding;
  const x = index => left + index * plotWidth / (summaries.length - 1);
  const y = value => top + (upper - value) / (upper - lower) * plotHeight;
  const grid = Array.from({ length: 5 }, (_, index) => {
    const value = upper - (upper - lower) * index / 4;
    const position = y(value);
    return `<line class="finance-chart-gridline" x1="${left}" y1="${position}" x2="${width - right}" y2="${position}"></line>
      <text class="finance-chart-axis" x="${left - 10}" y="${position + 4}" text-anchor="end">${peso.format(value)}</text>`;
  }).join("");
  const lines = series.map(item => {
    const points = summaries.map((summary, index) => `${x(index)},${y(summary[item.key])}`);
    const markers = summaries.map((summary, index) => `<circle class="${item.className}" cx="${x(index)}" cy="${y(summary[item.key])}" r="4"><title>${item.label}, ${monthLabel(summary.month)}: ${peso.format(summary[item.key])}</title></circle>`).join("");
    return `<polyline class="${item.className}" points="${points.join(" ")}"></polyline>${markers}`;
  }).join("");
  const labels = summaries.map((summary, index) =>
    `<text class="finance-chart-month" x="${x(index)}" y="${height - 15}" text-anchor="middle">${monthLabel(summary.month)}</text>`
  ).join("");

  chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  chart.innerHTML = `<g>${grid}</g><g>${lines}</g><g>${labels}</g>`;
  document.getElementById("finance-history-summary").innerHTML = summaries.map(summary => `
    <tr>
      <td>${monthLabel(summary.month)}</td>
      <td>${peso.format(summary.revenue)}</td>
      <td>${peso.format(summary.productCapital)}</td>
      <td>${peso.format(summary.expenses)}</td>
      <td><strong>${peso.format(summary.profit)}</strong></td>
    </tr>`).join("");
}

export function renderInventorySummary() {
  const monthInput = document.getElementById("finance-month");
  const scopeInput = document.getElementById("finance-status-scope");
  monthInput.value = selectedMonth;
  scopeInput.value = selectedOrderScope;

  const selectedOrders = ordersForPeriod();
  const monthly = calculateFinancialSummary(selectedMonth, selectedOrders);

  document.getElementById("finance-order-count").textContent = selectedOrders.length;
  document.getElementById("finance-revenue").textContent = peso.format(monthly.revenue);
  document.getElementById("finance-product-capital").textContent = peso.format(monthly.productCapital);
  document.getElementById("finance-expenses").textContent = peso.format(monthly.expenses);
  document.getElementById("finance-profit").textContent = peso.format(monthly.profit);
  document.getElementById("finance-expenses-input").value = monthly.expenses;
  document.getElementById("finance-orders-list").innerHTML = selectedOrders.length
    ? [...selectedOrders].reverse().map(order => {
      const customer = `<div class="admin-customer"><strong>${escapeHtml(order.customer.name)}</strong><span class="admin-secondary">${escapeHtml(order.customer.email)}</span><span class="admin-secondary">${escapeHtml(order.customer.phone)}</span></div>`;
      const address = [order.customer.address, order.customer.city, order.customer.region].filter(Boolean).join(", ");
      const items = order.items.map(item => `${escapeHtml(item.name)} × ${item.quantity}`).join("<br>");
      return `<tr>
        <td><button class="waybill-link" type="button" data-waybill="${escapeHtml(order.id)}">${escapeHtml(order.id)}</button><span class="admin-secondary">${escapeHtml(new Date(order.createdAt).toLocaleDateString("en-PH"))}</span></td>
        <td>${escapeHtml(order.sellerName || "—")}</td>
        <td>${customer}</td>
        <td>${escapeHtml(address)}</td>
        <td class="admin-order-items">${items}</td>
        <td>${escapeHtml(order.payment)}</td>
        <td><strong>${peso.format(order.total)}</strong></td>
        <td>${escapeHtml(order.status)}</td>
      </tr>`;
    }).join("")
    : '<tr><td class="admin-empty" colspan="8">No orders match the selected month and statuses.</td></tr>';
  renderMonthlyHistory();
}

export function setFinancialMonth(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new RangeError("Select a valid month.");
  selectedMonth = month;
  renderInventorySummary();
}

export function setFinancialOrderScope(scope) {
  if (!Object.hasOwn(orderScopes, scope)) throw new Error("Select a valid order status filter.");
  selectedOrderScope = scope;
  renderInventorySummary();
}

export function saveMonthlyExpenses() {
  const expenses = Number(document.getElementById("finance-expenses-input").value);
  updateMonthlyExpenses(selectedMonth, expenses);
  renderInventorySummary();
}

export function toggleSelectedOrders() {
  const panel = document.getElementById("finance-orders-panel");
  const button = document.getElementById("finance-orders-toggle");
  const isExpanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isExpanded));
  panel.classList.toggle("admin-hidden", isExpanded);
}
