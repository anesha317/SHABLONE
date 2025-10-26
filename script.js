/* ===========================
   Modern Web Template — script.js
   Скрипты для:
    - создания плавающих blob'ов
    - лёгкой параллакс-реакции на движение мыши (с уважением к prefers-reduced-motion)
    - небольших интерактивных элементов (обновление года в footer, демонстрация кликов)
    - адаптивных оптимизаций
   Код детально прокомментирован и написан в понятном стиле.
   =========================== */

(function () {
  'use strict';

  /* -------------------------
     Утилиты
     ------------------------- */

  // Проверка: пользователь предпочитает уменьшенное движение — если да, отключаем анимационные эффекты.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Небольшая безопасная функция для создания элементов с классами
  function el(tag, className, attrs = {}) {
    const d = document.createElement(tag);
    if (className) d.className = className;
    for (const k in attrs) {
      d.setAttribute(k, attrs[k]);
    }
    return d;
  }

  /* -------------------------
     БЛОБЫ: создаём несколько плавающих объектов на фоне
     ------------------------- */

  const blobContainer = document.getElementById('blobs');
  if (blobContainer) {
    // Количество blob'ов — можно настроить.
    const BLOB_COUNT = 5;

    // Подготовим набор размеров (в CSS мы используем vmin, но для inline-стилей можно задавать относительные)
    const sizes = ['18vmin', '22vmin', '15vmin', '20vmin', '12vmin'];

    // Функция создания одного blob'а
    function createBlob(i) {
      const b = el('div', 'blob b' + ((i % 5) + 1));
      // назначаем размер (можно варьировать)
      b.style.width = sizes[i % sizes.length];
      b.style.height = sizes[i % sizes.length];

      // случайные стартовые позиции (проценты)
      const left = 5 + Math.random() * 80;
      const top = 5 + Math.random() * 80;
      b.style.left = left + '%';
      b.style.top = top + '%';

      // плавное смещение: случайная длительность и задержка
      const duration = 14 + Math.random() * 12; // 14s - 26s
      b.style.animation = `floatBlob ${duration}s ease-in-out ${-Math.random() * duration}s infinite`;

      // для пользователей, у которых reduced-motion — убираем анимацию
      if (prefersReducedMotion) {
        b.style.animation = 'none';
        b.style.transition = 'none';
      }

      blobContainer.appendChild(b);
      return b;
    }

    // создаём все blob'ы
    const blobs = [];
    for (let i = 0; i < BLOB_COUNT; i++) {
      blobs.push(createBlob(i));
    }

    // Параллакс: легкий смещение blob'ов при движении мыши.
    // Безопасность: на мобильных девайсах это не прослушиваем (иначе будет странно).
    let mouseX = 0, mouseY = 0;
    if (!prefersReducedMotion && window.innerWidth > 720) {
      window.addEventListener('mousemove', (e) => {
        // нормализуем координаты в диапазон -1..1
        const w = window.innerWidth;
        const h = window.innerHeight;
        mouseX = (e.clientX / w - 0.5) * 2;
        mouseY = (e.clientY / h - 0.5) * 2;
      });
    }

    // функция анимационного цикла: плавно перемещаем blob'ы через transform
    function blobTick() {
      blobs.forEach((b, i) => {
        // depth: ближние двигаются сильнее
        const depth = (i + 1) / blobs.length;
        const tx = mouseX * (12 * depth); // пиксели по X
        const ty = mouseY * (10 * depth); // пиксели по Y
        b.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
      requestAnimationFrame(blobTick);
    }

    // стартуем цикл (если reduced-motion — всё равно таймер, но трансформации будут нулевыми)
    blobTick();
  } // end if blobContainer

  /* -------------------------
     Динамика кнопок — простая демонстрация
     ------------------------- */

  // Пример: когда нажали Preview — плавно скроллим к секции features
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('features');
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  }

  // Пример: Buy — покажем модалку-подтверждение (demo)
  const buyBtn = document.getElementById('buyBtn');
  if (buyBtn) {
    buyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // простая демонстрация: можно заменить на реальную логику
      const prevText = buyBtn.textContent;
      buyBtn.textContent = 'Preparing...';
      buyBtn.disabled = true;
      setTimeout(() => {
        buyBtn.textContent = 'Added to cart (demo)';
        buyBtn.disabled = false;
        setTimeout(() => buyBtn.textContent = prevText, 1800);
      }, 900);
    });
  }

  /* -------------------------
     Footer: вставляем текущий год
     ------------------------- */
  (function setYear() {
    const y = new Date().getFullYear();
    const elYear = document.getElementById('year');
    if (elYear) elYear.textContent = y;
  })();

  /* -------------------------
     Performance: уменьшение анимаций при низком fps или на мобильных
     Простой эвристический подход: если устройство показывает, что анимации тормозят,
     можно уменьшить интенсивность. Для демо — логика разобрана, можно расширить.
     ------------------------- */
  (function performanceHints() {
    try {
      // Простая проверка: если deviceMemory доступен и меньше 2 GB — выключаем некоторые эффекты
      const mem = navigator.deviceMemory || 4;
      if (mem <= 2) {
        // Уменьшаем blur у blobs и карточек для экономии
        document.documentElement.style.setProperty('--glass-blur', '6px');
        const blobs = document.querySelectorAll('.blob');
        blobs.forEach(b => {
          b.style.filter = 'blur(12px)';
        });
      }
    } catch (err) {
      // игнорируем ошибки — это не критично
      // console.warn('perf hint failed', err);
    }
  })();

  /* -------------------------
     Accessibility: управление фокусом
     Добавляем видимую индикацию фокуса для клавиатурных пользователей
     ------------------------- */
  (function setupFocusStyles() {
    // если пользователь использует клавиатуру — показать outline. Для мыши — нет.
    function handleFirstTab(e) {
      if (e.key === 'Tab') {
        document.documentElement.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
      }
    }
    window.addEventListener('keydown', handleFirstTab);
  })();

  /* -------------------------
     Конец скрипта
     ------------------------- */
})(); // IIFE — защищаем область видимости
