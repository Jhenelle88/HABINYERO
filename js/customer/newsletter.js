export function initNewsletter() {
  document.getElementById("newsletter-form").addEventListener("submit", event => {
    event.preventDefault();
    document.getElementById("newsletter-message").textContent = "You're on the list — salamat for being here.";
    event.currentTarget.reset();
  });
}
