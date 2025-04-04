document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("shop-grid");
  const modal = document.getElementById("shop-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");
  const floorButtons = document.querySelectorAll(".filters button");
  const floorLabel = document.getElementById("floor-label");

  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");

  // Filter modal
  const filterModal = document.getElementById("filter-modal");
  const openFilterBtn = document.querySelector(".sidebar-top .icon-btn");
  const closeFilterBtn = document.getElementById("close-filter");
  const applyFilterBtn = document.getElementById("apply-filter");
  const resetFilterBtn = document.getElementById("reset-filter");
  const categoryContainer = document.getElementById("category-options");

  let allShops = [];
  let filteredShops = [];
  let currentPage = 1;
  const itemsPerPage = 6;

  let currentFloorIndex = 0;
  let allCategories = new Set();

  Papa.parse("data/vasco_da_gama_shops.csv", {
    download: true,
    header: true,
    complete: (results) => {
      allShops = results.data;

      // Build unique categories
      allShops.forEach((shop) => {
        (shop.categories?.split(",") || []).forEach((cat) =>
          allCategories.add(cat.trim())
        );
      });

      generateCategoryCheckboxes();
      setActiveFloor("0");
    },
  });

  function generateCategoryCheckboxes() {
    categoryContainer.innerHTML = "";
    [...allCategories].sort().forEach((cat) => {
      const id = `cat-${cat.replace(/\s+/g, "-").toLowerCase()}`;
      const checkbox = document.createElement("label");
      checkbox.innerHTML = `
        <input type="checkbox" name="category" value="${cat}" id="${id}"> ${cat}
      `;
      categoryContainer.appendChild(checkbox);
      categoryContainer.appendChild(document.createElement("br"));
    });
  }

  function setActiveFloor(floor) {
    floorButtons.forEach((btn, index) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-floor") === floor) {
        btn.classList.add("active");
        currentFloorIndex = index;
      }
    });

    const floorShops = allShops.filter((shop) => shop.floor == floor);
    filteredShops = applyAllFilters(floorShops);
    currentPage = 1;
    renderCurrentPage();

    if (floorLabel) {
      floorLabel.textContent = `Floor ${floor}`;
    }
  }

  function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const shopsOnPage = filteredShops.slice(startIndex, endIndex);

    renderShops(shopsOnPage);

    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(
      filteredShops.length / itemsPerPage
    )}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = endIndex >= filteredShops.length;
  }

  function renderShops(shops) {
    grid.innerHTML = "";
    shops.forEach((shop) => {
      const isOpen = shop.status === "Open";
      const priceIcons = "$".repeat(shop.price);
      const categories = shop.categories?.split(",").map((cat) => cat.trim()) || [];

      const card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = `
        <div class="shop-card-header">
          <img src="${shop.favicon_url}" alt="${shop.shop_name}" class="shop-image" />
          <button class="heart-btn">♡</button>
        </div>
        <div class="shop-info">
          <h3>${shop.shop_name}</h3>
          <div class="rating-stars">
            ${renderStars(shop.rating)}
            <span class="reviews">(${shop.reviews})</span>
          </div>
          <div class="shop-meta">
            <span class="price">${priceIcons}</span>
          </div>
          <div class="shop-status ${isOpen ? "open" : "closed"}">
            ${isOpen ? "Aberto" : "Fechado"}
          </div>
          <div class="tag-container">
            ${categories.map((cat) => `<span class="tag">${cat}</span>`).join("")}
          </div>
        </div>
      `;

      card.addEventListener("click", () => openModal(shop, isOpen));

      card.querySelector(".heart-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        e.target.classList.toggle("favorited");
        e.target.textContent = e.target.classList.contains("favorited") ? "♥" : "♡";
      });

      grid.appendChild(card);
    });
  }

  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    let stars = "★".repeat(fullStars);
    if (halfStar) stars += "½";
    return stars.padEnd(5, "☆");
  }

  function openModal(shop, isOpen) {
    const weeklyHours = JSON.parse(shop.hours || "{}");
    const categories = shop.categories?.split(",") || [];
    const socials = shop.social?.split(",") || [];

    modalBody.innerHTML = `
      <div class="modal-header">
        <img src="${shop.favicon_url}" alt="${shop.shop_name}" class="modal-logo" />
        <div>
          <h2>${shop.shop_name}</h2>
          <p class="modal-subtitle">
            Floor ${shop.floor} •
            <span class="${isOpen ? "open" : "closed"}">${shop.status}</span>
          </p>
        </div>
      </div>

      <div class="modal-section">
        <p class="hours-status">
          <span class="${isOpen ? "open" : "closed"}">${shop.status}</span>
          • Closes 12 a.m.
        </p>
        <ul class="hours-list">
          ${Object.entries(weeklyHours)
            .map(([day, hours]) => `<li><strong>${day}</strong><span>${hours}</span></li>`)
            .join("")}
        </ul>
      </div>

      <div class="modal-section">
        <h4>Categories</h4>
        <div class="tag-container">
          ${categories.map((cat) => `<span class="tag">${cat.trim()}</span>`).join("")}
        </div>
      </div>

      <div class="modal-section">
        <p>Please see the store detail page for more info.</p>
      </div>

      <div class="modal-section">
        <button class="direction-btn">Order on Skipy</button>
      </div>

      <div class="modal-footer">
        <a href="tel:${shop.phone}" class="contact-icon">📞</a>
        ${socials
          .map(
            (link) =>
              `<a href="https://${link.trim()}" target="_blank" class="contact-icon">🔗</a>`
          )
          .join("")}
      </div>
    `;

    modal.classList.remove("hidden");
  }

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  floorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveFloor(btn.getAttribute("data-floor"));
    });
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage * itemsPerPage < filteredShops.length) {
      currentPage++;
      renderCurrentPage();
    }
  });

  // Swipe support
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 30) return;

    if (absDx > absDy) {
      if (dx < 0 && currentPage * itemsPerPage < filteredShops.length) {
        currentPage++;
        renderCurrentPage();
      } else if (dx > 0 && currentPage > 1) {
        currentPage--;
        renderCurrentPage();
      }
    } else {
      if (dy > 0 && currentFloorIndex > 0) {
        const prevFloor = floorButtons[currentFloorIndex - 1].getAttribute("data-floor");
        setActiveFloor(prevFloor);
      } else if (dy < 0 && currentFloorIndex < floorButtons.length - 1) {
        const nextFloor = floorButtons[currentFloorIndex + 1].getAttribute("data-floor");
        setActiveFloor(nextFloor);
      }
    }
  });

  // Filter modal open/close
  openFilterBtn?.addEventListener("click", () => filterModal?.classList.remove("hidden"));
  closeFilterBtn?.addEventListener("click", () => filterModal?.classList.add("hidden"));
  applyFilterBtn?.addEventListener("click", () => {
    const currentFloor = floorButtons[currentFloorIndex].getAttribute("data-floor");
    const floorShops = allShops.filter((shop) => shop.floor == currentFloor);
    filteredShops = applyAllFilters(floorShops);
    currentPage = 1;
    renderCurrentPage();
    filterModal?.classList.add("hidden");
  });

  resetFilterBtn?.addEventListener("click", () => {
    document.querySelectorAll('#filter-modal input[type="checkbox"], input[type="radio"]').forEach((input) => {
      input.checked = input.type === "radio" && input.value === "all";
    });
  });

  function applyAllFilters(shops) {
    const selectedStatus = document.querySelector('input[name="status"]:checked')?.value || "all";
    const selectedPrices = Array.from(document.querySelectorAll('input[name="price"]:checked')).map(cb => cb.value);
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);

    return shops.filter((shop) => {
      const matchesStatus = selectedStatus === "all" || shop.status === selectedStatus;
      const matchesPrice = selectedPrices.length === 0 || selectedPrices.includes(shop.price);
      const shopCats = shop.categories?.split(",").map((c) => c.trim()) || [];
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.some((cat) => shopCats.includes(cat));
      return matchesStatus && matchesPrice && matchesCategory;
    });
  }
});
