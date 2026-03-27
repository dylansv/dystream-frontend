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
  return /smart-tv|smarttv|googletv|appletv|hbbtv|netcast|tizen|webos|firetv|aft/i.test(
    navigator.userAgent
  );
}

function openDirect(url) {
  window.open(url, "_self");
}

function goBackSafe() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = "/";
}

function setTvFocus(elements, index) {
  elements.forEach((el, i) => {
    el.classList.toggle("tv-focused", i === index);
  });

  const target = elements[index];
  if (target && typeof target.focus === "function") {
    target.focus({ preventScroll: true });
  }
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
  const backBtn = document.getElementById("back-btn");
  const external = document.getElementById("external-player");
  const playExternalBtn = document.getElementById("play-external-btn");
  const backExternalBtn = document.getElementById("back-external-btn");

  const tvMode = isSmartTV();

  if (tvMode) {
    document.body.classList.add("tv-mode");
  }

  backBtn.addEventListener("click", goBackSafe);
  backExternalBtn.addEventListener("click", goBackSafe);

  if (!tmdbId) {
    loader.textContent = "ID inválido";
    return;
  }

  let externalUrl = null;

  function showLoader(message) {
    loader.textContent = message || "Cargando video...";
    loader.classList.remove("hidden");
  }

  function hideLoader() {
    loader.classList.add("hidden");
  }

  function showExternalPlayer(url, autoOpen = false) {
    externalUrl = url;
    hideLoader();
    external.classList.remove("hidden");

    const focusables = [playExternalBtn, backExternalBtn];
    let focusIndex = 0;
    setTvFocus(focusables, focusIndex);

    if (!tvMode) {
      playExternalBtn.focus();
    }

    if (tvMode) {
      document.addEventListener("keydown", onExternalKeydown);
    }

    playExternalBtn.onclick = () => {
      openDirect(url);
    };

    function onExternalKeydown(e) {
      if (external.classList.contains("hidden")) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        focusIndex = focusIndex === 0 ? 1 : 0;
        setTvFocus(focusables, focusIndex);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        focusables[focusIndex]?.click();
        return;
      }

      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        goBackSafe();
      }
    }

    if (autoOpen) {
      setTimeout(() => {
        openDirect(url);
      }, 900);
    }
  }

  try {
    showLoader("Cargando video...");

    const requestUrl = `${API_BASE}/watch?tmdb_id=${encodeURIComponent(tmdbId)}&type=${encodeURIComponent(type || "movie")}`;
    console.log("📡 Fetch:", requestUrl);

    const res = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const rawText = await res.text().catch(() => "");
      console.error("❌ Respuesta no válida:", res.status, rawText);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data || !data.embed_url) {
      console.error("❌ Respuesta sin embed_url:", data);
      throw new Error("No disponible en este proveedor");
    }

    const url = data.embed_url;
    console.log("🎬 URL FINAL:", url);
    console.log("🧠 USER AGENT:", navigator.userAgent);

    if (tvMode) {
      console.log("📺 Smart TV detectada → externo");
      showExternalPlayer(url, true);
      return;
    }

    iframe.src = url;

    let loaded = false;

    iframe.onload = () => {
      loaded = true;
      console.log("✅ iframe cargado");
      hideLoader();
    };

    setTimeout(() => {
      if (!loaded) {
        console.warn("⚠️ iframe bloqueado → fallback externo");
        showExternalPlayer(url, false);
      }
    }, 4500);
  } catch (err) {
    console.error("❌ ERROR PLAYER:", err);
    loader.textContent = "Error cargando video 😢";
  }

  if (tvMode) {
    const mainFocusables = [backBtn];
    let mainFocusIndex = 0;
    setTvFocus(mainFocusables, mainFocusIndex);

    document.addEventListener("keydown", (e) => {
      if (!external.classList.contains("hidden")) return;

      if (e.key === "Enter") {
        e.preventDefault();
        mainFocusables[mainFocusIndex]?.click();
        return;
      }

      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        goBackSafe();
      }
    });
  }
});