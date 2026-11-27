// Each language URL is complete HTML; JavaScript only improves the language menu.
(() => {
  'use strict';
  const language = document.body.dataset.cocoLandingLocale;
  if (language) {
    try { localStorage.setItem('coco.language.v1', language); } catch {}
  }
  const copy = document.querySelector('[data-copy-game]');
  if (copy) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const url = document.querySelector('link[rel=canonical]').href;
      const status = document.querySelector('[data-copy-status]');
      try {
        await navigator.clipboard.writeText(url);
        status.textContent = copy.dataset.copied;
      } catch {
        let field = status.querySelector('input');
        if (!field) {
          field = document.createElement('input');
          field.className = 'copy-fallback';
          field.readOnly = true;
          field.setAttribute('aria-label',copy.textContent);
          status.append(field);
        }
        field.value = url; field.focus(); field.select();
      }
    });
  }
  const menu = document.querySelector('#landing-language');
  menu?.addEventListener('change', () => {
    const destination = new URL(menu.value, location.origin);
    if (destination.origin === location.origin) location.assign(destination.href);
  });
})();
