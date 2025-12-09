// ==== НАСТРОЙКА ====
// Для локального теста медиа лежат в папке `media/`.
// Для продакшена на R2 заменишь на публичный URL бакета, заканчивающийся на '/'.
const MEDIA_BASE_URL = "media/";

// Локально tags.json лежит рядом с index.html.
// В продакшене можно также перенести его в R2 и поменять путь в loadTags().
async function loadTags() {
  const res = await fetch("tags.json");
  if (!res.ok) {
    throw new Error("Не удалось загрузить tags.json");
  }
  return res.json();
}

// Из имени файла вытаскиваем числовой префикс: 0001.jpeg -> 1
function extractNumber(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Формируем массив медиа-объектов
function buildMediaItems(tagsMap) {
  const items = Object.keys(tagsMap).map(filename => ({
    filename,
    url: MEDIA_BASE_URL + filename,
    tags: tagsMap[filename],
  }));

  // перемешиваем массив
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}


// Считаем количество работ по каждому тегу
function buildTagStats(mediaItems) {
  const tagCounts = {};
  mediaItems.forEach(item => {
    item.tags.forEach(tag => {
      if (!tagCounts[tag]) tagCounts[tag] = 0;
      tagCounts[tag] += 1;
    });
  });

  const total = mediaItems.length;

  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { total, tags };
}

// Рендер фильтров
function renderFilters(container, tagStats, onFilterChange) {
  container.innerHTML = "";

  const makeBtn = (label, count, options = {}) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    if (options.all) {
      btn.classList.add("filter-btn--all");
    } else {
      btn.classList.add("filter-btn--color");
      if (typeof options.colorIndex === "number") {
        btn.dataset.colorIndex = String(options.colorIndex);
      }
    }
    btn.dataset.filter = options.value;
    btn.innerHTML = `#${label} <span class="count">(${count})</span>`;
    btn.addEventListener("click", () => onFilterChange(options.value));
    return btn;
  };

  const allBtn = makeBtn("Все", tagStats.total, { all: true, value: "__all" });
  container.appendChild(allBtn);

  tagStats.tags.forEach((tag, idx) => {
    const btn = makeBtn(tag.name, tag.count, {
      value: tag.name,
      colorIndex: idx % 7,
    });
    container.appendChild(btn);
  });
}

// Рендер сетки с учётом фильтра
function renderGrid(container, mediaItems, activeFilter) {
  container.innerHTML = "";
  const filtered = activeFilter === "__all"
    ? mediaItems
    : mediaItems.filter(item => item.tags.includes(activeFilter));

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.filename = item.filename;

    if (/\.(mp4|webm)$/i.test(item.filename)) {
      const video = document.createElement("video");
      video.src = item.url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;              // автозапуск
      video.setAttribute("autoplay", ""); // дублируем атрибутом
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

// Подсветка активного фильтра
function setActiveFilterButton(container, activeValue) {
  const buttons = container.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    if (btn.dataset.filter === activeValue) {
      btn.classList.add("filter-btn--active");
    } else {
      btn.classList.remove("filter-btn--active");
    }
  });
}

// Лайтбокс
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
    lightboxVideo.muted = true;
    lightboxVideo.loop = true;
    // маленькая защита от авто-плей проблем
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


// Закрытие по клику на фон, крестик и саму картинку
[lightboxOverlay, lightboxClose, lightboxImg, lightboxVideo].forEach(el => {
  el.addEventListener("click", closeLightbox);
});

// Инициализация
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
})();
