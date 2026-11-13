import { initAdmin } from "./admin/index.js";
import { initCart, addToCart, closeCartDrawer, refreshCart } from "./customer/cart.js";
import { initCheckout, openCheckout, closeCheckoutOnEscape } from "./customer/checkout.js";
import { initLogin } from "./customer/login.js";
import { initNavigation } from "./customer/navigation.js";
import { initNewsletter } from "./customer/newsletter.js";
import { showToast } from "./customer/notifications.js";
import { initProducts, renderProducts } from "./customer/products.js";
import { loadStoreState } from "./store.js";

try {
  loadStoreState();
} catch (error) {
  showToast(error.message);
}

const admin = initAdmin({
  toast: showToast,
  onInventoryChange: () => {
    renderProducts();
    refreshCart();
  }
});

initProducts(addToCart);
initCart({ toast: showToast, checkout: openCheckout });
initCheckout({
  toast: showToast,
  orderPlaced: () => {
    admin.refresh();
    renderProducts();
  }
});
initLogin({ onLogin: admin.open });
initNavigation({ renderProducts });
initNewsletter();
renderProducts();

document.getElementById("admin-logout").addEventListener("click", () => {
  admin.close();
  document.getElementById("login-toggle").focus();
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  closeCartDrawer();
  closeCheckoutOnEscape();
  document.getElementById("search-panel").classList.remove("open");
  if (document.getElementById("login-backdrop").classList.contains("open")) {
    document.getElementById("login-backdrop").classList.remove("open");
    document.body.style.overflow = "";
    document.getElementById("login-toggle").focus();
  }
});
