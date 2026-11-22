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
  function pinDigits(value) {
    // Use the same four digits for input from Arabic, Persian and full-width keyboards.
    return String(value || '').replace(/[٠-٩۰-۹０-９]/g, digit => {
      const point = digit.charCodeAt(0);
      const zero = point >= 0xff10 ? 0xff10 : point >= 0x06f0 ? 0x06f0 : 0x0660;
      return String(point - zero);
    }).replace(/\D/g, '');
  }
  function stored() {
    try { return supported(localStorage.getItem(storageKey)); } catch { return null; }
  }
  function message(source, args) {
    const chess = document.body?.hasAttribute('data-coco-chess') && activePack.chess;
    const template = chess && Object.hasOwn(chess,source) ? chess[source]
      : Object.hasOwn(activePack.strings,source) ? activePack.strings[source] : source;
    return args ? template.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(args, key) ? String(args[key]) : match) : template;
  }
  function schoolYear(value) {
    // Translate the configured Spanish stages, preserving custom school descriptions.
    const standard = /^(?:Infantil · (?:0–2|[345]) años|[1-6]º de Primaria|[1-4]º de ESO|[12]º de Bachillerato|Curso no indicado)$/u;
    return standard.test(value) ? message(value) : value;
  }
  const reportScope = '[data-family-integral-report],.cocoV16083ReportBody,.cocoReportDocument';
  const reportSkills = ['Cálculo y patrones','Memoria','Atención y estrategia','Rapidez con precisión','Lenguaje','Percepción y coordinación'];
  function reportStatistic(key) {
    const number = value => Number(value).toLocaleString(current);
    const count = key.match(/^(?:(.+?) · )?(\d+) (interacción|interacciones|observación|observaciones)$/u);
    if (count) {
      const label = message(count[3].startsWith('inter') ? 'Interacciones' : 'Observaciones');
      return (count[1] ? message(count[1])+' · ' : '') + label + ': '+number(count[2]);
    }
    const ratio = key.match(/^(\d+)\/(\d+)$/);
    if (ratio) return number(ratio[1])+'/'+number(ratio[2]);
    if (/^\d+%$/.test(key)) return new Intl.NumberFormat(current,{style:'percent'}).format(Number(key.slice(0,-1))/100);
    if (/^\d+$/.test(key)) return number(key);
    return null;
  }
  function reportSkill(value) {
    return message(reportSkills.find(s => s.toLowerCase() === value) || value);
  }
  function reportPhrase(key, element) {
    const templates = [
      ['Más avance en: ', 'Más avance en: {topic}'],
      ['Practicar: ', 'Practicar: {topic}'],
      ['Se desenvuelve mejor en ', 'Se desenvuelve mejor en {topic}']
    ];
    for (const [prefix, template] of templates) {
      if (key.startsWith(prefix)) return message(template,{topic:message(key.slice(prefix.length))});
    }
    const score = key.match(/^Señal observada · (\d+)\/100$/);
    if (score) return message('Señal observada · {score}/100',{score:Number(score[1]).toLocaleString(current)});
    const training = key.match(/^Con Coco ha entrenado (.+?)\.(?: (.*))?$/);
    if (training) {
      // Some skill names contain “y”, so recognise the full names before reading separators.
      let remaining = training[1];
      const skills = [];
      while (remaining) {
        const skill = reportSkills.find(name => remaining.startsWith(name.toLowerCase()));
        if (!skill) break;
        skills.push(message(skill));
        remaining = remaining.slice(skill.length).replace(/^(?:, | y )/,'');
      }
      if (!remaining && skills.length) {
        const sentence = message('Habilidades practicadas: {skills}.',{skills:new Intl.ListFormat(current).format(skills)});
        return training[2] ? sentence+' '+message(training[2]) : sentence;
      }
    }
    const alternate = key.match(/^Puede alternar (.+?) con (.+?) en días distintos\.$/);
    if (alternate) return message('Practicar en días distintos: {a} / {b}.',{a:reportSkill(alternate[1]),b:reportSkill(alternate[2])});
    const summary = key.match(/^Ha trabajado (.+?)(\. Solo valoramos los conceptos con al menos dos interacciones; el resto se muestra como actividad, sin inventar conclusiones\.|, pero todavía necesitamos más de una interacción sobre un mismo concepto antes de sacar conclusiones\.)$/);
    if (summary) {
      const recorded = element?.getAttribute('data-coco-report-subjects');
      const topics = recorded ? JSON.parse(recorded) : summary[1].split(', ');
      const list = new Intl.ListFormat(current).format(topics.map(topic => message(topic)));
      const guidance = summary[2].startsWith(',')
        ? 'Todavía hace falta repetir un mismo concepto para valorar el progreso.'
        : 'Solo se valoran conceptos con al menos dos interacciones. El resto figura como actividad.';
      return message('Se ha practicado: {topics}.',{topics:list})+' '+message(guidance);
    }
    return key;
  }
  function gamePhrase(key) {
    const number = value => Number(value).toLocaleString(current);
    const question = key.match(/^Frase (\d+) de (\d+)$/);
    if (question) return message('Frase {n} de {total}',{n:number(question[1]),total:number(question[2])});
    const answered = key.match(/^(\d+) respondidas$/);
    if (answered) return message('Respuestas: {n}',{n:number(answered[1])});
    const die = key.match(/^Dado (\d+)(?:: (\d+))?(, guardado)?$/);
    if (die) return [message('Dado {n}',{n:number(die[1])}),die[2] && number(die[2]),die[3] && message('Dado guardado')].filter(Boolean).join(' · ');
    const round = key.match(/^(Ronda|Tirada) (\d+) de (\d+)$/i);
    if (round) return message(round[1].toLowerCase() === 'ronda' ? 'Ronda {n} de {total}' : 'Tirada {n} de {total}',{n:number(round[2]),total:number(round[3])});
    const roll = key.match(/^Volver a tirar (\d+) dados?$/);
    if (roll) return message('Dados que volver a tirar: {n}',{n:number(roll[1])});
    const lobby = key.match(/^(\d+) de (\d+) jugadores · Mínimo (\d+)$/);
    if (lobby) return message('Jugadores: {n}/{total} · Mínimo {min}',{n:number(lobby[1]),total:number(lobby[2]),min:number(lobby[3])});
    return key;
  }
  function localize(value, report = false, game = false, element) {
    const key = value.trim().replace(/\s+/g, ' ');
    if (element?.matches('select[data-stage] > option') && element.value) {
      return message('Etapa escolar: '+key);
    }
    if (element?.hasAttribute('data-coco-calculated-age')) {
      const age = key.match(/^(\d+) años?$/u);
      if (age) return new Intl.NumberFormat(current,{style:'unit',unit:'year',unitDisplay:'long'}).format(Number(age[1]));
    }
    let translated = (report && reportStatistic(key)) || message(key);
    if (translated === key && key.startsWith('Tabla independiente dedicada exclusivamente a ') && key.endsWith('.')) {
      const gameName = key.slice('Tabla independiente dedicada exclusivamente a '.length,-1);
      translated = message('Clasificación')+' · '+message(gameName);
    }
    if (report && translated === key) translated = reportPhrase(key,element);
    if (game && translated === key) translated = gamePhrase(key);
    if (translated === key) {
      for (const prefix of ['Inicia sesión con tu cuenta gratuita para abrir ','Inicia sesión para abrir ','Copiar enlace de ']) {
        if (key.startsWith(prefix)) {
          translated = message(prefix+'{game}',{game:message(key.slice(prefix.length))});
          break;
        }
      }
    }
    if (translated === key) {
      const decoration = key.match(/^((?:\p{Extended_Pictographic}|✦)\uFE0F?\s+)(.+)$/u);
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
    const owner = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const canonical = slot === 'text'
      ? owner?.childNodes.length === 1 && owner.getAttribute('data-coco-source-text')
      : node.getAttribute('data-coco-source-'+slot);
    const source = canonical || (previous && previous.output === value ? previous.source : value);
    const output = current === 'es' ? source : localize(source,Boolean(owner.closest(reportScope)),document.body.dataset.cocoLanguagePage === 'game',owner);
    if (value !== output) write(output);
    bindings.set(slot,{source,output});
  }
  function sourceText(node) {
    if (!node) return '';
    if (current === 'es') return node.textContent || '';
    if (node.nodeType === Node.TEXT_NODE) {
      const saved = sources.get(node)?.get('text');
      return saved && node.data === saved.output ? saved.source : node.data;
    }
    return Array.from(node.childNodes).map(sourceText).join('');
  }
  const authored = '#rConsentText,#rConsentText a,.cocoLegalResumenRegistro,head title,.cocoFamilyError,[data-family-recover-msg],[data-coco-calculated-age],[data-coco-copy],[data-coco-attrs],.cocoRankingEmpty b,.cocoRankingEmpty span,.cocoRankingSummary span:not([data-coco-number]),[data-ranking-description],.cocoGameRankingShell header span';
  const spanishGames = new Set(['sopa','crucigrama','palabras','cocomed','verdadero','tiempo','bank']);
  const staticControls = 'button,label,option[value],legend,summary,nav a,th,h1,h2,h3,h4,[placeholder],[aria-label]';
  // Public editorial pages contain no profile data. In the application only
  // explicitly authored messages and control labels are eligible.
  const privateAreas = '.cocoMedOverlay,.cocoV16086ExportIdentity,.cocoV16083Person,[data-player-name],#lobbyPlayers,#winner,#topName,#bottomName,#playingAs,#roomCode,#notes,.chat-message,.eterna-thread,[data-et-name],[data-et-chat],textarea,[contenteditable]:not([contenteditable=false]),[data-coco-verbatim],[data-coco-language-menu],script,style,svg,code,pre,kbd,canvas';
  const publicElements = '.resumen,.alerta,.card,.lead,.note,[role=note],[role=status],#notice,#toast,#lastResult,#modalBody,#gameMeta,#levelLabel,a,b,strong,em,i,li,dt,dd,small,span,p,figcaption,footer,title,button,label,option,legend,summary,th,h1,h2,h3,h4,h5,ol,ul,details,img,[aria-label],[placeholder],meta[name="description"],meta[property="og:description"],meta[property="og:title"],meta[property="og:image:alt"],meta[name="twitter:description"],meta[name="twitter:title"]';
  const shellCopy = '.loginCard p,.loginCard .cocoEyebrow,.loginDecorTitle,.retosCard .cocoEyebrow,.cocoDescripcion,.cocoFreemiumV16084 p,.cocoFreemiumV16084 strong,.cocoFamilyHero small,.cocoReportNavigation button,.cocoArcadeProgressMeta span,.cocoFamilyV129 header span,.cocoFamiliaBtn,.cocoFamilyLoading,#coco-startup-status p';
  const publicHome = ':is(#cocoHomeFinal3,.loginCard,.retosCard,.cocoInstallEntryCard,.cocoFreemiumV16084,#eternaLauncherV159,.cocoGameCard,.cocoMiniJuego,#coco-game-guides)';
  const homeCopy = publicHome+' :is(b,h2,h3,strong,small,p,span,button,a,[aria-label],[alt])';
  const reportCopy = ':is(.cocoFamilyV129,[data-family-integral-report],.cocoV16083Section,.cocoReportDocument,.rankingTitulo,.rankingNota,.navegacionJugador) :is(h2,h3,h4,b,strong,small,p,span,li,th,button,a)';
  const gameplayCopy = '[data-coco-playing] :is(p,small,button,label,legend,h1,h2,h3,.instruccion,.pregunta,.textoReto,.aviso,.titulo)';
  const familyAccessCopy = '.eternaLaunchV16068 :is(p,label,button,h2,strong,.eternaLaunchV16068Info,.eternaLaunchV16068Msg)';
  const authBoxes = '.caja:has(#oMail),.caja:has(#rNom),.caja:has(#nPas),.loginCard';
  const authCopy = ['p','label','b','.aviso','small'].map(t => ':is('+authBoxes+') '+t).join(',');
  let watching;
  function each(root,query,callback) {
    if (root.matches?.(query)) callback(root);
    root.querySelectorAll?.(query).forEach(callback);
  }
  function shareUrl(value) {
    const url = new URL(value,location.origin);
    if (current !== 'es' || url.searchParams.has('lang')) url.searchParams.set('lang',current);
    return url.href;
  }
  async function readPack(tag) {
    const url = new URL('packs/'+tag+'.json',base);
    url.searchParams.set('v','20261122-5');
    // Also works on the first visit before the service worker controls this page.
    let cache;
    try { cache = await window.caches?.open('coco-language-files-v1'); } catch {}
    function validate(pack) {
      if (pack?.locale !== tag || !pack.strings || typeof pack.strings !== 'object') throw Error('invalid locale');
      return pack;
    }
    try {
      const exact = await cache?.match(url);
      if (exact) return validate(await exact.json());
    } catch { /* Invalid or evicted entry: load it again. */ }
    try {
      const response = await fetch(url);
      if (!response.ok) throw Error('locale unavailable');
      const cached = cache && response.clone();
      const pack = validate(await response.json());
      if (cache) try { await cache.put(url,cached); } catch {}
      return pack;
    } catch (error) {
      const response = await cache?.match(url,{ignoreSearch:true});
      if (!response) throw error;
      return validate(await response.json());
    }
  }
  function accountReturn(recovery=false) {
    const url = new URL('/',location.origin);
    if (recovery) url.searchParams.set('coco_recuperar','1');
    url.searchParams.set('lang',current);
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
  function bannerText(tag, source) {
    const el = document.createElement(tag);
    el.setAttribute('data-coco-copy','');
    // The home renderer clones its decoration. Preserve the authored source in
    // the clone as well, rather than treating its current translation as source.
    el.setAttribute('data-coco-source-text',source);
    el.textContent = source;
    return el;
  }
  function localizeHomeArtwork(root) {
    each(root,'#cocoApp .eternaLauncherVisualFinal3',visual => {
      let art = visual.querySelector(':scope > .cocoLocalizedHero');
      if (current === 'es') {
        if (visual.hasAttribute('data-coco-banner-background')) {
          const value = visual.getAttribute('data-coco-banner-background');
          if (value) visual.style.setProperty('background-image',value,visual.getAttribute('data-coco-banner-background-priority') || '');
          else visual.style.removeProperty('background-image');
          visual.removeAttribute('data-coco-banner-background');
          visual.removeAttribute('data-coco-banner-background-priority');
        }
        art?.remove(); visual.removeAttribute('data-coco-localized-banner');
        return;
      }
      if (!art) {
        art = document.createElement('div'); art.className = 'cocoLocalizedHero';
        const img = document.createElement('img'); img.className = 'cocoLocalizedHeroArt';
        img.src = new URL('../share/premium-v160126/art/conecta.webp',base);
        img.width = 1200; img.height = 630; img.alt = ''; img.decoding = 'async';
        const caption = document.createElement('div'); caption.setAttribute('data-coco-banner-caption','eterna');
        caption.append(bannerText('b','Juegos para la mente y apoyo escolar'),bannerText('span','Con Coco y Eterna.'));
        art.append(img,caption); visual.append(art);
      }
      if (!visual.hasAttribute('data-coco-banner-background')) {
        visual.setAttribute('data-coco-banner-background',visual.style.getPropertyValue('background-image'));
        visual.setAttribute('data-coco-banner-background-priority',visual.style.getPropertyPriority('background-image'));
      }
      // The late identity stylesheet also declares its Spanish artwork with
      // !important. The inline override keeps that decoration out of every locale.
      visual.style.setProperty('background-image','none','important');
      visual.setAttribute('data-coco-localized-banner','eterna');
    });
    each(root,'#cocoApp .loginDecorStage',stage => {
      // Only the fixed decoration on the access page and its home clone.
      // The actual achievement collection, unlock levels and downloads stay intact.
      if (!stage.querySelector(':scope > .loginPoster')) return;
      let art = stage.querySelector(':scope > .cocoLocalizedPoster');
      if (current === 'es') {
        art?.remove(); stage.removeAttribute('data-coco-localized-banner');
        return;
      }
      if (!art) {
        art = document.createElement('div'); art.className = 'cocoLocalizedPoster';
        const img = document.createElement('img'); img.className = 'cocoLocalizedPosterArt';
        img.src = new URL('../assets/brand/coco-premium-v160127/icon-512.png',base);
        img.width = 512; img.height = 512; img.decoding = 'async';
        img.alt = 'Tarjeta Coco: Tu primer gran paso';
        img.setAttribute('data-coco-source-alt',img.alt);
        const caption = document.createElement('div'); caption.setAttribute('data-coco-banner-caption','coco');
        caption.append(bannerText('b','Coco'),bannerText('span','Tu primer gran paso'));
        art.append(img,caption); stage.append(art);
      }
      // The Spanish image retains its src/srcset/error fallback while hidden;
      // an image error cannot bring its embedded Spanish text back into view.
      stage.setAttribute('data-coco-localized-banner','coco');
    });
  }
  function refresh(root = document) {
    if (!document.body) return;
    localizeHomeArtwork(root);
    const page = document.body.dataset.cocoLanguagePage;
    const query = page === 'public' || page === 'game' ? publicElements : [authored,staticControls,shellCopy,authCopy,familyAccessCopy,gameplayCopy,homeCopy,reportCopy,'.cocoV16086Pending,.rankingNota'].join(',');
    each(root,query,el => {
      if (el.tagName === 'CANVAS' && el.hasAttribute('aria-label')) render(el,'aria-label',()=>el.getAttribute('aria-label'),v=>el.setAttribute('aria-label',v));
      if (el.closest(privateAreas+',.loginDecorTitle') || el.hasAttribute('data-game-language')) return;
      // Card titles and some legacy controls are used for DOM-based identification.
      // Their translation is handled by the owning renderer once a stable id exists.
      if (!page && el.closest('.cocoGameCard,.cocoMiniJuego') && !el.closest('[data-coco-juego],[data-coco-chess-entry],[data-coco-city-entry],[data-coco-naval-entry],[data-coco-generala-entry],[data-coco-suggestion],.cocoMiniSuggestion')) return;
      // Nicknames, room codes, board cells and questionnaire answers are model values.
      if (el.closest('[role=grid],.cocoCrossBoard,#board,#lobbyPlayers,.player,.answer-review,#history') || el.matches('[data-answer],#turnTitle:not([data-coco-copy]),#turn,#winner,#playingAs,#playingName')) return;
      if (el.tagName !== 'OPTION' || el.hasAttribute('value')) {
        for (const n of el.childNodes) if (n.nodeType === Node.TEXT_NODE) render(n,'text',() => n.data,v => {n.data=v;});
      }
      const attrs = el.tagName === 'META' ? ['content'] : ['placeholder','aria-label','alt','title'];
      for (const a of attrs) if (el.hasAttribute(a)) render(el,a,() => el.getAttribute(a),v => el.setAttribute(a,v));
    });
    const pageLinks = document.querySelector('[data-coco-original-document]')
      ? 'nav a[href],main a[href]'
      : 'nav a[href],.actions a[href],.closing a.button[href]';
    if (page === 'public' || page === 'game') each(root,pageLinks,link => {
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#') || link.hasAttribute('download') || link.hasAttribute('data-coco-original-document')) return;
      const url = new URL(raw,document.baseURI);
      if (url.origin !== location.origin || !/\/(?:[^.]*|[^/]*\.html)$/.test(url.pathname)) return;
      if (current === 'es' && !url.searchParams.has('lang')) return;
      if (url.searchParams.get('lang') !== current) {
        url.searchParams.set('lang',current);
        link.setAttribute('href',url.pathname+url.search+url.hash);
      }
    });
    each(root,'time[data-coco-date]',el => {
      const date = new Date(Number(el.dataset.cocoDate));
      if (Number.isFinite(date.getTime())) {
        const value = date.toLocaleDateString(current);
        if (el.textContent !== value) el.textContent = value;
      }
    });
    each(root,'[data-ranking-stat]',el => {
      const label = message(el.dataset.rankingStat === 'plays' ? 'Partidas jugadas' : 'Mejor puntuación');
      if (el.textContent !== label) el.textContent = label;
    });
    each(root,'[data-coco-number]',el => {
      const n=Number(el.dataset.cocoNumber);
      if (Number.isFinite(n)) {
        const value=n.toLocaleString(current);
        if (el.textContent!==value) el.textContent=value;
      }
    });
    each(root,'[data-coco-current-course][data-school-year]',el => {
      const {schoolYear:year,region} = el.dataset;
      const text = year ? message('Curso actual:')+' '+schoolYear(year)+(region?' · '+region:'')
                        : message('Curso actual: pendiente de configurar en Eterna');
      if (el.textContent !== text) el.textContent = text;
    });
    each(root,'.cocoMedOverlay',el=>{el.lang='es';el.dir='ltr';});
    each(root,'[data-coco-juego],[data-game-card]',card => markGame(card,gameId(card)));
    each(root,'[data-coco-original-document]',el => {el.hidden = current === 'es';});
    each(root,'[data-eterna-language-note],[data-questionnaire-language]',el => {
      el.hidden = current === 'es';
      const source = el.hasAttribute('data-questionnaire-language') ? 'Cuestionario en español' : 'Las sesiones de Eterna se realizan en español.';
      const note = el.hidden ? '' : message(source);
      if (el.textContent !== note) el.textContent = note;
    });
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
    const brandSuffix = ' · Coco en Forma';
    if (doc.title.endsWith(brandSuffix)) doc.title = message(doc.title.slice(0, -brandSuffix.length)) + brandSuffix;
    for (const el of doc.querySelectorAll(publicElements)) {
      if (el.closest(privateAreas)) continue;
      for (const node of el.childNodes) if (node.nodeType === Node.TEXT_NODE) node.data = localize(node.data,true,false,el);
      for (const attr of ['title','aria-label','alt']) if (el.hasAttribute(attr)) el.setAttribute(attr,localize(el.getAttribute(attr)));
    }
    return '<!doctype html>'+doc.documentElement.outerHTML;
  }
  const params = new URLSearchParams(location.search);
  const explicitLanguage = supported(params.get('lang'));
  const installLanguage = supported(params.get('pwa_lang'));
  const rememberedLanguage = stored();
  const originalDocument = params.get('document_original') === 'es' && Boolean(document.querySelector('[data-coco-original-document]'));
  const requested = originalDocument ? 'es' : (explicitLanguage || rememberedLanguage || installLanguage || 'es');

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
    }
    // A change from another tab must also survive reloading an explicit language URL.
    const url = new URL(location.href);
    const keepOriginal = !persist && originalDocument && url.searchParams.get('document_original') === 'es';
    if (!keepOriginal && (url.searchParams.has('lang') || url.searchParams.has('document_original'))) {
      url.searchParams.delete('document_original'); url.searchParams.set('lang',tag);
      window.history.replaceState(window.history.state,'',url);
    }
    document.documentElement.lang = tag;
    document.documentElement.dir = tag === 'ar' ? 'rtl' : 'ltr';
    select.value = tag; select.setAttribute('aria-label',label[tag]); status.textContent = '';
    accountCaption.textContent = label[tag];
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.href = tag === 'es' ? new URL('../manifest.webmanifest',base) : new URL('manifests/'+tag+'.webmanifest',base);
    if (tag === 'es') { watching?.disconnect(); watching = null; } else observe();
    refresh();
    window.dispatchEvent(new CustomEvent('coco:language',{detail:{locale:tag}}));
    return true;
  }
  bar.className = 'coco-language-bar';
  const status = document.createElement('span'); status.setAttribute('role','status');
  Object.entries(languages).forEach(([id,name]) => { const option = new Option(name,id); option.lang = id; select.add(option); });
  select.setAttribute('aria-label',label.es);
  select.addEventListener('change',() => { status.textContent = ''; void setLanguage(select.value); });
  bar.append(status,select);
  const accountSlot = document.createElement('div');
  accountSlot.setAttribute('data-coco-language-menu','');
  accountSlot.setAttribute('data-coco-language-account','');
  const accountCaption = document.createElement('span');
  accountCaption.className = 'coco-language-caption';
  accountCaption.textContent = label.es;
  accountSlot.append(accountCaption);
  let publicSlot, menuObserver;
  function placeLanguageMenu() {
    if (!publicSlot?.isConnected) publicSlot = document.querySelector('[data-coco-language-menu]:not([data-coco-language-account])');
    const menu = document.querySelector('#cocoApp .navegacionJugador');
    if (menu) {
      if (accountSlot.parentElement !== menu) menu.prepend(accountSlot);
      if (bar.parentElement !== accountSlot) accountSlot.append(bar);
    } else {
      if (publicSlot && bar.parentElement !== publicSlot) publicSlot.append(bar);
      if (accountSlot.isConnected) accountSlot.remove();
    }
    if (publicSlot && publicSlot.hidden !== Boolean(menu)) publicSlot.hidden = Boolean(menu);
  }
  function mount() {
    placeLanguageMenu();
    const app = document.getElementById('cocoApp');
    if (app && !menuObserver) {
      // The signed-in menu is rebuilt during navigation, including while using Spanish.
      menuObserver = new MutationObserver(placeLanguageMenu);
      menuObserver.observe(app,{childList:true,subtree:true});
    }
    observe();
    refresh();
  }
  document.addEventListener('DOMContentLoaded',mount,{once:true});
  window.addEventListener('storage',event => {
    const next = supported(event.newValue);
    if (new URLSearchParams(location.search).get('document_original') === 'es' && originalDocument) return;
    if (event.key === storageKey && next && next !== current) void setLanguage(next,false);
  });
  window.CocoLocale = {get tag(){return current;},
    t:message, schoolYear, pinDigits, shareUrl, accountReturn, spanishGame:id=>spanishGames.has(id), sourceText, reportDocument, refresh, setLanguage, languages:Object.freeze(languages)};
  if (requested !== 'es') window.CocoFirstPaint?.hold('language');
  window.CocoLocale.ready = setLanguage(requested,!originalDocument && Boolean(explicitLanguage || (!rememberedLanguage && installLanguage))).finally(() => {
    if (requested !== 'es') window.CocoFirstPaint?.settled('language');
  });
})();
