import { fetchPopular, fetchTrending, searchMovies } from "./api.js";
import {
  createSkeletonRow,
  renderEmptyState,
  renderHero,
  renderMovieRow,
  renderSearchGrid,
} from "./ui.js";

/* =========================
   🔥 DETECCIÓN TV
========================= */

function isTVDevice() {
  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes("smart-tv") ||
    ua.includes("smarttv") ||
    ua.includes("googletv") ||
    ua.includes("appletv") ||
    ua.includes("hbbtv") ||
    ua.includes("netcast") ||
    ua.includes("tizen") ||
    ua.includes("firetv") ||
    ua.includes("aft") ||
    ua.includes("android tv") ||
    ua.includes("silk")
  );
}

const IS_TV = isTVDevice();

/* ========================= */

const EXPAND_DELAY_MS = 100;

const state = {
  language: "es-MX",
  trending: [],
  popular: [],
  featured: null,
  searchTimer: null,
  searchRequestId: 0,

  focusTimer: null,
  lastFocusedButton: null,
  lastBrowseFocus: null,
  lastBrowseScrollY: 0,
};

const elements = {
  brandLink: document.getElementById("brandLink"),
  searchInput: document.getElementById("searchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  languageSelect: document.getElementById("languageSelect"),

  heroTitle: document.getElementById("heroTitle"),
  heroMeta: document.getElementById("heroMeta"),
  heroDescription: document.getElementById("heroDescription"),
  heroBackdrop: document.getElementById("heroBackdrop"),
  heroPlayBtn: document.getElementById("heroPlayBtn"),
  heroInfoBtn: document.getElementById("heroInfoBtn"),

  trendingRow: document.getElementById("trendingRow"),
  popularRow: document.getElementById("popularRow"),

  searchPanel: document.getElementById("searchPanel"),
  searchResultsGrid: document.getElementById("searchResultsGrid"),
  searchEmptyState: document.getElementById("searchEmptyState"),
  searchSummary: document.getElementById("searchSummary"),
};

/* =========================
   🔥 TV MODE
========================= */

function enableTVMode() {
  document.body.classList.add("tv-mode");

  // quitar cursor
  document.body.style.cursor = "none";

  // bloquear mouse
  document.addEventListener("mousemove", (e) => {
    e.stopPropagation();
  });

  // bloquear scroll con wheel
  document.addEventListener("wheel", (e) => {
    e.preventDefault();
  }, { passive: false });
}

/* ========================= */

function isMovieCardButton(element) {
  return !!element && element.classList?.contains("media-card__button");
}

function getAllBrowseRows() {
  return Array.from(document.querySelectorAll(".media-row"));
}

function clearExpandedCards() {
  document.querySelectorAll(".media-card.expanded").forEach((card) => {
    card.classList.remove("expanded");
  });
}

function clearFocusTimer() {
  if (state.focusTimer) {
    clearTimeout(state.focusTimer);
    state.focusTimer = null;
  }
}

function focusButton(button, options = {}) {
  if (!button) return;

  const { preventScroll = false, center = true } = options;

  button.focus({ preventScroll });

  if (center) {
    button.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }
}

function startExpandTimer(button) {
  clearFocusTimer();
  clearExpandedCards();

  if (!isMovieCardButton(button)) return;

  state.focusTimer = setTimeout(() => {
    const card = button.closest(".media-card");
    if (card && document.activeElement === button) {
      card.classList.add("expanded");
      card.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, EXPAND_DELAY_MS);
}

function updateHero(movie) {
  state.featured = movie;
  renderHero(movie, elements);
}

function rememberBrowsePosition() {
  if (isMovieCardButton(state.lastFocusedButton)) {
    state.lastBrowseFocus = state.lastFocusedButton;
    state.lastBrowseScrollY = window.scrollY;
  }
}

function restoreBrowsePosition() {
  if (!isMovieCardButton(state.lastBrowseFocus)) return;

  focusButton(state.lastBrowseFocus, { preventScroll: true, center: false });

  window.scrollTo({
    top: state.lastBrowseScrollY,
    behavior: "smooth",
  });

  setTimeout(() => {
    focusButton(state.lastBrowseFocus, { preventScroll: true, center: true });
  }, 220);
}

function handleMovieSelect(movie) {
  rememberBrowsePosition();
  updateHero(movie);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  setTimeout(() => {
    elements.heroPlayBtn.focus({ preventScroll: true });
  }, 320);
}

function setLoadingRows() {
  elements.trendingRow.innerHTML = "";
  elements.popularRow.innerHTML = "";
  elements.trendingRow.appendChild(createSkeletonRow());
  elements.popularRow.appendChild(createSkeletonRow());
}

function focusFirstAvailableCard() {
  const firstCardButton = document.querySelector(".media-row .media-card__button");
  if (firstCardButton) {
    focusButton(firstCardButton);
  }
}

async function loadHome() {
  try {
    setLoadingRows();

    const [trendingData, popularData] = await Promise.all([
      fetchTrending(state.language),
      fetchPopular(state.language),
    ]);

    state.trending = Array.isArray(trendingData?.results) ? trendingData.results : [];
    state.popular = Array.isArray(popularData?.results) ? popularData.results : [];

    const featuredMovie = state.trending[0] || state.popular[0];

    if (featuredMovie) {
      updateHero(featuredMovie);
    }

    renderMovieRow(elements.trendingRow, state.trending, handleMovieSelect);
    renderMovieRow(elements.popularRow, state.popular, handleMovieSelect);

    if (IS_TV) {
      setTimeout(() => {
        focusFirstAvailableCard();
      }, 200);
    }
  } catch (error) {
    console.error(error);
  }
}

/* =========================
   🔥 NAVEGACIÓN
========================= */

function getAdjacentRow(currentRow, direction) {
  const allRows = getAllBrowseRows();
  const rowIndex = allRows.indexOf(currentRow);

  if (direction === "down") return allRows[rowIndex + 1] || null;
  if (direction === "up") return allRows[rowIndex - 1] || null;

  return null;
}

function handleCardNavigation(active, key) {
  const currentCard = active.closest(".media-card");
  const currentRow = active.closest(".media-row");

  const cards = Array.from(currentRow.querySelectorAll(".media-card"));
  const index = cards.indexOf(currentCard);

  if (key === "ArrowRight") {
    const next = cards[index + 1]?.querySelector("button");
    if (next) return focusButton(next), true;
  }

  if (key === "ArrowLeft") {
    const prev = cards[index - 1]?.querySelector("button");
    if (prev) return focusButton(prev), true;
  }

  if (key === "ArrowDown") {
    const row = getAdjacentRow(currentRow, "down");
    if (row) {
      const btn = row.querySelector("button");
      if (btn) return focusButton(btn), true;
    }
  }

  if (key === "ArrowUp") {
    const row = getAdjacentRow(currentRow, "up");
    if (row) {
      const btn = row.querySelector("button");
      if (btn) return focusButton(btn), true;
    } else {
      elements.heroPlayBtn.focus();
      return true;
    }
  }

  if (key === "Enter") {
    active.click();
    return true;
  }

  return false;
}

/* ========================= */

function bindEvents() {
  document.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    if (!active) return;

    const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Enter"];
    if (!keys.includes(event.key)) return;

    if (active === elements.searchInput) return;

    if (isMovieCardButton(active)) {
      if (handleCardNavigation(active, event.key)) {
        event.preventDefault();
      }
    }
  });

  document.addEventListener("focusin", (e) => {
    if (isMovieCardButton(e.target)) {
      startExpandTimer(e.target);
    }
  });
}

/* ========================= */

function init() {
  elements.languageSelect.value = state.language;

  if (IS_TV) {
    enableTVMode();
  }

  bindEvents();
  loadHome();
}

init();