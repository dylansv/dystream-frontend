function resolveApiBase() {
  const explicitBase = window.DYSTREAM_API_BASE?.trim();
  if (explicitBase) return explicitBase.replace(/\/+$/, "");

  const { hostname } = window.location;

  if (hostname === "127.0.0.1" || hostname === "localhost") {
    return "http://127.0.0.1:8000";
  }

  return "https://dystream-backend.onrender.com";
}

function isSmartTV() {
  return /smart-tv|smarttv|googletv|appletv|hbbtv|netcast|tizen|webos/i.test(navigator.userAgent);
}

function openDirect(url) {
  window.open(url, "_self");
}

function showExternalPlayer(url) {
  const loader = document.getElementById("loader");
  const external = document.getElementById("external-player");
  const btn = document.getElementById("play-external-btn");

  loader.style.display = "block";
  loader.innerText = "Abriendo reproductor...";

  external.classList.remove("hidden");

  // 🔥 AUTO REDIRECT
  setTimeout(() => {
    openDirect(url);
  }, 1500);

  btn.onclick = () => {
    openDirect(url);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔥 PLAYER INICIADO");

  const API_BASE = resolveApiBase();
  console.log("🌐 API_BASE:", API_BASE);

  const params = new URLSearchParams(window.location.search);
  const tmdbId = params.get("id");
  const type = params.get("type");

  const iframe = document.getElementById("player-frame");
  const loader = document.getElementById("loader");

  if (!tmdbId) {
    loader.innerText = "ID inválido";
    return;
  }

  try {
    const urlRequest = `${API_BASE}/watch?tmdb_id=${tmdbId}&type=${type}`;
    console.log("📡 Fetch:", urlRequest);

    const res = await fetch(urlRequest);

    // 🔥 Manejo de error HTTP
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data.embed_url) {
      throw new Error("No disponible en este proveedor");
    }

    const url = data.embed_url;

    console.log("🎬 URL FINAL:", url);
    console.log("🧠 USER AGENT:", navigator.userAgent);

    // ==========================================
    // 📺 SMART TV → SIEMPRE EXTERNO
    // ==========================================
    if (isSmartTV()) {
      console.log("📺 Smart TV detectada → externo");
      showExternalPlayer(url);
      return;
    }

    // ==========================================
    // 💻 PC / CELULAR → iframe
    // ==========================================
    iframe.src = url;

    let loaded = false;

    iframe.onload = () => {
      loaded = true;
      console.log("✅ iframe cargado");
      loader.style.display = "none";
    };

    // 🔥 fallback si iframe falla
    setTimeout(() => {
      if (!loaded) {
        console.warn("⚠️ iframe bloqueado → fallback externo");
        showExternalPlayer(url);
      }
    }, 4000);

  } catch (err) {
    console.error("❌ ERROR PLAYER:", err);

    loader.innerText = "Error cargando video 😢";

    // 🔥 fallback general
    setTimeout(() => {
      loader.innerText = "Intentando abrir reproductor...";
    }, 1500);
  }
});