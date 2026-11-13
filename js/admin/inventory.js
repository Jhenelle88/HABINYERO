import { products } from "../products.js";
import { escapeHtml, getCapital, getStock, LOW_STOCK_LIMIT, updateProductDetails } from "../store.js";

let inventorySearch = "";

export function renderInventory() {
  const query = inventorySearch.trim().toLowerCase();
  const visibleProducts = products.filter(product =>
    `${product.name} ${product.category} ${product.color} ${product.id}`.toLowerCase().includes(query)
  );
  document.getElementById("inventory-count").textContent = query
    ? `${visibleProducts.length} of ${products.length} products`
    : `${products.length} products`;
  document.getElementById("inventory-list").innerHTML = visibleProducts.length ? visibleProducts.map(product => {
    const stock = getStock(product.id);
    const capital = getCapital(product.id);
    const status = stock === 0 ? "Out of stock" : stock <= LOW_STOCK_LIMIT ? "Low stock" : "In stock";
    return `<tr>
      <td><div class="admin-product-cell"><img src="${product.image}" alt=""><div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.color)}</span></div></div></td>
      <td>${escapeHtml(product.category)}</td>
      <td><input class="stock-input price-input" type="number" min="1" step="1" value="${product.price}" data-price-input="${product.id}" aria-label="Price for ${escapeHtml(product.name)}"></td>
      <td><input class="stock-input price-input" type="number" min="0" step="1" value="${capital}" data-capital-input="${product.id}" aria-label="Product capital for ${escapeHtml(product.name)}"></td>
      <td><input class="stock-input" type="number" min="0" step="1" value="${stock}" data-stock-input="${product.id}" aria-label="Stock quantity for ${escapeHtml(product.name)}"></td>
      <td class="${stock <= LOW_STOCK_LIMIT ? "stock-low" : "stock-ok"}">${status}</td>
      <td><button class="stock-save" type="button" data-save-product="${product.id}">Save</button></td>
    </tr>`;
  }).join("") : '<tr><td class="admin-empty" colspan="7">No matching products found.</td></tr>';
}

export function setInventorySearch(query) {
  inventorySearch = query;
  renderInventory();
}

export function saveProduct(productId) {
  const priceInput = document.querySelector(`[data-price-input="${productId}"]`);
  const capitalInput = document.querySelector(`[data-capital-input="${productId}"]`);
  const stockInput = document.querySelector(`[data-stock-input="${productId}"]`);
  const price = Number(priceInput?.value);
  const capital = Number(capitalInput?.value);
  const stock = Number(stockInput?.value);
  if (!priceInput || !Number.isSafeInteger(price) || price <= 0) throw new RangeError("Enter a whole price greater than 0.");
  if (!capitalInput || !Number.isSafeInteger(capital) || capital < 0) throw new RangeError("Enter a whole product capital of 0 or more.");
  if (!stockInput || !Number.isInteger(stock) || stock < 0) throw new RangeError("Enter a whole stock quantity of 0 or more.");
  updateProductDetails(productId, price, stock, capital);
}
