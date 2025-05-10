// js/carousel.js
(function() {
  // 1) Единственный общий лайтбокс
  const lightbox = document.getElementById('lightbox');
  const lbInner  = lightbox.querySelector('.lightbox__inner');
  const lbImg    = lightbox.querySelector('.lightbox__img');
  const lbClose  = lightbox.querySelector('.lightbox__close');

  // 2) Функция-инициализатор для каждой карусели
  function initCarousel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const items = Array.from(track.children);
    // клонируем элементы
    items.forEach(item => track.appendChild(item.cloneNode(true)));

    let scrollPos = 0;

    // при каждом колесе пересчитываем половину ширины
    // Работает только на десктопе (на тач-устройствах свайпит нативно)
if (!('ontouchstart' in window)) {
  carousel.addEventListener('wheel', e => {
    e.preventDefault();
    const halfWidth = track.scrollWidth / 2;
    scrollPos = (scrollPos + e.deltaY + halfWidth) % halfWidth;
    track.style.transform = `translateX(${-scrollPos}px)`;
  });
}

    // открытие лайтбокса
    carousel.addEventListener('click', e => {
      const img = e.target.closest('.carousel-item img');
      if (!img) return;
      lbImg.src = img.src;
      lightbox.style.display = 'flex';
    });
  }

  // 3) Инициализируем все карусели на странице
  document.querySelectorAll('.carousel-container').forEach(initCarousel);

  // 4) Логика закрытия лайтбокса
  lbClose.addEventListener('click', e => {
    e.stopPropagation();
    lightbox.style.display = 'none';
  });
  lightbox.addEventListener('click', () => {
    lightbox.style.display = 'none';
  });
  lbInner.addEventListener('click', e => e.stopPropagation());
})();

