import { products } from "../products.js";
import { escapeHtml, getStock, peso } from "../store.js";

export function renderProducts(filter = "All", searchTerm = "") {
  const grid = document.getElementById("product-grid");
  const visible = products.filter(product => {
    const categoryMatch = filter === "All" || product.category === filter;
    const query = searchTerm.trim().toLowerCase();
    const searchMatch = !query || `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });

  if (!visible.length) {
    grid.innerHTML = '<div class="empty-results">No pieces found. Try another search or collection.</div>';
    return;
  }

  grid.innerHTML = visible.map(product => {
    const stock = getStock(product.id);
    return `
      <article class="product-card">
        <div class="product-photo">
          <img src="${product.image}" alt="${escapeHtml(product.alt)}" loading="lazy">
          ${product.tag ? `<span class="product-tag">${escapeHtml(product.tag)}</span>` : ""}
          <button class="quick-add" data-add="${product.id}" aria-label="Add ${escapeHtml(product.name)} to bag" ${stock < 1 ? "disabled" : ""}>${stock < 1 ? "Out of stock" : "Add to bag&nbsp; +"}</button>
        </div>
        <div class="product-info">
          <div class="product-category">${escapeHtml(product.category)}</div>
          <h3>${escapeHtml(product.name)}</h3>
          <div class="product-bottom"><span class="product-price">${peso.format(product.price)}</span><span class="product-color">${escapeHtml(product.color)}</span></div>
          <div class="product-color product-stock-note">${stock > 0 ? `${stock} in stock` : "Currently unavailable"}</div>
        </div>
      </article>`;
  }).join("");
}

export function initProducts(onAdd) {
  document.getElementById("product-grid").addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button && !button.disabled) onAdd(button.dataset.add);
  });
}
