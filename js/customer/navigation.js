export function initNavigation({ renderProducts }) {
  let activeFilter = "All";
  let searchTerm = "";
  const searchPanel = document.getElementById("search-panel");
  const searchInput = document.getElementById("search-input");
  const searchToggle = document.getElementById("search-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const menuToggle = document.getElementById("menu-toggle");

  document.querySelector(".filter-row").addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach(filter => filter.classList.toggle("active", filter === button));
    renderProducts(activeFilter, searchTerm);
  });

  document.addEventListener("click", event => {
    const shopLink = event.target.closest("[data-shop-category], [data-category-link]");
    if (shopLink) {
      activeFilter = shopLink.dataset.shopCategory || shopLink.dataset.categoryLink;
      document.querySelectorAll(".filter-button").forEach(button => button.classList.toggle("active", button.dataset.filter === activeFilter));
      renderProducts(activeFilter, searchTerm);
      document.getElementById("collection").scrollIntoView({ behavior: "smooth" });
      mobileNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  searchToggle.addEventListener("click", () => {
    const open = searchPanel.classList.toggle("open");
    searchToggle.setAttribute("aria-expanded", String(open));
    if (open) searchInput.focus();
    else {
      searchInput.value = "";
      searchTerm = "";
      renderProducts(activeFilter, searchTerm);
    }
  });

  searchInput.addEventListener("input", () => {
    const wasEmpty = !searchTerm;
    searchTerm = searchInput.value;
    renderProducts(activeFilter, searchTerm);
    if (searchTerm && wasEmpty) document.getElementById("collection").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  menuToggle.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll(".mobile-nav a").forEach(link => link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
}
