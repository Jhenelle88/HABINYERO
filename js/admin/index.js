import { renderInventory, saveProduct, setInventorySearch } from "./inventory.js";
import { closeWaybill, openWaybill, renderOrders, setOrderFilter, setOrderSearch, setOrderStatus } from "./orders.js";
import { renderOverview } from "./overview.js";
import { renderInventorySummary, saveMonthlyExpenses, setFinancialMonth, setFinancialOrderScope, toggleSelectedOrders } from "./salary.js";

const tabRenderers = {
  overview: renderOverview,
  inventory: renderInventory,
  orders: renderOrders,
  salary: renderInventorySummary
};

function renderAllTabs() {
  Object.values(tabRenderers).forEach(render => render());
}

function openAdminTab(tabName) {
  if (!Object.hasOwn(tabRenderers, tabName)) return;
  document.querySelectorAll(".admin-view").forEach(view => view.classList.toggle("admin-hidden", view.id !== `admin-${tabName}`));
  document.querySelectorAll(".admin-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.adminTab === tabName));
}

export function initAdmin({ toast, onInventoryChange }) {
  document.querySelector(".admin-sidebar").addEventListener("click", event => {
    const tab = event.target.closest("[data-admin-tab]");
    if (tab) openAdminTab(tab.dataset.adminTab);
  });

  document.getElementById("admin-app").addEventListener("click", event => {
    const shortcut = event.target.closest("[data-open-admin-tab]");
    const saveButton = event.target.closest("[data-save-product]");
    const waybillButton = event.target.closest("[data-waybill]");
    const orderFilter = event.target.closest("[data-order-filter]");
    const monthlySave = event.target.closest("[data-save-monthly-expenses]");
    const selectedOrdersToggle = event.target.closest("[data-toggle-selected-orders]");
    if (waybillButton) {
      try {
        openWaybill(waybillButton.dataset.waybill);
      } catch (error) {
        toast(error.message || "Could not open the waybill.");
      }
      return;
    }
    if (orderFilter) {
      setOrderFilter(orderFilter.dataset.orderFilter);
      return;
    }
    if (monthlySave) {
      try {
        saveMonthlyExpenses();
        toast("Monthly expenses saved.");
      } catch (error) {
        toast(error.message || "Could not save monthly finances.");
      }
      return;
    }
    if (selectedOrdersToggle) {
      toggleSelectedOrders();
      return;
    }
    if (shortcut) openAdminTab(shortcut.dataset.openAdminTab);
    if (!saveButton) return;
    try {
      saveProduct(saveButton.dataset.saveProduct);
      renderAllTabs();
      onInventoryChange();
      toast("Product details updated.");
    } catch (error) {
      toast(error.message || "Could not save product details.");
    }
  });

  document.getElementById("admin-app").addEventListener("input", event => {
    const inventoryInput = event.target.closest("#inventory-search");
    const orderInput = event.target.closest("#orders-search");
    if (inventoryInput) setInventorySearch(inventoryInput.value);
    if (orderInput) setOrderSearch(orderInput.value);
  });

  document.getElementById("admin-app").addEventListener("change", event => {
    const select = event.target.closest("[data-order-status]");
    if (select) {
      const previousStatus = select.dataset.currentStatus || select.querySelector("option[selected]")?.value;
      try {
        setOrderStatus(select.dataset.orderStatus, select.value);
        renderAllTabs();
        onInventoryChange();
      } catch (error) {
        if (previousStatus) select.value = previousStatus;
        toast(error.message || "Could not update order status.");
      }
      return;
    }
    const monthInput = event.target.closest("#finance-month");
    const scopeInput = event.target.closest("#finance-status-scope");
    try {
      if (monthInput) setFinancialMonth(monthInput.value);
      if (scopeInput) setFinancialOrderScope(scopeInput.value);
    } catch (error) {
      toast(error.message || "Could not update financial filters.");
    }
  });

  document.getElementById("waybill-close").addEventListener("click", closeWaybill);
  document.getElementById("waybill-print").addEventListener("click", () => window.print());
  document.getElementById("waybill-backdrop").addEventListener("click", event => {
    if (event.target === event.currentTarget) closeWaybill();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeWaybill();
  });

  document.querySelectorAll("[data-open-admin-tab]").forEach(button => button.addEventListener("click", () => openAdminTab(button.dataset.openAdminTab)));
  renderAllTabs();

  return {
    open() {
      document.body.classList.add("admin-mode");
      openAdminTab("overview");
      renderAllTabs();
    },
    close() {
      document.body.classList.remove("admin-mode");
    },
    refresh: renderAllTabs
  };
}
