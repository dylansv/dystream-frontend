import { fetchPopular, fetchTrending, searchMovies } from "./api.js";
import {
  createSkeletonRow,
  renderEmptyState,
  renderHero,
  renderMovieRow,
  renderSearchGrid,
} from "./ui.js";

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

    setTimeout(() => {
      focusFirstAvailableCard();
    }, 350);
  } catch (error) {
    console.error(error);

    elements.trendingRow.innerHTML = "";
    elements.popularRow.innerHTML = "";

    const message1 = document.createElement("div");
    message1.className = "empty-state";
    message1.textContent = "No se pudo cargar el catálogo. Revisa que el backend esté corriendo.";

    const message2 = message1.cloneNode(true);

    elements.trendingRow.appendChild(message1);
    elements.popularRow.appendChild(message2);
  }
}

function resetSearchView() {
  elements.searchPanel.classList.add("hidden");
  elements.searchResultsGrid.innerHTML = "";
  elements.searchEmptyState.classList.add("hidden");
  elements.searchSummary.textContent = "Escribe al menos 3 caracteres para buscar.";
  elements.clearSearchBtn.classList.add("hidden");
}

async function performSearch(query) {
  const requestId = ++state.searchRequestId;

  try {
    elements.searchPanel.classList.remove("hidden");
    elements.searchResultsGrid.innerHTML = "";
    elements.searchEmptyState.classList.add("hidden");
    elements.searchSummary.textContent = `Buscando: "${query}"...`;

    const data = await searchMovies(query, state.language);

    if (requestId !== state.searchRequestId) return;

    const results = Array.isArray(data?.results) ? data.results : [];

    if (!results.length) {
      elements.searchResultsGrid.innerHTML = "";
      elements.searchEmptyState.classList.remove("hidden");
      renderEmptyState(
        elements.searchEmptyState,
        `No encontré resultados para "${query}".`
      );
      elements.searchSummary.textContent = "0 resultados";
      return;
    }

    renderSearchGrid(elements.searchResultsGrid, results, handleMovieSelect);
    elements.searchSummary.textContent = `${results.length} resultado(s) encontrados`;
  } catch (error) {
    if (requestId !== state.searchRequestId) return;

    console.error(error);
    elements.searchResultsGrid.innerHTML = "";
    elements.searchEmptyState.classList.remove("hidden");
    renderEmptyState(
      elements.searchEmptyState,
      "Ocurrió un error al buscar. Verifica que la API esté disponible."
    );
    elements.searchSummary.textContent = "Error de búsqueda";
  }
}

function onSearchInput(event) {
  const query = event.target.value.trim();

  if (query.length > 0) {
    elements.clearSearchBtn.classList.remove("hidden");
  } else {
    elements.clearSearchBtn.classList.add("hidden");
  }

  clearTimeout(state.searchTimer);

  if (query.length < 3) {
    state.searchRequestId += 1;
    resetSearchView();
    return;
  }

  state.searchTimer = setTimeout(() => {
    performSearch(query);
  }, 280);
}

function onLanguageChange(event) {
  state.language = event.target.value;
  const currentQuery = elements.searchInput.value.trim();

  loadHome();

  if (currentQuery.length >= 3) {
    performSearch(currentQuery);
  } else {
    resetSearchView();
  }
}

function getAdjacentRow(currentRow, direction) {
  const allRows = getAllBrowseRows();
  const rowIndex = allRows.indexOf(currentRow);

  if (rowIndex === -1) return null;

  if (direction === "down") {
    return allRows[rowIndex + 1] || null;
  }

  if (direction === "up") {
    return allRows[rowIndex - 1] || null;
  }

  return null;
}

function handleCardNavigation(active, key) {
  const currentCard = active.closest(".media-card");
  const currentRow = active.closest(".media-row");

  if (!currentCard || !currentRow) return false;

  const cards = Array.from(currentRow.querySelectorAll(".media-card"));
  const index = cards.indexOf(currentCard);

  if (index === -1) return false;

  if (key === "ArrowRight") {
    const next = cards[index + 1]?.querySelector(".media-card__button");
    if (next) {
      focusButton(next);
      return true;
    }
  }

  if (key === "ArrowLeft") {
    const prev = cards[index - 1]?.querySelector(".media-card__button");
    if (prev) {
      focusButton(prev);
      return true;
    }
  }

  if (key === "ArrowDown") {
    const nextRow = getAdjacentRow(currentRow, "down");
    if (nextRow) {
      const nextCards = Array.from(nextRow.querySelectorAll(".media-card"));
      const targetCard = nextCards[index] || nextCards[nextCards.length - 1];
      const targetButton = targetCard?.querySelector(".media-card__button");

      if (targetButton) {
        focusButton(targetButton);
        return true;
      }
    }
  }

  if (key === "ArrowUp") {
    const prevRow = getAdjacentRow(currentRow, "up");
    if (prevRow) {
      const prevCards = Array.from(prevRow.querySelectorAll(".media-card"));
      const targetCard = prevCards[index] || prevCards[prevCards.length - 1];
      const targetButton = targetCard?.querySelector(".media-card__button");

      if (targetButton) {
        focusButton(targetButton);
        return true;
      }
    } else {
      elements.heroPlayBtn.focus({ preventScroll: true });
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return true;
    }
  }

  if (key === "Enter") {
    active.click();
    return true;
  }

  return false;
}

function handleHeroNavigation(active, key) {
  const isHeroButton =
    active === elements.heroPlayBtn || active === elements.heroInfoBtn;

  if (!isHeroButton) return false;

  if (key === "ArrowRight" && active === elements.heroPlayBtn) {
    elements.heroInfoBtn.focus({ preventScroll: true });
    return true;
  }

  if (key === "ArrowLeft" && active === elements.heroInfoBtn) {
    elements.heroPlayBtn.focus({ preventScroll: true });
    return true;
  }

  if (key === "ArrowDown") {
    restoreBrowsePosition();
    return true;
  }

  if (key === "Enter") {
    active.click();
    return true;
  }

  return false;
}

function bindEvents() {
  elements.searchInput.addEventListener("input", onSearchInput);

  elements.clearSearchBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    state.searchRequestId += 1;
    resetSearchView();
    elements.searchInput.focus();
  });

  elements.languageSelect.addEventListener("change", onLanguageChange);

  elements.brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    elements.searchInput.value = "";
    state.searchRequestId += 1;
    resetSearchView();

    if (state.featured) {
      updateHero(state.featured);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  elements.heroPlayBtn.addEventListener("click", () => {
    if (!state.featured) return;

    const id = state.featured.id;
    const type = state.featured.media_type || "movie";

    window.location.href = `/player.html?id=${id}&type=${type}`;
   });

  elements.heroInfoBtn.addEventListener("click", () => {
    alert("Mi Lista llegará en una siguiente fase.");
  });

  document.addEventListener("focusin", (event) => {
    const target = event.target;

    if (!isMovieCardButton(target)) return;

    state.lastFocusedButton = target;
    startExpandTimer(target);
  });

  document.addEventListener("focusout", (event) => {
    if (!isMovieCardButton(event.target)) return;

    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (isMovieCardButton(active) && active !== event.target) return;

      clearFocusTimer();
      clearExpandedCards();
    });
  });

  document.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    if (!active) return;

    const navigationKeys = [
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
      "ArrowDown",
      "Enter",
    ];

    if (!navigationKeys.includes(event.key)) return;

    if (active === elements.searchInput) return;
    if (active === elements.languageSelect) return;

    let handled = false;

    if (isMovieCardButton(active)) {
      handled = handleCardNavigation(active, event.key);
    } else {
      handled = handleHeroNavigation(active, event.key);
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

function init() {
  elements.languageSelect.value = state.language;
  bindEvents();
  resetSearchView();
  loadHome();
}

init();