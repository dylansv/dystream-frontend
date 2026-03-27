const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function resolveApiBase() {
  // 🔧 Override manual (por si luego lo quieres cambiar sin tocar código)
  const explicitBase = window.DYSTREAM_API_BASE?.trim();
  if (explicitBase) return explicitBase.replace(/\/+$/, "");

  const { hostname } = window.location;

  // 🧪 Desarrollo local
  if (
    hostname === "127.0.0.1" ||
    hostname === "localhost"
  ) {
    return "http://127.0.0.1:8000";
  }

  // 🚀 Producción (Vercel u otro dominio)
  return "https://dystream-backend.onrender.com";
}

const API_BASE = resolveApiBase();

function buildUrl(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function request(path, params = {}) {
  const response = await fetch(buildUrl(path, params), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API request failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function fetchTrending(language) {
  return request("/movies/trending", { language });
}

export async function fetchPopular(language) {
  return request("/movies/popular", { language });
}

export async function searchMovies(query, language) {
  return request("/movies/search", { query, language });
}

export function getPosterUrl(path, size = "w500") {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path, size = "original") {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}