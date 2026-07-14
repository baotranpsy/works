const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const pageLinks = document.querySelectorAll("[data-page]");
const sections = document.querySelectorAll("[data-section]");
const publicationFilterButtons = document.querySelectorAll("[data-filter-group]");
const publicationItems = document.querySelectorAll(".publication-item");
const publicationYearGroups = document.querySelectorAll("[data-year-group]");
const themeToggle = document.querySelector(".theme-toggle");
const siteSearch = document.querySelector("#site-search");
let collaborationMap;
let collaborationTileLayer;

const mapTiles = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

const publicationFilters = {
  type: "all",
  year: "all",
  role: "all",
};

function showPage(pageId, updateHash = true) {
  sections.forEach((section) => {
    section.classList.toggle("active-section", section.dataset.section === pageId);
  });

  pageLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageId && link.classList.contains("brand") === false);
  });

  navLinks.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");

  if (updateHash) {
    history.pushState(null, "", `#${pageId}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageId === "publications") {
    window.setTimeout(initCollaborationMap, 140);
  }

}

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(link.dataset.page);
  });
});

publicationFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.dataset.filterGroup || "type";
    const filter = button.dataset.filter;
    publicationFilters[group] = filter;

    publicationFilterButtons.forEach((item) => {
      if ((item.dataset.filterGroup || "type") === group) {
        item.classList.remove("active");
      }
    });
    button.classList.add("active");

    publicationItems.forEach((item) => {
      const typeMatch = publicationFilters.type === "all" || item.dataset.type === publicationFilters.type;
      const yearMatch = publicationFilters.year === "all" || item.dataset.year === publicationFilters.year;
      const roleMatch = publicationFilters.role === "all" || item.dataset.role === publicationFilters.role;
      const shouldShow = typeMatch && yearMatch && roleMatch;
      item.classList.toggle("hidden", !shouldShow);
    });

    publicationYearGroups.forEach((group) => {
      const hasVisibleItems = group.querySelectorAll(".publication-item:not(.hidden)").length > 0;
      group.classList.toggle("hidden", !hasVisibleItems);
    });
  });
});


siteSearch?.addEventListener("input", () => {
  const query = siteSearch.value.trim().toLowerCase();
  if (!query) return;

  const matchingSection = Array.from(sections).find((section) =>
    section.textContent.toLowerCase().includes(query)
  );

  if (matchingSection) {
    showPage(matchingSection.dataset.section);
  }
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  }
  updateMapTheme(theme);
}

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme || "light";
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

function initCollaborationMap() {
  if (collaborationMap || typeof L === "undefined" || !document.querySelector("#collaboration-map")) return;

  const collaborators = [
    {
      name: "Ho Chi Minh City, Vietnam",
      coords: [10.8231, 106.6297],
      affiliation:
        "<strong>Ho Chi Minh City research network</strong><br>Vinh-Long Tran-Chi, Son Van Huynh, Vu Hoang Anh Nguyen, Cong Minh Le, and psychology/education collaborators.",
    },
    {
      name: "Taipei, Taiwan",
      coords: [25.033, 121.5654],
      affiliation:
        "<strong>GIMBC, Taipei Medical University</strong><br>Current academic network and The Brain State Lab affiliation.",
    },
    {
      name: "Singapore",
      coords: [1.3521, 103.8198],
      affiliation:
        "<strong>Singapore research network</strong><br>Cyrus Su Hui Ho and psychiatry/mental health research collaborators.",
    },
    {
      name: "Bangkok, Thailand",
      coords: [13.7563, 100.5018],
      affiliation:
        "<strong>Bangkok conference network</strong><br>Thailand-based conference presentations and regional public health psychology collaborators.",
    },
  ];

  collaborationMap = L.map("collaboration-map", {
    scrollWheelZoom: false,
    worldCopyJump: true,
  });

  const activeTheme = document.documentElement.dataset.theme || "light";
  collaborationTileLayer = L.tileLayer(mapTiles[activeTheme].url, {
    maxZoom: 19,
    attribution: mapTiles[activeTheme].attribution,
  }).addTo(collaborationMap);

  const markerGroup = L.featureGroup().addTo(collaborationMap);
  collaborators.forEach((collaborator) => {
    L.marker(collaborator.coords)
      .bindPopup(`<strong>${collaborator.name}</strong><br>${collaborator.affiliation}`)
      .addTo(markerGroup);
  });

  collaborationMap.fitBounds(markerGroup.getBounds().pad(0.24));
  window.setTimeout(() => collaborationMap.invalidateSize(), 150);
}

function updateMapTheme(theme) {
  if (collaborationMap && collaborationTileLayer) {
    collaborationMap.removeLayer(collaborationTileLayer);
    collaborationTileLayer = L.tileLayer(mapTiles[theme].url, {
      maxZoom: 19,
      attribution: mapTiles[theme].attribution,
    }).addTo(collaborationMap);
  }

}

window.addEventListener("popstate", () => {
  const pageId = window.location.hash.replace("#", "") || "about";
  showPage(pageId, false);
});

const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);

const initialPage = window.location.hash.replace("#", "") || "about";
showPage(initialPage, false);
