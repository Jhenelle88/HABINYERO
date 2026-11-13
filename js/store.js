import { products } from "./products.js";

export const STORE_KEY = "habinyera-admin-demo-v1";
export const LOW_STOCK_LIMIT = 5;
const defaultStocks = [12, 8, 4, 3, 18, 5, 2, 6];
export const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export let inventory = products.map((product, index) => ({ id: product.id, stock: defaultStocks[index] }));
export let productCapitals = products.map(product => ({ id: product.id, capital: 0 }));
export let orders = [];
export let monthlyFinancials = [];

export function getStock(productId) {
  return inventory.find(item => item.id === productId)?.stock ?? 0;
}

export function getCapital(productId) {
  return productCapitals.find(item => item.id === productId)?.capital ?? 0;
}

export function getMonthlyExpenses(month) {
  return monthlyFinancials.find(item => item.month === month) || { month, expenses: 0 };
}

export function loadStoreState() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (!saved) return;
    const state = JSON.parse(saved);
    if (Array.isArray(state.inventory)) {
      inventory = products.map((product, index) => {
        const stored = state.inventory.find(item => item.id === product.id);
        return { id: product.id, stock: Number.isInteger(stored?.stock) && stored.stock >= 0 ? stored.stock : defaultStocks[index] };
      });
    }
    if (Array.isArray(state.prices)) {
      products.forEach(product => {
        const stored = state.prices.find(item => item.id === product.id);
        if (Number.isSafeInteger(stored?.price) && stored.price > 0) product.price = stored.price;
      });
    }
    if (Array.isArray(state.productCapitals)) {
      productCapitals = products.map(product => {
        const stored = state.productCapitals.find(item => item.id === product.id);
        return { id: product.id, capital: Number.isSafeInteger(stored?.capital) && stored.capital >= 0 ? stored.capital : 0 };
      });
    }
    if (Array.isArray(state.orders)) orders = state.orders;
    if (Array.isArray(state.monthlyFinancials)) {
      monthlyFinancials = state.monthlyFinancials
        .filter(item => item && /^\d{4}-(0[1-9]|1[0-2])$/.test(item.month))
        .map(item => ({
          month: item.month,
          expenses: Number.isSafeInteger(item.expenses) && item.expenses >= 0 ? item.expenses : 0
        }));
    }
  } catch (error) {
    console.error("Could not load HabInyera demo data.", error);
    throw new Error("Could not load saved demo data. Check this browser's storage.");
  }
}

export function saveStoreState() {
  const prices = products.map(({ id, price }) => ({ id, price }));
  localStorage.setItem(STORE_KEY, JSON.stringify({ inventory, orders, prices, productCapitals, monthlyFinancials }));
}

export function updateStock(productId, stock) {
  if (!Number.isInteger(stock) || stock < 0) throw new RangeError("Stock must be a whole number of 0 or more.");
  const product = products.find(item => item.id === productId);
  if (!product) throw new Error("The requested product was not found.");
  updateProductDetails(productId, product.price, stock, getCapital(productId));
}

export function updateProductDetails(productId, price, stock, capital) {
  if (!Number.isSafeInteger(price) || price <= 0) throw new RangeError("Price must be a whole number greater than 0.");
  if (!Number.isInteger(stock) || stock < 0) throw new RangeError("Stock must be a whole number of 0 or more.");
  if (!Number.isSafeInteger(capital) || capital < 0) throw new RangeError("Product capital must be a whole number of 0 or more.");
  const product = products.find(item => item.id === productId);
  const item = inventory.find(entry => entry.id === productId);
  const capitalItem = productCapitals.find(entry => entry.id === productId);
  if (!product || !item || !capitalItem) throw new Error("The requested product was not found.");
  const previousPrice = product.price;
  const previousStock = item.stock;
  const previousCapital = capitalItem.capital;
  product.price = price;
  item.stock = stock;
  capitalItem.capital = capital;
  try {
    saveStoreState();
  } catch (error) {
    product.price = previousPrice;
    item.stock = previousStock;
    capitalItem.capital = previousCapital;
    throw error;
  }
}

export function updateMonthlyExpenses(month, expenses) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new RangeError("Select a valid month.");
  if (!Number.isSafeInteger(expenses) || expenses < 0) throw new RangeError("Expenses must be a whole number of 0 or more.");
  const previous = monthlyFinancials;
  const saved = { month, expenses };
  const existing = monthlyFinancials.some(item => item.month === month);
  monthlyFinancials = existing
    ? monthlyFinancials.map(item => item.month === month ? saved : item)
    : [...monthlyFinancials, saved];
  try {
    saveStoreState();
  } catch (error) {
    monthlyFinancials = previous;
    throw error;
  }
}

export function createOrder(order) {
  const unavailable = order.items.find(item => getStock(item.id) < item.quantity);
  if (unavailable) throw new Error(`${unavailable.name} no longer has enough stock. Please update your bag.`);
  const previousInventory = inventory.map(item => ({ ...item }));
  inventory = inventory.map(stockItem => {
    const orderedItem = order.items.find(item => item.id === stockItem.id);
    return orderedItem ? { ...stockItem, stock: stockItem.stock - orderedItem.quantity } : stockItem;
  });
  orders = [...orders, order];
  try {
    saveStoreState();
  } catch (error) {
    inventory = previousInventory;
    orders = orders.filter(saved => saved.id !== order.id);
    throw error;
  }
}

export function updateOrderStatus(orderId, status) {
  const validStatuses = ["Pending", "Processing", "Completed", "Cancelled"];
  if (!validStatuses.includes(status)) throw new Error("Invalid order status.");
  const order = orders.find(item => item.id === orderId);
  if (!order) throw new Error("The requested order was not found.");
  if (order.status === status) return;

  const previousInventory = inventory.map(item => ({ ...item }));
  const previousStatus = order.status;
  if (previousStatus !== "Cancelled" && status === "Cancelled") {
    inventory = inventory.map(stockItem => {
      const orderedItem = order.items.find(item => item.id === stockItem.id);
      return orderedItem ? { ...stockItem, stock: stockItem.stock + orderedItem.quantity } : stockItem;
    });
  } else if (previousStatus === "Cancelled" && status !== "Cancelled") {
    const unavailable = order.items.find(item => getStock(item.id) < item.quantity);
    if (unavailable) throw new Error(`Cannot reopen order: not enough stock for ${unavailable.name}.`);
    inventory = inventory.map(stockItem => {
      const orderedItem = order.items.find(item => item.id === stockItem.id);
      return orderedItem ? { ...stockItem, stock: stockItem.stock - orderedItem.quantity } : stockItem;
    });
  }
  orders = orders.map(item => item.id === orderId ? { ...item, status } : item);
  try {
    saveStoreState();
  } catch (error) {
    inventory = previousInventory;
    orders = orders.map(item => item.id === orderId ? { ...item, status: previousStatus } : item);
    throw error;
  }
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
