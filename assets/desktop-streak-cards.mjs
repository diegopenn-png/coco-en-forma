let installed = false;

export function install(cards, wideHome) {
  const app = document.getElementById('cocoApp');
  if (installed || !app) return;
  installed = true;
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('./styles/desktop-streak-cards.css', import.meta.url);
  document.head.append(style);

  let gallery;
  function display() {
    const service = window.CocoRewardCards;
    if (!wideHome.matches || !style.sheet || !service) return;
    const lang = window.CocoLocale?.tag || 'es';
    if (gallery?.isConnected && gallery.lang === lang) return;
    const panel = app.querySelector('.cocoHomeGamesRowFinal3 > .cocoHomeBrainFinal3');
    if (!panel) return;

    const next = document.createElement('div');
    next.className = 'cocoWebStreaks';
    next.lang = lang;
    const title = panel.querySelector('.cocoHomeBrainCloneFinal3 .loginDecorTitle')?.cloneNode(true)
      || document.createElement('strong');
    if (!title.textContent) title.textContent = service.describe('coco',lang).header;
    const list = document.createElement('ol');
    list.setAttribute('role','list');
    for (const reward of cards) {
      const item = document.createElement('li');
      const img = document.createElement('img');
      img.className = 'tarjetaImagenOptimizada';
      img.width = 456; img.height = 608; img.loading = 'lazy'; img.decoding = 'async';
      img.alt = reward.nombre+' · '+reward.subtitulo;
      img.src = reward.mini;
      if (lang === 'es') img.onerror = () => { img.onerror = null; img.src = reward.url; };
      item.append(img); list.append(item);
      const card = service.describe(service.cardId(reward.mini),lang);
      item.setAttribute('aria-label',card.threshold ? card.days(card.threshold) : card.start);
    }
    service.apply(list,lang);
    next.append(title,list);
    if (gallery?.parentNode === panel) gallery.replaceWith(next);
    else panel.append(next);
    gallery = next;
  }
  const observer = new MutationObserver(() => {
    if (!gallery?.isConnected) display();
  });
  function updateMode() {
    if (wideHome.matches) {
      display();
      observer.observe(app,{childList:true,subtree:true});
      window.addEventListener('coco:language',display);
    } else {
      observer.disconnect();
      window.removeEventListener('coco:language',display);
      gallery?.remove(); gallery = undefined;
    }
  }
  style.addEventListener('load',display,{once:true});
  wideHome.addEventListener('change',updateMode);
  updateMode();
}
