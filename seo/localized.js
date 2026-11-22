// Each language URL is complete HTML; JavaScript only improves the language menu.
(() => {
  'use strict';
  const language = document.body.dataset.cocoLandingLocale;
  if (language) {
    try { localStorage.setItem('coco.language.v1', language); } catch {}
  }
  const menu = document.querySelector('#landing-language');
  menu?.addEventListener('change', () => {
    const destination = new URL(menu.value, location.origin);
    if (destination.origin === location.origin) location.assign(destination.href);
  });
})();
