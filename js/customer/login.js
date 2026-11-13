export function initLogin({ onLogin }) {
  const backdrop = document.getElementById("login-backdrop");
  const toggle = document.getElementById("login-toggle");

  const closeLogin = () => {
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
    toggle.focus();
  };

  toggle.addEventListener("click", () => {
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    document.getElementById("login-email").focus();
  });
  document.getElementById("login-close").addEventListener("click", closeLogin);
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeLogin();
  });
  document.getElementById("login-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    event.currentTarget.reset();
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
    onLogin();
  });

  return closeLogin;
}
