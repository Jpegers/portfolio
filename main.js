// ==== CONFIG ====
const MEDIA_BASE_URL = "https://pub-3bc4f2b4686e4f2da3620e629a5a1aae.r2.dev";

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
function renderGrid(container, mediaItems, activeFilter) {
  container.innerHTML = "";
  const filtered = activeFilter === "__all"
    ? mediaItems
    : mediaItems.filter(item => item.tags.includes(activeFilter));

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    if (/\.(mp4|webm)$/i.test(item.filename)) {
      const video = document.createElement("video");
      video.src = item.url;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.loading = "lazy";
      card.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = item.url;
      img.loading = "lazy";
      img.alt = "";
      card.appendChild(img);
    }

    card.addEventListener("click", () => openLightbox(item.url));
    container.appendChild(card);
  });
}

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxVideo = document.getElementById("lightbox-video");
const lightboxOverlay = document.getElementById("lightbox-overlay");
const lightboxClose = document.getElementById("lightbox-close");

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

// Init
(async function init() {
  const filtersEl = document.getElementById("filters");
  const gridEl = document.getElementById("grid");

  try {
    const tagsMap = await loadTags();
    const mediaItems = buildMediaItems(tagsMap);
    const tagStats = buildTagStats(mediaItems);

    let activeFilter = "__all";

    const onFilterChange = (value) => {
      activeFilter = value;
      setActiveFilterButton(filtersEl, activeFilter);
      renderGrid(gridEl, mediaItems, activeFilter);
    };

    renderFilters(filtersEl, tagStats, onFilterChange);
    setActiveFilterButton(filtersEl, activeFilter);
    renderGrid(gridEl, mediaItems, activeFilter);
  } catch (e) {
    console.error(e);
  }

  document.getElementById("logo-link").addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => window.location.reload(), 150);
  });
})();

function setActiveFilterButton(container, activeValue) {
  container.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("filter-btn--active", btn.dataset.filter === activeValue);
  });
}
