(function () {
  'use strict';
  const languages = {
    es: 'Español', en: 'English', de: 'Deutsch', nl: 'Nederlands', fr: 'Français',
    it: 'Italiano', pl: 'Polski', uk: 'Українська', ru: 'Русский',
    'zh-Hans': '简体中文', ar: 'العربية', sv: 'Svenska', fi: 'Suomi',
    nb: 'Norsk bokmål', da: 'Dansk'
  };
  const label = { es:'Idioma', en:'Language', de:'Sprache', nl:'Taal', fr:'Langue',
    it:'Lingua', pl:'Język', uk:'Мова', ru:'Язык', 'zh-Hans':'语言', ar:'اللغة',
    sv:'Språk', fi:'Kieli', nb:'Språk', da:'Sprog' };
  const storageKey = 'coco.language.v1';
  const base = new URL('./', document.currentScript.src);
  const packs = new Map([['es', Promise.resolve({strings:{}})]]);
  const select = document.createElement('select');
  const bar = document.createElement('div');
  const sources = new WeakMap();
  let current = 'es', activePack = {strings:{}}, generation = 0;

  function supported(value) {
    const code = String(value || '').toLowerCase().split('-')[0];
    if (code === 'zh') return 'zh-Hans';
    if (code === 'no') return 'nb';
    return Object.hasOwn(languages, code) ? code : null;
  }
  function stored() {
    try { return supported(localStorage.getItem(storageKey)); } catch { return null; }
  }
  function message(source, args) {
    const template = Object.hasOwn(activePack.strings, source) ? activePack.strings[source] : source;
    return args ? template.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(args, key) ? String(args[key]) : match) : template;
  }
  function localize(value) {
    const key = value.trim().replace(/\s+/g, ' ');
    let translated = message(key);
    if (translated === key) {
      for (const prefix of ['Inicia sesión para abrir ','Copiar enlace de ']) {
        if (key.startsWith(prefix)) {
          translated = message(prefix+'{game}',{game:message(key.slice(prefix.length))});
          break;
        }
      }
    }
    if (translated === key) {
      const decoration = key.match(/^(\p{Extended_Pictographic}\uFE0F?\s+)(.+)$/u);
      if (decoration) translated = decoration[1]+message(decoration[2]);
    }
    if (translated === key) return value;
    return value.replace(/\S[\s\S]*\S|\S/, () => translated);
  }
  function render(node, slot, read, write) {
    const value = read();
    if (!value || !value.trim()) return;
    let bindings = sources.get(node);
    if (!bindings) { bindings = new Map(); sources.set(node, bindings); }
    const previous = bindings.get(slot);
    const source = previous && previous.output === value ? previous.source : value;
    const output = current === 'es' ? source : localize(source);
    if (value !== output) write(output);
    bindings.set(slot,{source,output});
  }
  function sourceText(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      const saved = sources.get(node)?.get('text');
      return saved && node.data === saved.output ? saved.source : node.data;
    }
    return Array.from(node.childNodes).map(sourceText).join('');
  }
  const authored = '[data-coco-copy],[data-coco-attrs]';
  const spanishGames = new Set(['sopa','crucigrama','palabras','cocomed','verdadero','tiempo']);
  const staticControls = 'button,label,option[value],legend,summary,nav a,th,h1,h2,h3,h4,[placeholder],[aria-label]';
  // Public editorial pages contain no profile data. In the application only
  // explicitly authored messages and control labels are eligible.
  const privateAreas = '.cocoMedOverlay,.cocoV16086ExportIdentity,.cocoV16083Person,[data-player-name],#lobbyPlayers,#winner,#topName,#bottomName,#playingAs,#roomCode,#notes,.chat-message,.eterna-thread,[data-coco-verbatim],textarea,[contenteditable]:not([contenteditable=false]),[data-coco-verbatim],[data-coco-language-menu],script,style,svg,code,pre,kbd,canvas';
  const publicElements = 'a,b,strong,em,i,li,dt,dd,small,span,p,figcaption,footer,title,button,label,option,legend,summary,th,h1,h2,h3,h4,h5,ol,ul,details,img,[aria-label],[placeholder],meta[name="description"],meta[property="og:description"],meta[property="og:title"],meta[property="og:image:alt"],meta[name="twitter:description"],meta[name="twitter:title"]';
  const shellCopy = '.loginCard p,.loginCard .cocoEyebrow,.loginDecorTitle,.retosCard .cocoEyebrow,.cocoDescripcion,.cocoFreemiumV16084 p,.cocoFreemiumV16084 strong,.cocoFamilyHero small,.cocoReportNavigation button,.cocoArcadeProgressMeta span,.cocoFamilyV129 header span,.cocoFamiliaBtn,.cocoFamilyLoading,#coco-startup-status p';
  const publicHome = ':is(#cocoHomeFinal3,.loginCard,.retosCard,.cocoInstallEntryCard,.cocoFreemiumV16084,#eternaLauncherV159,.cocoGameCard,.cocoMiniJuego)';
  const homeCopy = publicHome+' :is(b,h2,h3,strong,small,p,span,button,a,[aria-label],[alt])';
  const reportCopy = ':is(.cocoFamilyV129,[data-family-integral-report],.cocoV16083Section,.cocoReportDocument,.rankingTitulo,.rankingNota,.navegacionJugador) :is(h2,h3,h4,b,strong,small,p,span,li,th,button,a)';
  const authBoxes = '.caja:has(#oMail),.caja:has(#rNom),.caja:has(#nPas),.loginCard';
  const authCopy = ['p','label','b','.aviso','small'].map(t => ':is('+authBoxes+') '+t).join(',');
  let watching;
  function each(root,query,callback) {
    if (root.matches?.(query)) callback(root);
    root.querySelectorAll?.(query).forEach(callback);
  }
  function shareUrl(value) {
    const url = new URL(value,location.origin);
    if (current !== 'es') url.searchParams.set('lang',current);
    return url.href;
  }
  async function readPack(tag) {
    const url = new URL('packs/'+tag+'.json',base);
    // Also works on the first visit before the service worker controls this page.
    let cache;
    try { cache = await window.caches?.open('coco-language-files-v1'); } catch {}
    function validate(pack) {
      if (pack?.locale !== tag || !pack.strings || typeof pack.strings !== 'object') throw Error('invalid locale');
      return pack;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw Error('locale unavailable');
      const cached = cache && response.clone();
      const pack = validate(await response.json());
      if (cache) try { await cache.put(url,cached); } catch {}
      return pack;
    } catch (error) {
      const response = await cache?.match(url);
      if (!response) throw error;
      return validate(await response.json());
    }
  }
  function accountReturn(recovery=false) {
    const url = new URL('/',location.origin);
    if (recovery) url.searchParams.set('coco_recuperar','1');
    if (current !== 'es') url.searchParams.set('lang',current);
    return url.href;
  }
  function gameId(card) {
    if (card.dataset.cocoJuego) return card.dataset.cocoJuego;
    const href = card.querySelector('a[href*="/juego/"]')?.getAttribute('href') || '';
    return href.match(/\/juego\/([^/?#]+)/)?.[1] || '';
  }
  function markGame(card, id) {
    let badge = Array.from(card.children).find(el => el.hasAttribute('data-game-language'));
    if (current === 'es' || !spanishGames.has(id)) { badge?.remove(); return; }
    if (!badge) { badge = document.createElement('small'); badge.setAttribute('data-game-language','es'); card.append(badge); }
    const text = message('Juego en español');
    if (badge.textContent !== text) badge.textContent = text;
  }
  function refresh(root = document) {
    if (!document.body) return;
    const page = document.body.dataset.cocoLanguagePage;
    const query = page === 'public' || page === 'game' ? publicElements : [authored,staticControls,shellCopy,authCopy,homeCopy,reportCopy].join(',');
    each(root,query,el => {
      if (el.closest(privateAreas+',.loginDecorTitle') || el.hasAttribute('data-game-language')) return;
      // Card titles and some legacy controls are used for DOM-based identification.
      // Their translation is handled by the owning renderer once a stable id exists.
      if (!page && el.closest('.cocoGameCard,.cocoMiniJuego') && !el.closest('[data-coco-juego],[data-coco-chess-entry],[data-coco-city-entry],[data-coco-naval-entry],[data-coco-generala-entry]')) return;
      // Nicknames, room codes, board cells and questionnaire answers are model values.
      if (el.closest('[role=grid],.cocoCrossBoard,#board,#lobbyPlayers,.player,.answer-review,#history') || el.matches('[data-answer],#turnTitle,#turn,#winner,#playingAs,#playingName')) return;
      if (el.tagName !== 'OPTION' || el.hasAttribute('value')) {
        for (const n of el.childNodes) if (n.nodeType === Node.TEXT_NODE) render(n,'text',() => n.data,v => {n.data=v;});
      }
      const attrs = el.tagName === 'META' ? ['content'] : ['placeholder','aria-label','alt','title'];
      for (const a of attrs) if (el.hasAttribute(a)) render(el,a,() => el.getAttribute(a),v => el.setAttribute(a,v));
    });
    each(root,'[data-coco-juego],[data-game-card]',card => markGame(card,gameId(card)));
    each(root,'.loginDecorTitle',el => {
      const text = current === 'es' ? '¡Activa tu supercerebro!' : message('Activa tu supercerebro');
      if (el.textContent !== text) {
        if (current === 'es') {
          const strong = document.createElement('b'); strong.textContent = 'supercerebro';
          el.replaceChildren(document.createTextNode('¡Activa tu '),strong,document.createTextNode('!'));
        } else { el.textContent = text; }
      }
    });
    const game = location.pathname.match(/\/juego\/([^/]+)/)?.[1];
    if (game && root === document) { const cta = document.querySelector('.hero .actions,.hero-copy,.hero h1')?.parentElement; if (cta) markGame(cta,game); }
  }
  function observe() {
    if (watching || !document.body || current === 'es') return;
    watching = new MutationObserver(changes => {
      const roots = new Set();
      for (const change of changes) {
        if (change.target.closest?.('[data-coco-language-menu],[data-game-language]')) continue;
        for (const node of change.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) roots.add(node);
          else if (node.nodeType === Node.TEXT_NODE && node.parentElement) roots.add(node.parentElement);
        }
      }
      for (const node of roots) if (node.isConnected && !roots.has(node.parentElement)) refresh(node);
    });
    watching.observe(document.body,{childList:true,subtree:true});
  }
  function reportDocument(html) {
    if (current === 'es') return html;
    const doc = new DOMParser().parseFromString(html,'text/html');
    doc.documentElement.lang = current; doc.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
    for (const el of doc.querySelectorAll(publicElements)) {
      if (el.closest(privateAreas)) continue;
      for (const node of el.childNodes) if (node.nodeType === Node.TEXT_NODE) node.data = localize(node.data);
      for (const attr of ['title','aria-label','alt']) if (el.hasAttribute(attr)) el.setAttribute(attr,localize(el.getAttribute(attr)));
    }
    return '<!doctype html>'+doc.documentElement.outerHTML;
  }
  const params = new URLSearchParams(location.search);
  const requested = supported(params.get('lang')) || stored() || 'es';

  async function setLanguage(tag, persist = true) {
    tag = supported(tag);
    if (!tag) return false;
    const attempt = ++generation;
    if (!packs.has(tag)) {
      packs.set(tag, readPack(tag).catch(error => { packs.delete(tag); throw error; }));
    }
    let pack;
    try { pack = await packs.get(tag); }
    catch {
      if (attempt === generation) {
        select.value = current;
        bar.querySelector('[role=status]').textContent = '⚠ ' + languages[tag] + ' · ' + message('Idioma no disponible sin conexión.');
      }
      return false;
    }
    if (attempt !== generation) return false;
    current = tag; activePack = pack;
    if (persist) {
      try { localStorage.setItem(storageKey,tag); } catch {}
      if (new URLSearchParams(location.search).has('lang')) {
        const url = new URL(location.href); url.searchParams.set('lang',tag);
        window.history.replaceState(window.history.state,'',url);
      }
    }
    document.documentElement.lang = tag;
    document.documentElement.dir = tag === 'ar' ? 'rtl' : 'ltr';
    select.value = tag; select.setAttribute('aria-label',label[tag]); status.textContent = '';
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.href = tag === 'es' ? new URL('../manifest.webmanifest',base) : new URL('manifests/'+tag+'.webmanifest',base);
    if (tag === 'es') { watching?.disconnect(); watching = null; } else observe();
    refresh();
    window.dispatchEvent(new CustomEvent('coco:language',{detail:{locale:tag}}));
    return true;
  }
  bar.className = 'coco-language-bar';
  const icon = document.createElement('span'); icon.textContent = '◎'; icon.setAttribute('aria-hidden','true');
  const status = document.createElement('span'); status.setAttribute('role','status');
  Object.entries(languages).forEach(([id,name]) => { const option = new Option(name,id); option.lang = id; select.add(option); });
  select.setAttribute('aria-label',label.es);
  select.addEventListener('change',() => { status.textContent = ''; void setLanguage(select.value); });
  bar.append(status,icon,select);
  function mount() {
    const slot = document.querySelector('[data-coco-language-menu]');
    if (slot) slot.append(bar);
    observe();
    refresh();
  }
  document.addEventListener('DOMContentLoaded',mount,{once:true});
  window.addEventListener('storage',event => {
    const next = supported(event.newValue);
    if (event.key === storageKey && next && next !== current) void setLanguage(next,false);
  });
  window.CocoLocale = {get tag(){return current;},
    t:message, shareUrl, accountReturn, spanishGame:id=>spanishGames.has(id), sourceText, reportDocument, refresh, setLanguage, languages:Object.freeze(languages)};
  if (requested !== 'es') window.CocoFirstPaint?.hold('language');
  window.CocoLocale.ready = setLanguage(requested,Boolean(supported(params.get('lang')))).finally(() => {
    if (requested !== 'es') window.CocoFirstPaint?.settled('language');
  });
})();
