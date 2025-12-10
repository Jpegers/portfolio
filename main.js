// ==== CONFIG ====
const MEDIA_BASE_URL = "https://pub-3bc4f2b4686e4f2da3620e629a5a1aae.r2.dev/";

// Load tags.json
async function loadTags() {
  const res = await fetch("https://pub-3bc4f2b4686e4f2da3620e629a5a1aae.r2.dev/tags.json");
  if (!res.ok) throw new Error("Не удалось загрузить tags.json");
  return res.json();
}

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



// Render grid
function renderGrid(container, mediaItems, activeFilter, onMediaRendered) {
  container.innerHTML = "";
  const filtered = activeFilter === "__all"
    ? mediaItems
    : mediaItems.filter(item => item.tags.includes(activeFilter));

  const createdMedia = [];

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.gridRowEnd = "span 20"; // базовый span, чтобы карточка была видна до перерасчёта

    let mediaEl;

    if (/\.(mp4|webm)$/i.test(item.filename)) {
      const video = document.createElement("video");
      video.src = item.url;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "metadata";
      card.appendChild(video);
      mediaEl = video;
    } else {
      const img = document.createElement("img");
      img.src = item.url;
      img.loading = "lazy";
      img.alt = "";
      card.appendChild(img);
      mediaEl = img;
    }

    card.addEventListener("click", () => openLightbox(item.url));
    container.appendChild(card);
    createdMedia.push(mediaEl);

    sizeCardWhenReady(card, mediaEl);

    // Анимация карточек: случайная задержка 0.3–0.7 сек
    requestAnimationFrame(() => {
      const delay = 0.2 + Math.random() * 0.8; // 0.3 → 0.7 сек
      card.style.animationDelay = `${delay}s`;
      card.classList.add("anim-start");
    });
  });

  // перерасчёт для всех карточек при смене фильтра
  recalcGridSpans(container);

  if (typeof onMediaRendered === "function") {
    onMediaRendered(createdMedia);
  }
}

function sizeCardWhenReady(card, mediaEl) {
  const resize = () => updateCardSpan(card, mediaEl);

  if (mediaEl.tagName === "IMG" && mediaEl.complete) {
    requestAnimationFrame(resize);
  } else if (mediaEl.tagName === "VIDEO" && mediaEl.readyState >= 2) {
    requestAnimationFrame(resize);
  }

  mediaEl.addEventListener("load", resize, { once: true });
  mediaEl.addEventListener("loadedmetadata", resize, { once: true });
  mediaEl.addEventListener("loadeddata", resize, { once: true });

  // подстраховка, если событие не сработало (редко на десктопе)
  setTimeout(() => {
    if (card.isConnected) resize();
  }, 1200);
}

function updateCardSpan(card, mediaEl) {
  const grid = card.parentElement;
  if (!grid) return;

   // если высота уже рассчитана — повторный вызов не нужен
  if (card.dataset.spanned === "1") return;

  const styles = getComputedStyle(grid);
  const rowHeight = parseFloat(styles.getPropertyValue("--grid-row-height")) || 12;
  const gap = parseFloat(styles.getPropertyValue("--grid-gap")) || 12;
  const mediaHeight = mediaEl.getBoundingClientRect().height;

  if (!mediaHeight) return;

  const span = Math.max(1, Math.ceil((mediaHeight + gap) / (rowHeight + gap)));
  card.style.gridRowEnd = `span ${span}`;
  card.dataset.spanned = "1";
}

// Lightbox
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

function hideIntroScreen() {
  if (introScreen) {
    introScreen.classList.add("hidden");
  }
}

function recalcGridSpans(gridEl) {
  if (!gridEl) return;
  const cards = Array.from(gridEl.querySelectorAll(".card"));
  cards.forEach(card => {
    const mediaEl = card.querySelector("img, video");
    if (mediaEl) {
      card.dataset.spanned = "0";
      updateCardSpan(card, mediaEl);
    }
  });
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

// Init
(async function init() {
  const filtersEl = document.getElementById("filters");
  const gridEl = document.getElementById("grid");

  try {
    const tagsMap = await loadTags();
    const mediaItems = buildMediaItems(tagsMap);
    const tagStats = buildTagStats(mediaItems);

    let activeFilter = "__all";
    let introHidden = false;

    const hideIntroOnce = () => {
      if (introHidden) return;
      introHidden = true;
      hideIntroScreen();
    };

    const onFilterChange = (value) => {
      activeFilter = value;
      setActiveFilterButton(filtersEl, activeFilter);
      renderGrid(gridEl, mediaItems, activeFilter);
    };

    renderFilters(filtersEl, tagStats, onFilterChange);
    setActiveFilterButton(filtersEl, activeFilter);
    renderGrid(gridEl, mediaItems, activeFilter, (mediaNodes) => {
      waitForMediaBatch(mediaNodes).then(hideIntroOnce);
    });

    window.addEventListener("resize", () => recalcGridSpans(gridEl));

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
    // Скролл вниз — скрываем
    header.classList.add("header-hidden");
  } else {
    // Скролл вверх — показываем
    header.classList.remove("header-hidden");
  }

  lastScroll = current;

  

  
});

})();

function setActiveFilterButton(container, activeValue) {
  container.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("filter-btn--active", btn.dataset.filter === activeValue);
  });
}
