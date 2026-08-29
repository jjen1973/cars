const API_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/toyota?format=json";
const EMAILJS_SERVICE_ID = "service_qa8tdoc";
const EMAILJS_TEMPLATE_ID = "template_auu796j";
const EMAILJS_PUBLIC_KEY = "NipmTQ5Q0maM3Qb18";
const fallbackCars = [
  { Make_Name: "Toyota", Model_Name: "Camry", Model_Year: 2025 },
  { Make_Name: "Toyota", Model_Name: "Corolla", Model_Year: 2025 },
  { Make_Name: "Toyota", Model_Name: "RAV4", Model_Year: 2025 },
  { Make_Name: "Toyota", Model_Name: "Tacoma", Model_Year: 2025 },

  { Make_Name: "Toyota", Model_Name: "Prius", Model_Year: 2025 },
  { Make_Name: "Toyota", Model_Name: "Highlander", Model_Year: 2025 },
];
const imageUrls = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80",
];
const grid = document.querySelector("#car-grid");
const status = document.querySelector("#api-status");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const priceRange = document.querySelector("#price-range");
const nav = document.querySelector(".nav");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector("#nav-links");
const contactButton = document.querySelector(".contact");
const contactModal = document.querySelector("#contact-modal");
const closeContactButton = document.querySelector(".modal-close");
const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-status");
const detailsModal = document.querySelector("#details-modal");
const detailsImage = document.querySelector("#details-image");
const detailsTitle = document.querySelector("#details-title");
const detailsMake = document.querySelector("#details-make");
const detailsYear = document.querySelector("#details-year");
const detailsPrice = document.querySelector("#details-price");
const detailsContact = document.querySelector(".details-contact");
let cars = [];

function closeMobileMenu() {
  navLinks.classList.remove("is-open");
  nav.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
}
menuButton.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  nav.classList.toggle("menu-open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

const options = {
  publicKey: EMAILJS_PUBLIC_KEY,
  // Do not allow headless browsers.
  blockHeadless: true,
  blockList: {
    // Block suspended email addresses.
    list: ["foo@emailjs.com", "bar@emailjs.com"],
    // The variable contains the email address.
    watchVariable: "userEmail",
  },
  limitRate: {
    // Set the limit rate for the application.
    id: "app",
    // Allow one request per 10 seconds.
    throttle: 10000,
  },
};
emailjs.init(options);

function priceFor(index) {
  return 28900 + index * 9200;
}
function renderSkeleton() {
  grid.innerHTML = Array.from(
    { length: 6 },
    (_, index) => `
      <article class="car-card skeleton-card" style="animation-delay:${index * 70}ms" aria-label="Loading vehicle">
        <div class="skeleton-block skeleton-image"></div>
        <div class="car-info">
          <div class="skeleton-block skeleton-year"></div>
          <div class="skeleton-block skeleton-title"></div>
          <div class="skeleton-block skeleton-meta"></div>
          <div class="skeleton-block skeleton-button"></div>
        </div>
      </article>`,
  ).join("");
  count.textContent = " (6)";
  empty.hidden = true;
}
function render(list) {
  grid.innerHTML = list
    .map(
      (car, index) => `
    <article class="car-card" style="animation-delay:${index * 70}ms">
      <div class="car-image" style="background-image:url('${imageUrls[index % imageUrls.length]}')"></div>
      <div class="car-info">
        <span class="car-year">${car.Model_Year || 2025} / ${car.Make_Name || "Toyota"}</span>
        <h3 class="car-name">${car.Model_Name}</h3>
        <div class="car-meta"><span>Available to explore</span><span class="car-price">$${priceFor(car.listingIndex ?? index).toLocaleString()}</span></div>
        <button class="details-button" type="button" data-car-index="${car.listingIndex ?? index}">View details</button>
      </div>
    </article>`,
    )
    .join("");
  count.textContent = ` (${list.length})`;
  empty.hidden = list.length !== 0;
}
function filterCars() {
  const query = searchInput.value.trim().toLowerCase();
  const priceQuery = query.replace(/[$,\s]/g, "");
  const maxPrice = Number(priceRange.value);
  const matches = cars.filter((car) => {
    const carPrice = priceFor(car.listingIndex);
    const nameMatches = `${car.Make_Name} ${car.Model_Name}`
      .toLowerCase()
      .includes(query);
    const priceMatches = String(carPrice).includes(priceQuery);

    return (
      (nameMatches || (priceQuery && priceMatches)) && carPrice <= maxPrice
    );
  });
  render(matches);
  status.textContent = query
    ? `Showing ${matches.length} result${matches.length === 1 ? "" : "s"} for "${searchInput.value.trim()}".`
    : "Showing live vehicle results from the NHTSA vehicle API.";
}
async function loadCars() {
  renderSkeleton();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();
    cars = data.Results.slice(0, 6).map((car, index) => ({
      ...car,
      listingIndex: index,
    }));
    status.textContent =
      "Showing 6 models pulled live from the NHTSA vehicle API.";
  } catch (error) {
    cars = fallbackCars.map((car, index) => ({ ...car, listingIndex: index }));
    status.textContent =
      "Showing six sample models while the vehicle API is unavailable.";
  }
  render(cars);
}
document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  filterCars();
  document.querySelector("#cars").scrollIntoView({ behavior: "smooth" });
});
searchInput.addEventListener("input", filterCars);
priceRange.addEventListener("input", filterCars);
function closeDetailsModal() {
  detailsModal.hidden = true;
  document.body.classList.remove("modal-open");
}
function openDetailsModal(car) {
  const listingIndex = car.listingIndex ?? 0;
  const carName = car.Model_Name || "Vehicle";
  detailsImage.style.backgroundImage = `url('${imageUrls[listingIndex % imageUrls.length]}')`;
  detailsTitle.textContent = carName;
  detailsMake.textContent = car.Make_Name || "Toyota";
  detailsYear.textContent = car.Model_Year || "2025";
  detailsPrice.textContent = `$${priceFor(listingIndex).toLocaleString()}`;
  detailsModal.hidden = false;
  document.body.classList.add("modal-open");
}
grid.addEventListener("click", (event) => {
  const detailsButton = event.target.closest("[data-car-index]");
  if (!detailsButton) return;
  const car = cars.find(
    (item) => String(item.listingIndex) === detailsButton.dataset.carIndex,
  );
  if (car) openDetailsModal(car);
});
detailsModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-details]")) closeDetailsModal();
});
function closeContactModal() {
  contactModal.hidden = true;
  document.body.classList.remove("modal-open");
  contactButton.focus();
}
contactButton.addEventListener("click", (event) => {
  event.preventDefault();
  contactModal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("#contact-name").focus();
});
detailsContact.addEventListener("click", (event) => {
  event.preventDefault();
  closeDetailsModal();
  contactModal.hidden = false;
  document.querySelector("#contact-name").focus();
});
closeContactButton.addEventListener("click", closeContactModal);
contactModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-contact]")) closeContactModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
  if (event.key === "Escape" && !contactModal.hidden) closeContactModal();
  if (event.key === "Escape" && !detailsModal.hidden) closeDetailsModal();
});
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  contactStatus.textContent = "Sending...";

  try {
    await emailjs.sendForm(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      contactForm,
    );
    contactStatus.textContent = "Message sent. Thank you!";
    contactForm.reset();
  } catch (error) {
    contactStatus.textContent =
      "Message could not be sent. Check your EmailJS settings.";
  }
});
loadCars();
