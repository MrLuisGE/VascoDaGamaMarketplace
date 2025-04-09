document.addEventListener("DOMContentLoaded", () => {
  // DOM references
  const grid = document.getElementById("shop-grid");
  const modal = document.getElementById("shop-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = modal.querySelector(".close-btn");

  // Floors
  const floorButtons = document.querySelectorAll(".filters button");

  // Pagination
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");

  // Filter modal
  const filterModal = document.getElementById("filter-modal");
  const openFilterBtn = document.querySelector(".filter-btn");
  const closeFilterBtn = document.getElementById("close-filter");
  const applyFilterBtn = document.getElementById("apply-filter");
  const resetFilterBtn = document.getElementById("reset-filter");
  const categoryContainer = document.getElementById("category-options");

  // Search modal
  const searchModal = document.getElementById("search-modal");
  const searchBtn = document.querySelector(".search-btn");
  const closeSearchBtn = document.getElementById("close-search");
  const searchInput = document.getElementById("search-input");
  const searchResultsContainer = document.getElementById("search-results");

  // Settings & contact
  const settingsModal = document.getElementById("settings-modal");
  const settingsBtn = document.querySelector(".settings-btn");
  const closeSettingsBtn = document.getElementById("close-settings");
  const sosModal = document.getElementById("sos-modal");
  const sosBtn = document.querySelector(".sos-btn");
  const closeSosBtn = document.getElementById("close-sos");

  // Data
  let allShops = [];
  let filteredShops = [];
  let currentFloorIndex = 0;

  // We'll store itemsPerPage, but it might change if in single-column
  let itemsPerPage = 6; // default for multi-col layout
  let currentPage = 1;
  let allCategories = new Set();

  // Load CSV
  Papa.parse("data/vasco_da_gama_shops.csv", {
    download: true,
    header: true,
    complete: (results) => {
      allShops = results.data;

      // gather categories
      allShops.forEach((shop) => {
        if (shop.categories) {
          shop.categories.split(",").forEach((c) => {
            allCategories.add(c.trim());
          });
        }
      });

      generateCategoryCheckboxes();
      checkInitialHash();
      adjustItemsPerPage();
    },
  });

  // Listen for window resizes so we can adjust items per page
  window.addEventListener("resize", () => {
    adjustItemsPerPage();
    renderCurrentPage(); 
  });

  function adjustItemsPerPage() {
    // If <400px wide (or any breakpoint you want) => 3 items
    // else => 6 items
    if (window.innerWidth < 400) {
      itemsPerPage = 3;
    } else {
      itemsPerPage = 6;
    }
    // If you also want to factor in height constraints, you can:
    // if (window.innerHeight < 650) itemsPerPage = 3;
    // else itemsPerPage = 6;
  }

  function checkInitialHash() {
    const hash = window.location.hash.replace("#", "");
    const validFloors = Array.from(floorButtons).map((btn) =>
      btn.getAttribute("data-floor")
    );
    if (validFloors.includes(hash)) {
      setActiveFloor(hash);
    } else {
      setActiveFloor("0");
    }
  }

  function generateCategoryCheckboxes() {
    categoryContainer.innerHTML = "";
    [...allCategories].sort().forEach((cat) => {
      const id = `cat-${cat.replace(/\s+/g, "-").toLowerCase()}`;
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" name="category" value="${cat}" id="${id}"> ${cat}
      `;
      categoryContainer.appendChild(label);
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

    const floorShops = allShops.filter((shop) => shop.floor === floor);
    filteredShops = applyAllFilters(floorShops);

    currentPage = 1;
    renderCurrentPage();
    window.location.hash = "#" + floor;
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
      const isOpen = (shop.status === "Open");
      const priceCount = shop.price ? parseInt(shop.price, 10) : 1;
      const priceIcons = "$".repeat(priceCount);

      const card = document.createElement("div");
      card.className = "shop-card";

      card.innerHTML = `
        <div class="shop-card-header">
          <img 
            src="${shop.favicon_url || 'img/default.png'}" 
            alt="${shop.shop_name || ''}"
            class="shop-image" 
          />
          <div class="price-icon">${priceIcons}</div>
        </div>
        <div class="shop-info">
          <h3>${shop.shop_name || ''}</h3>
          <div class="rating-stars">
            ${renderStars(shop.rating)}
            <span class="reviews">(${shop.reviews || 0})</span>
          </div>
          <div class="shop-status-floor ${isOpen ? "" : "closed"}">
            ${isOpen ? "Aberto" : "Encerrado"} - Piso ${shop.floor}
          </div>
          <div class="tag-container">
            ${(shop.categories || "")
              .split(",")
              .map((c) => `<span class="tag">${c.trim()}</span>`)
              .join("")}
          </div>
        </div>
      `;
      card.addEventListener("click", () => openModal(shop, isOpen));
      grid.appendChild(card);
    });
  }

  function renderStars(rating) {
    const r = parseFloat(rating) || 0;
    const fullStars = Math.floor(r);
    const halfStar = r - fullStars >= 0.5;
    let stars = "★".repeat(fullStars);
    if (halfStar) stars += "½";
    return stars.padEnd(5, "☆");
  }

  function openModal(shop, isOpen) {
    const weeklyHours = shop.hours ? JSON.parse(shop.hours) : {};
    const categories = shop.categories ? shop.categories.split(",") : [];
    const socials = shop.social ? shop.social.split(",") : [];

    modalBody.innerHTML = `
      <div class="modal-header">
        <img 
          src="${shop.favicon_url || 'img/default.png'}"
          alt="${shop.shop_name || ''}" 
          class="modal-logo" 
        />
        <div>
          <h2>${shop.shop_name || ''}</h2>
          <p class="modal-subtitle">
            <span class="${isOpen ? "open" : "closed"}">${shop.status || ''}</span>
            • Piso ${shop.floor}
          </p>
        </div>
      </div>

      <div class="modal-section">
        <p class="hours-status">
          <span class="${isOpen ? "open" : "closed"}">${shop.status || ''}</span>
          • Closes 12 a.m.
        </p>
        <ul class="hours-list">
          ${Object.entries(weeklyHours)
            .map(([day, hours]) => 
              `<li><strong>${day}</strong><span>${hours}</span></li>`
            )
            .join("")}
        </ul>
      </div>

      <div class="modal-section">
        <h4>Categories</h4>
        <div class="tag-container">
          ${categories.map((c) => `<span class="tag">${c.trim()}</span>`).join("")}
        </div>
      </div>

      <div class="modal-section">
        <p>Please see the store detail page for more info. (Placeholder)</p>
      </div>

      <div class="modal-section">
        <button class="direction-btn">Order on Skipy</button>
      </div>

      <div class="modal-footer">
        <a href="tel:${shop.phone || ''}" class="contact-icon">📞</a>
        ${
          socials
            .map(
              (link) => `<a href="https://${link.trim()}" target="_blank" class="contact-icon">🔗</a>`
            )
            .join("")
        }
      </div>
    `;

    modal.classList.remove("hidden");
  }

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  // Floor events
  floorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveFloor(btn.getAttribute("data-floor"));
    });
  });

  // Pagination
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

  // Swipe logic
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  });
  document.addEventListener("touchend", (e) => {
    if (e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 30) return;

      if (absDx > absDy) {
        // left/right => pagination
        if (dx < 0 && currentPage * itemsPerPage < filteredShops.length) {
          currentPage++;
          renderCurrentPage();
        } else if (dx > 0 && currentPage > 1) {
          currentPage--;
          renderCurrentPage();
        }
      } else {
        // up/down => floors
        if (dy > 0 && currentFloorIndex > 0) {
          const prevFloor = floorButtons[currentFloorIndex - 1].getAttribute("data-floor");
          setActiveFloor(prevFloor);
        } else if (dy < 0 && currentFloorIndex < floorButtons.length - 1) {
          const nextFloor = floorButtons[currentFloorIndex + 1].getAttribute("data-floor");
          setActiveFloor(nextFloor);
        }
      }
    }
  });

  // Filter
  openFilterBtn?.addEventListener("click", () => filterModal.classList.remove("hidden"));
  closeFilterBtn?.addEventListener("click", () => filterModal.classList.add("hidden"));
  applyFilterBtn?.addEventListener("click", () => {
    const currentFloor = floorButtons[currentFloorIndex].getAttribute("data-floor");
    const floorShops = allShops.filter((shop) => shop.floor === currentFloor);
    filteredShops = applyAllFilters(floorShops);
    currentPage = 1;
    renderCurrentPage();
    filterModal.classList.add("hidden");
  });
  resetFilterBtn?.addEventListener("click", () => {
    document.querySelectorAll('#filter-modal input[type="checkbox"], input[type="radio"]')
      .forEach((inp) => {
        if (inp.type === "radio") {
          inp.checked = (inp.value === "all");
        } else {
          inp.checked = false;
        }
      });
  });

  function applyAllFilters(shops) {
    const selectedStatus = document.querySelector('input[name="status"]:checked')?.value || "all";
    const selectedPrices = Array.from(document.querySelectorAll('input[name="price"]:checked')).map(cb => cb.value);
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);

    return shops.filter((shop) => {
      const statusMatch = (selectedStatus === "all" || shop.status === selectedStatus);
      const priceMatch = (selectedPrices.length === 0 || selectedPrices.includes(shop.price));
      const shopCats = shop.categories ? shop.categories.split(",").map(c => c.trim()) : [];
      const catMatch = (selectedCategories.length === 0 || selectedCategories.some(cat => shopCats.includes(cat)));
      return statusMatch && priceMatch && catMatch;
    });
  }

  // Search
  searchBtn.addEventListener("click", () => {
    searchModal.classList.remove("hidden");
    searchInput.value = "";
    searchResultsContainer.innerHTML = "";
  });
  closeSearchBtn.addEventListener("click", () => {
    searchModal.classList.add("hidden");
  });
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    searchResultsContainer.innerHTML = "";
    if (!query) return;

    const results = allShops.filter((shop) => {
      const name = (shop.shop_name || "").toLowerCase();
      const cats = (shop.categories || "").toLowerCase();
      return name.includes(query) || cats.includes(query);
    });

    if (results.length === 0) {
      searchResultsContainer.innerHTML = "<p>No results found.</p>";
      return;
    }
    results.forEach((shop) => {
      const isOpen = shop.status === "Open";
      const div = document.createElement("div");
      div.className = "search-result";
      div.innerHTML = `
        <img src="${shop.favicon_url || 'img/default.png'}" alt="${shop.shop_name || ''}" />
        <div>
          <h4>${shop.shop_name || ''}</h4>
          <p>${isOpen ? "Aberto" : "Encerrado"} - Piso ${shop.floor}</p>
        </div>
      `;
      div.addEventListener("click", () => {
        searchModal.classList.add("hidden");
        openModal(shop, isOpen);
      });
      searchResultsContainer.appendChild(div);
    });
  });

  // Settings & SOS
  settingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
  });
  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });
  sosBtn.addEventListener("click", () => {
    sosModal.classList.remove("hidden");
  });
  closeSosBtn.addEventListener("click", () => {
    sosModal.classList.add("hidden");
  });
});
