// ==== CONFIG ====
const MEDIA_BASE_URL = "https://pub-3bc4f2b4686e4f2da3620e629a5a1aae.r2.dev/";

// Load tags.json
async function loadTags() {
  const res = await fetch("https://pub-3bc4f2b4686e4f2da3620e629a5a1aae.r2.dev/tags.json");
  if (!res.ok) throw new Error("Не удалось загрузить tags.json");
  return res.json();
}

// --- URL PARAMETERS ---
const params = new URLSearchParams(window.location.search);
const tagFromURL = params.get("tag");
const mediaFromURL = params.get("media");

// Shuffle
function extractNumber(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function buildMediaItems(tagsMap) {
  const items = Object.keys(tagsMap).map(filename => ({
    filename,
    url: MEDIA_BASE_URL + filename,
    tags: tagsMap[filename],
  }));

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// Tag stats
function buildTagStats(mediaItems) {
  const tagCounts = {};
  mediaItems.forEach(item => {
    item.tags.forEach(tag => {
      if (!tagCounts[tag]) tagCounts[tag] = 0;
      tagCounts[tag]++;
    });
  });

  const total = mediaItems.length;
  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { total, tags };
}

// Render filters
function renderFilters(container, tagStats, onFilterChange) {
  container.innerHTML = "";

  const makeBtn = (label, count, options = {}) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";

    if (options.all) btn.classList.add("filter-btn--all");
    else {
      btn.classList.add("filter-btn--color");
      btn.dataset.colorIndex = String(options.colorIndex);
    }

    btn.dataset.filter = options.value;
    btn.innerHTML = `#${label} <span class="count">(${count})</span>`;
    btn.addEventListener("click", () => onFilterChange(options.value));

    return btn;
  };

  container.appendChild(makeBtn("Все", tagStats.total, { all: true, value: "__all" }));

  tagStats.tags.forEach((tag, idx) => {
    container.appendChild(
      makeBtn(tag.name, tag.count, {
        value: tag.name,
        colorIndex: idx % 7
      })
    );
  });
}

function setActiveFilterButton(container, activeValue) {
  container.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("filter-btn--active", btn.dataset.filter === activeValue);
  });
}

/* ==========================================
   PINTEREST MASONRY ENGINE (Safari iOS safe)
========================================== */

function getColumnCount() {
  const w = window.innerWidth;
  if (w <= 640) return 2;      // mobile
  if (w <= 1024) return 3;     // tablet
  if (w <= 1280) return 4;     // small desktop
  if (w <= 1536) return 5;     // desktop+
  return 6;                    // wide
}

function getGap(gridEl) {
  const styles = getComputedStyle(gridEl);
  const gap = parseFloat(styles.getPropertyValue("--grid-gap"));
  return Number.isFinite(gap) ? gap : 12;
}

let layoutRaf = 0;
function scheduleLayout(gridEl) {
  if (!gridEl) return;
  cancelAnimationFrame(layoutRaf);
  layoutRaf = requestAnimationFrame(() => layoutMasonry(gridEl));
}

function layoutMasonry(gridEl) {
  if (!gridEl) return;

  const cards = Array.from(gridEl.querySelectorAll(".card"));
  if (!cards.length) {
    gridEl.style.height = "0px";
    return;
  }

  const gap = getGap(gridEl);
  const cols = getColumnCount();

  const rect = gridEl.getBoundingClientRect();
  const styles = getComputedStyle(gridEl);
  const padL = parseFloat(styles.paddingLeft) || 0;
  const padR = parseFloat(styles.paddingRight) || 0;

  const innerWidth = Math.max(0, Math.floor(rect.width - padL - padR));
  const colWidth = Math.max(120, Math.floor((innerWidth - gap * (cols - 1)) / cols));

  const colHeights = new Array(cols).fill(0);

  for (const card of cards) {
    card.style.width = `${colWidth}px`;

    // важный момент: меряем после установки width
    const h = Math.ceil(card.getBoundingClientRect().height);

    // выбираем самую короткую колонку (Pinterest)
    let target = 0;
    for (let i = 1; i < cols; i++) {
      if (colHeights[i] < colHeights[target]) target = i;
    }

    const x = (colWidth + gap) * target;
    const y = colHeights[target];

    card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    card.classList.add("is-measured");

    colHeights[target] = y + h + gap;
  }

  const height = Math.max(...colHeights) - gap;
  gridEl.style.height = `${Math.max(0, Math.ceil(height))}px`;
}

function bindMasonryObservers(gridEl) {
  if (!gridEl) return;

  // ResizeObserver: пересчёт при изменениях размеров карточек (видео/шрифты/ленивые картинки)
  const ro = new ResizeObserver(() => scheduleLayout(gridEl));
  ro.observe(gridEl);

  const observeCards = () => {
    gridEl.querySelectorAll(".card").forEach(card => ro.observe(card));
  };

  // Resize окна
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => scheduleLayout(gridEl), 80);
  }, { passive: true });

  return { ro, observeCards };
}

/* =========================
   Render grid (masonry)
========================= */

function renderGrid(container, mediaItems, activeFilter, onMediaRendered) {
  container.innerHTML = "";

  const filtered = activeFilter === "__all"
    ? mediaItems
    : mediaItems.filter(item => item.tags.includes(activeFilter));

  const createdMedia = [];

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    // единая оболочка для анимации (и для img, и для video)
    const inner = document.createElement("div");
    inner.className = "card-inner";

    let mediaEl;

    if (/\.(mp4|webm)$/i.test(item.filename)) {
      const video = document.createElement("video");
      video.src = item.url;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "metadata";
      inner.appendChild(video);
      mediaEl = video;
    } else {
      const img = document.createElement("img");
      img.src = item.url;
      img.loading = "lazy";
      img.alt = "";
      inner.appendChild(img);
      mediaEl = img;
    }

    card.appendChild(inner);

    card.addEventListener("click", () => openLightbox(item.url));
    container.appendChild(card);
    createdMedia.push(mediaEl);

    // Когда медиа готово — пересчитать раскладку
    const kick = () => scheduleLayout(container);

    if (mediaEl.tagName === "IMG") {
      if (mediaEl.complete) kick();
      // decode помогает Safari/Chrome, но не обязателен
      mediaEl.decode?.().then(kick).catch(kick);
      mediaEl.addEventListener("load", kick, { once: true });
    } else {
      if (mediaEl.readyState >= 2) kick();
      mediaEl.addEventListener("loadedmetadata", kick, { once: true });
      mediaEl.addEventListener("loadeddata", kick, { once: true });
    }

    // Анимация карточек: случайная задержка 0.2–1.0 сек
    requestAnimationFrame(() => {
      const delay = 0.2 + Math.random() * 0.8;
      card.style.animationDelay = `${delay}s`;
      card.classList.add("anim-start");
    });

    // подстраховка: если Safari не дал событие
    setTimeout(() => {
      if (card.isConnected) kick();
    }, 900);
  });

  // первичный layout сразу
  scheduleLayout(container);

  if (typeof onMediaRendered === "function") {
    onMediaRendered(createdMedia);
  }
}

/* =========================
   Lightbox
========================= */

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxVideo = document.getElementById("lightbox-video");
const lightboxOverlay = document.getElementById("lightbox-overlay");
const lightboxClose = document.getElementById("lightbox-close");
const introScreen = document.getElementById("intro-screen");

function openLightbox(src) {
  const isVideo = /\.(mp4|webm)$/i.test(src);

  if (isVideo) {
    lightboxImg.style.display = "none";
    lightboxVideo.style.display = "block";
    lightboxVideo.src = src;
    lightboxVideo.play().catch(() => {});
  } else {
    lightboxVideo.pause();
    lightboxVideo.style.display = "none";
    lightboxImg.style.display = "block";
    lightboxImg.src = src;
  }

  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightboxImg.src = "";
  lightboxVideo.pause();
  lightboxVideo.src = "";
}

[lightboxOverlay, lightboxClose, lightboxImg, lightboxVideo].forEach(el =>
  el.addEventListener("click", closeLightbox)
);

/* =========================
   Intro helpers
========================= */

function hideIntroScreen() {
  if (introScreen) {
    introScreen.classList.add("hidden");
  }
}

function waitForMediaBatch(mediaElements, batchSize = 8) {
  const targets = mediaElements.slice(0, batchSize);

  return Promise.all(targets.map(el => new Promise(resolve => {
    if (el.tagName === "IMG" && el.complete) return resolve();
    if (el.tagName === "VIDEO" && el.readyState >= 2) return resolve();

    el.addEventListener("load", resolve, { once: true });
    el.addEventListener("loadeddata", resolve, { once: true });
    el.addEventListener("loadedmetadata", resolve, { once: true });
  })));
}

/* =========================
   Init
========================= */

(async function init() {
  const filtersEl = document.getElementById("filters");
  const gridEl = document.getElementById("grid");

  // Masonry observers (1 раз)
  const masonry = bindMasonryObservers(gridEl);

  try {
    const tagsMap = await loadTags();
    const mediaItems = buildMediaItems(tagsMap);
    const tagStats = buildTagStats(mediaItems);

    let activeFilter = "__all";
    let introHidden = false;

    // --- APPLY ?tag= FILTER ---
    if (tagFromURL && tagStats.tags.some(t => t.name === tagFromURL)) {
      activeFilter = tagFromURL;
    }

    const hideIntroOnce = () => {
      if (introHidden) return;
      introHidden = true;
      hideIntroScreen();
    };

    const onFilterChange = (value) => {
      activeFilter = value;
      setActiveFilterButton(filtersEl, activeFilter);

      renderGrid(gridEl, mediaItems, activeFilter, (mediaNodes) => {
        masonry?.observeCards?.();
        scheduleLayout(gridEl);
        // интро уже может быть скрыто, но логика остаётся безопасной
        waitForMediaBatch(mediaNodes).then(hideIntroOnce);
      });
    };

    // --- APPLY ?media= OPEN LIGHTBOX ---
    if (mediaFromURL) {
      const fullPath = MEDIA_BASE_URL + mediaFromURL;
      setTimeout(() => {
        openLightbox(fullPath);
      }, 600);
    }

    renderFilters(filtersEl, tagStats, onFilterChange);
    setActiveFilterButton(filtersEl, activeFilter);

    renderGrid(gridEl, mediaItems, activeFilter, (mediaNodes) => {
      masonry?.observeCards?.();
      scheduleLayout(gridEl);
      waitForMediaBatch(mediaNodes).then(hideIntroOnce);
    });

    // фолбэк на случай медленного интернета
    setTimeout(hideIntroOnce, 4800);

  } catch (e) {
    console.error(e);
    hideIntroScreen();
  }

  document.getElementById("logo-link").addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => window.location.reload(), 150);
  });

  // ==== Скролл-анимация хедера ====
  let lastScroll = 0;
  const header = document.querySelector(".header-blur");

  window.addEventListener("scroll", () => {
    const current = window.scrollY;

    if (current > lastScroll && current > 80) {
      header.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
    }

    lastScroll = current;
  }, { passive: true });

})();
