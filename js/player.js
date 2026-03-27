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

  // 🔥 AUTO REDIRECT (UX tipo app)
  setTimeout(() => {
    openDirect(url);
  }, 1500);

  // 🔥 fallback manual
  btn.onclick = () => {
    openDirect(url);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔥 PLAYER INICIADO");

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
    const res = await fetch(`/watch?tmdb_id=${tmdbId}&type=${type}`);
    const data = await res.json();

    if (!data.embed_url) {
      throw new Error("No disponible en este proveedor");
    }

    const url = data.embed_url;

    console.log("🎬 URL FINAL:", url);
    console.log("🧠 USER AGENT:", navigator.userAgent);

    // ==========================================
    // 📺 SMART TV → SIEMPRE EXTERNO (SOLUCIÓN REAL)
    // ==========================================
    if (isSmartTV()) {
      console.log("📺 Smart TV detectada → evitando iframe");

      // ⚠️ Nunca usar iframe en TV (bloqueos de Vimeus)
      showExternalPlayer(url);

      return;
    }

    // ==========================================
    // 💻 PC / CELULAR → iframe inteligente
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
    }, 3500);

  } catch (err) {
    console.error(err);
    const loader = document.getElementById("loader");
    loader.innerText = "Error cargando video 😢";
  }
});