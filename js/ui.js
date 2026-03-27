import { getBackdropUrl, getPosterUrl } from "./api.js";

function safeText(value, fallback = "") {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function getMovieTitle(movie) {
  return (
    safeText(movie?.title) ||
    safeText(movie?.name) ||
    safeText(movie?.original_title) ||
    "Untitled"
  );
}

function getMovieYear(movie) {
  const rawDate = movie?.release_date || movie?.first_air_date || "";
  if (!rawDate) return "N/D";
  return rawDate.slice(0, 4) || "N/D";
}

function getVote(movie) {
  const vote = Number(movie?.vote_average || 0);
  return vote > 0 ? vote.toFixed(1) : "N/A";
}

function truncate(text, maxLength = 220) {
  const value = safeText(text);
  if (!value) return "Sin descripción disponible por el momento.";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}…`;
}

function createMetaItem(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

export function createSkeletonRow(count = 7) {
  const wrapper = document.createElement("div");
  wrapper.className = "row-loading";

  for (let i = 0; i < count; i += 1) {
    const item = document.createElement("div");
    item.className = "skeleton-card";
    wrapper.appendChild(item);
  }

  return wrapper;
}

export function renderHero(movie, elements) {
  const title = getMovieTitle(movie);
  const description = truncate(movie?.overview, 240);
  const backdrop =
    getBackdropUrl(movie?.backdrop_path, "original") ||
    getPosterUrl(movie?.poster_path, "w780");

  elements.heroTitle.textContent = title;
  elements.heroDescription.textContent = description;

  elements.heroBackdrop.style.backgroundImage = backdrop
    ? `
      linear-gradient(180deg, rgba(5, 8, 14, 0.20) 0%, rgba(5, 8, 14, 0.58) 55%, rgba(5, 8, 14, 0.92) 100%),
      linear-gradient(90deg, rgba(5, 8, 14, 0.95) 0%, rgba(5, 8, 14, 0.56) 40%, rgba(5, 8, 14, 0.74) 100%),
      url("${backdrop}")
    `
    : `
      linear-gradient(180deg, rgba(5, 8, 14, 0.20) 0%, rgba(5, 8, 14, 0.58) 55%, rgba(5, 8, 14, 0.92) 100%),
      linear-gradient(90deg, rgba(5, 8, 14, 0.95) 0%, rgba(5, 8, 14, 0.56) 40%, rgba(5, 8, 14, 0.74) 100%)
    `;

  elements.heroMeta.innerHTML = `
    <span class="hero-pill">⭐ ${getVote(movie)}</span>
    <span class="hero-pill">📅 ${getMovieYear(movie)}</span>
    <span class="hero-pill">TMDb</span>
  `;
}

export function createMovieCard(movie, onSelect) {
  const title = getMovieTitle(movie);
  const posterUrl = getPosterUrl(movie?.poster_path, "w500");
  const backdropUrl =
    getBackdropUrl(movie?.backdrop_path, "w780") ||
    getPosterUrl(movie?.poster_path, "w500");
  const vote = getVote(movie);
  const year = getMovieYear(movie);
  const overview = truncate(movie?.overview, 160);

  const article = document.createElement("article");
  article.className = "media-card";
  article.dataset.title = title.toLowerCase();
  if (backdropUrl) {
    article.style.setProperty("--card-backdrop-image", `url("${backdropUrl}")`);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "media-card__button";
  button.setAttribute("aria-label", `Ver ${title}`);
  button.addEventListener("click", () => onSelect(movie));

  const surface = document.createElement("div");
  surface.className = "media-card__surface";

  const posterWrap = document.createElement("div");
  posterWrap.className = "media-card__poster-wrap";

  if (posterUrl) {
    const image = document.createElement("img");
    image.className = "media-card__poster";
    image.src = posterUrl;
    image.alt = title;
    image.loading = "lazy";
    posterWrap.appendChild(image);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "media-card__poster media-card__poster--fallback";
    fallback.textContent = title;
    posterWrap.appendChild(fallback);
  }

  const posterShade = document.createElement("div");
  posterShade.className = "media-card__poster-shade";
  posterWrap.appendChild(posterShade);

  const body = document.createElement("div");
  body.className = "media-card__body";

  const titleEl = document.createElement("h3");
  titleEl.className = "media-card__title";
  titleEl.textContent = title;

  const meta = document.createElement("div");
  meta.className = "media-card__meta";
  meta.appendChild(createMetaItem(`⭐ ${vote}`));

  const dot = document.createElement("span");
  dot.className = "media-card__dot";
  meta.appendChild(dot);
  meta.appendChild(createMetaItem(year));

  body.appendChild(titleEl);
  body.appendChild(meta);

  const expandPanel = document.createElement("div");
  expandPanel.className = "media-card__expand";

  const expandMedia = document.createElement("div");
  expandMedia.className = "media-card__expand-media";

  const expandOverlay = document.createElement("div");
  expandOverlay.className = "media-card__expand-overlay";
  expandMedia.appendChild(expandOverlay);

  const expandContent = document.createElement("div");
  expandContent.className = "media-card__expand-content";

  const expandTitle = document.createElement("h4");
  expandTitle.className = "media-card__expand-title";
  expandTitle.textContent = title;

  const badges = document.createElement("div");
  badges.className = "media-card__badges";

  const badgeRating = document.createElement("span");
  badgeRating.className = "media-card__badge";
  badgeRating.textContent = `⭐ ${vote}`;

  const badgeYear = document.createElement("span");
  badgeYear.className = "media-card__badge";
  badgeYear.textContent = year;

  const badgeSource = document.createElement("span");
  badgeSource.className = "media-card__badge";
  badgeSource.textContent = "TMDb";

  badges.appendChild(badgeRating);
  badges.appendChild(badgeYear);
  badges.appendChild(badgeSource);

  const overviewEl = document.createElement("p");
  overviewEl.className = "media-card__overview";
  overviewEl.textContent = overview;

  const cta = document.createElement("span");
  cta.className = "media-card__cta";
  cta.textContent = "Presiona Enter para ver detalle";

  expandContent.appendChild(expandTitle);
  expandContent.appendChild(badges);
  expandContent.appendChild(overviewEl);
  expandContent.appendChild(cta);

  expandPanel.appendChild(expandMedia);
  expandPanel.appendChild(expandContent);

  surface.appendChild(posterWrap);
  surface.appendChild(body);
  surface.appendChild(expandPanel);
  button.appendChild(surface);
  article.appendChild(button);

  return article;
}

export function renderMovieRow(container, movies, onSelect) {
  container.innerHTML = "";

  movies.forEach((movie) => {
    container.appendChild(createMovieCard(movie, onSelect));
  });
}

export function renderSearchGrid(container, movies, onSelect) {
  container.innerHTML = "";

  movies.forEach((movie) => {
    container.appendChild(createMovieCard(movie, onSelect));
  });
}

export function renderEmptyState(element, message) {
  element.textContent = message;
}