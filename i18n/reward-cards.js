(function () {
  'use strict';
  const root = '/assets/tarjetas/premium-v160127/';
  const slugs = ['coco','coco-en-racha','coco-campeon','coco-heroe','coco-astronauta','coco-leyenda'];
  const thresholds = [0,7,14,21,28,90];
  // Each locale supplies the six printed names and mottos in the artwork's original tier order.
  const copy = {
    es: ['Racha de Coco','Coco|Coco en racha|Coco campeón|Coco héroe|Coco astronauta|Coco leyenda','Tu primer gran paso|Constancia imparable|Has llegado a la cima|Valentía y esfuerzo|Explora nuevos retos|Nivel épico','Descargar protector','Disponible desde el inicio','Faltan {d}','Se desbloquea con {d}','Abrir','Bloqueada','Reintentar'],
    en: ['Coco’s streak','Coco|Coco on a roll|Coco the Champion|Coco the Hero|Coco the Astronaut|Coco the Legend','Your first big step|Keep the streak going|You’ve reached the top|Courage and effort|Explore new challenges|Epic level','Download wallpaper','Available from the start','{d} to go','Unlocks after {d}','Open','Locked','Try again'],
    de: ['Cocos Erfolgsserie','Coco|Coco in Bestform|Champion Coco|Held Coco|Astronaut Coco|Legende Coco','Dein erster großer Schritt|Bleib am Ball|Du hast den Gipfel erreicht|Mut und Einsatz|Entdecke neue Herausforderungen|Episches Level','Hintergrundbild herunterladen','Von Anfang an verfügbar','Noch {d}','Freigeschaltet nach {d}','Öffnen','Gesperrt','Erneut versuchen'],
    nl: ['Coco’s reeks','Coco|Coco op dreef|Coco de kampioen|Coco de held|Coco de astronaut|Coco de legende','Je eerste grote stap|Houd je reeks vast|Je hebt de top bereikt|Moed en inzet|Ontdek nieuwe uitdagingen|Episch niveau','Achtergrond downloaden','Vanaf het begin beschikbaar','Nog {d}','Beschikbaar na {d}','Openen','Vergrendeld','Opnieuw proberen'],
    fr: ['La série de Coco','Coco|Coco en pleine forme|Coco champion|Coco le héros|Coco astronaute|Coco la légende','Ton premier grand pas|Garde le rythme|Tu as atteint le sommet|Courage et persévérance|Relève de nouveaux défis|Niveau épique','Télécharger le fond d’écran','Disponible dès le début','Encore {d}','Se débloque après {d}','Ouvrir','Verrouillée','Réessayer'],
    it: ['La serie di Coco','Coco|Coco inarrestabile|Coco campione|Coco eroe|Coco astronauta|Coco leggenda','Il tuo primo grande passo|Continua così|Hai raggiunto la vetta|Coraggio e impegno|Esplora nuove sfide|Livello epico','Scarica lo sfondo','Disponibile da subito','Mancano {d}','Si sblocca dopo {d}','Apri','Bloccata','Riprova'],
    pl: ['Seria Coco','Coco|Coco w świetnej formie|Coco mistrz|Coco bohater|Coco astronauta|Coco legenda','Twój pierwszy wielki krok|Utrzymaj serię|Jesteś na szczycie|Odwaga i wysiłek|Odkrywaj nowe wyzwania|Epicki poziom','Pobierz tapetę','Dostępna od początku','Pozostało: {d}','Wymagana seria: {d}','Otwórz','Zablokowana','Spróbuj ponownie'],
    uk: ['Серія Коко','Коко|Коко на хвилі|Коко-чемпіон|Коко-герой|Коко-космонавт|Коко-легенда','Твій перший великий крок|Продовжуй серію|Ти на вершині|Сміливість і зусилля|Приймай нові виклики|Епічний рівень','Завантажити шпалери','Доступна від початку','Залишилося: {d}','Потрібна серія: {d}','Відкрити','Заблоковано','Спробувати ще раз'],
    ru: ['Серия Коко','Коко|Коко на волне|Коко-чемпион|Коко-герой|Коко-космонавт|Коко-легенда','Твой первый большой шаг|Продолжай серию|Ты на вершине|Смелость и старание|Принимай новые вызовы|Эпический уровень','Скачать обои','Доступна с самого начала','Осталось: {d}','Нужна серия: {d}','Открыть','Заблокировано','Попробовать снова'],
    'zh-Hans': ['可可连续挑战','可可|连胜可可|冠军可可|英雄可可|宇航员可可|传奇可可','迈出第一大步|坚持下去|你已登上顶峰|勇气与努力|探索新的挑战|史诗级成就','下载壁纸','初始即可使用','还需{d}','连续挑战{d}后解锁','打开','未解锁','重试'],
    ar: ['سلسلة إنجازات كوكو','كوكو|كوكو المتألق|كوكو بطل المسابقة|كوكو الشجاع|كوكو رائد الفضاء|كوكو الأسطورة','خطوتك الكبيرة الأولى|واصل سلسلة إنجازاتك|لقد وصلت إلى القمة|شجاعة ومثابرة|اكتشف تحديات جديدة|مستوى ملحمي','تنزيل الخلفية','متاحة منذ البداية','المدة المتبقية: {d}','تُفتح بعد {d}','فتح','مقفلة','إعادة المحاولة'],
    sv: ['Cocos svit','Coco|Coco i toppform|Mästaren Coco|Hjälten Coco|Astronauten Coco|Legenden Coco','Ditt första stora steg|Håll sviten vid liv|Du har nått toppen|Mod och kämpaglöd|Upptäck nya utmaningar|Episk nivå','Ladda ned bakgrundsbild','Tillgänglig från start','{d} kvar','Låses upp efter {d}','Öppna','Låst','Försök igen'],
    fi: ['Cocon peliputki','Coco|Coco vauhdissa|Mestari-Coco|Sankari-Coco|Astronautti-Coco|Legenda-Coco','Ensimmäinen suuri askeleesi|Pidä peliputki yllä|Olet päässyt huipulle|Rohkeutta ja sisua|Löydä uusia haasteita|Eeppinen taso','Lataa taustakuva','Saatavilla heti alussa','Jäljellä: {d}','Vaadittu peliputki: {d}','Avaa','Lukittu','Yritä uudelleen'],
    nb: ['Cocos spillrekke','Coco|Coco i storform|Mesteren Coco|Helten Coco|Astronauten Coco|Legenden Coco','Ditt første store steg|Hold rekken i gang|Du har nådd toppen|Mot og innsats|Utforsk nye utfordringer|Episk nivå','Last ned bakgrunnsbildet','Tilgjengelig fra start','{d} igjen','Låses opp etter {d}','Åpne','Låst','Prøv igjen'],
    da: ['Cocos spilserie','Coco|Coco i topform|Mesteren Coco|Helten Coco|Astronauten Coco|Legenden Coco','Dit første store skridt|Hold serien i gang|Du har nået toppen|Mod og indsats|Udforsk nye udfordringer|Episk niveau','Download baggrundsbillede','Tilgængelig fra start','{d} tilbage','Låses op efter {d}','Åbn','Låst','Prøv igen']
  };
  function describe(id, lang) {
    const i = slugs.indexOf(id);
    if (i < 0 || !Object.hasOwn(copy,lang)) return null;
    const [header,names,mottos,download,start,remaining,unlock,open,locked,retry] = copy[lang];
    const days = n => new Intl.NumberFormat(lang,{style:'unit',unit:'day',unitDisplay:'long'}).format(n);
    return {id,lang,header,name:names.split('|')[i],motto:mottos.split('|')[i],days,threshold:thresholds[i],download,start,remaining,unlock,open,locked,retry};
  }
  function cardId(url) {
    if (!url) return null;
    const path = new URL(url,document.baseURI).pathname;
    if (!path.startsWith(root)) return null;
    const id = path.slice(root.length).replace(/(?:-mini\.webp|\.jpg)$/,'');
    return slugs.includes(id) ? id : null;
  }
  function viewUrl(url, lang) {
    const id = cardId(url);
    return lang !== 'es' && describe(id,lang) ? '/tarjetas/ver/?'+new URLSearchParams({id,lang}) : url;
  }
  function loadImage(src) {
    return new Promise((resolve,reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(Error('reward artwork unavailable'));
      image.src = src;
    });
  }
  async function render(card, full) {
    const mini = root+card.id+'-mini.webp';
    const original = root+card.id+'.jpg';
    const art = await loadImage(full ? original : mini).catch(()=>loadImage(full ? mini : original));
    const canvas = document.createElement('canvas');
    canvas.width = art.naturalWidth; canvas.height = art.naturalHeight;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    // Only the central illustration lies between the two lettering areas on all six masters.
    ctx.fillStyle = '#071428'; ctx.fillRect(0,0,w,h);
    const y = Math.ceil(h * 0.086), bottom = Math.floor(h * 0.705);
    ctx.drawImage(art,0,y,w,bottom-y,0,y,w,bottom-y);
    ctx.strokeStyle = '#eab655'; ctx.lineWidth = w * 0.007;
    ctx.strokeRect(w*.019,h*.016,w*.962,h*.968);
    ctx.direction = card.lang === 'ar' ? 'rtl' : 'ltr';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const family = card.lang === 'ar' ? '"Geeza Pro",Tahoma,"Noto Sans Arabic","DejaVu Sans",sans-serif'
      : card.lang === 'zh-Hans' ? '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif'
      : 'Arial,"DejaVu Sans",sans-serif';
    function line(text, height, size, color, weight) {
      let pixels = w*size;
      const font = () => weight+' '+Math.floor(pixels)+'px '+family;
      ctx.font = font();
      const measured = ctx.measureText(text).width;
      if (measured > w*.87) { pixels *= w*.87/measured; ctx.font = font(); }
      ctx.fillStyle = color; ctx.fillText(text,w/2,h*height);
    }
    line(card.header,.054,.043,'#ffe1a6','bold');
    line(card.name,card.threshold ? .775 : .80,.083,'#ffd06d','bold');
    line(card.motto,card.threshold ? .864 : .90,.05,'#ffffff','bold');
    if (card.threshold) line(card.days(card.threshold),.94,.041,'#ffe1a6','bold');
    return canvas;
  }
  async function jpeg(card) {
    const canvas = await render(card,true);
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob ? resolve(blob) : reject(Error('JPEG unavailable')),'image/jpeg',.91));
  }
  const previews = new Map();
  let previewLanguage;
  function preview(card) {
    if (previewLanguage !== card.lang) { previews.clear(); previewLanguage = card.lang; }
    if (!previews.has(card.id)) {
      const task = render(card,false).then(canvas=>canvas.toDataURL('image/webp',.86));
      previews.set(card.id,task);
      task.catch(()=>{ if (previews.get(card.id) === task) previews.delete(card.id); });
    }
    return previews.get(card.id);
  }
  function visit(rootNode,selector,callback) {
    if (rootNode.matches?.(selector)) callback(rootNode);
    rootNode.querySelectorAll?.(selector).forEach(callback);
  }
  function put(element,value) {
    if (element && element.textContent !== value) element.textContent = value;
  }
  function apply(rootNode,lang) {
    visit(rootNode,'img.avatarCard,img.tarjetaImagenOptimizada',img=>{
      const original = img.dataset.rewardSrc || img.getAttribute('src');
      const card = describe(cardId(original),lang);
      if (!card) return;
      if (lang === 'es') {
        if (img.dataset.rewardSrc) {
          img.src = original; img.alt = img.dataset.rewardAlt; img.style.visibility = img.dataset.rewardVisibility;
          delete img.dataset.rewardSrc; delete img.dataset.rewardLang; delete img.dataset.rewardAlt; delete img.dataset.rewardVisibility;
        }
        return;
      }
      if (!img.dataset.rewardSrc) {
        img.dataset.rewardSrc = original; img.dataset.rewardAlt = img.alt; img.dataset.rewardVisibility = img.style.visibility;
      }
      if (img.dataset.rewardLang === lang) return;
      img.dataset.rewardLang = lang; img.alt = card.name+' · '+card.motto; img.style.visibility = 'hidden';
      preview(card).then(data=>{
        if (img.dataset.rewardLang !== lang) return;
        img.src = data; img.style.visibility = img.dataset.rewardVisibility;
      }).catch(()=>{
        if (img.dataset.rewardLang !== lang) return;
        img.removeAttribute('src'); img.style.visibility = img.dataset.rewardVisibility; delete img.dataset.rewardLang;
      });
    });
    visit(rootNode,'.tarjetaLogro',article=>{
      const card = describe(slugs[thresholds.indexOf(Number(article.dataset.dias))],lang);
      if (!card || (lang === 'es' && !article.dataset.rewardTranslated)) return;
      if (lang === 'es') delete article.dataset.rewardTranslated; else article.dataset.rewardTranslated = lang;
      const button = article.querySelector('.tarjetaMini'), locked = button?.disabled;
      put(article.querySelector('.datosTarjeta b'),card.name);
      put(article.querySelector('.datosTarjeta > span:first-of-type'),card.motto);
      if (button) button.setAttribute('aria-label',lang === 'es' ? (locked ? card.name+' bloqueada' : 'Ver '+card.name+' a tamaño completo') : (locked ? card.locked : card.open)+' · '+card.name);
      const days = card.days(card.threshold)+(lang === 'es' ? ' de racha' : '');
      put(article.querySelector('.datosTarjeta small'),card.threshold ? (locked ? card.unlock.replace('{d}',days) : days) : card.start);
      const countdown = article.querySelector('.estadoBloqueoTarjeta');
      if (countdown) {
        const n = countdown.dataset.rewardRemaining ?? countdown.textContent.match(/\d+/)?.[0];
        if (n !== undefined) { countdown.dataset.rewardRemaining = n; put(countdown,card.remaining.replace('{d}',card.days(Number(n)))); }
      }
      const download = article.querySelector('.descargarTarjetaCoco');
      if (download && !download.disabled) put(download,card.download);
    });
  }
  async function download(url,lang,button) {
    const card = describe(cardId(url),lang);
    button.disabled = true;
    try {
      const objectUrl = URL.createObjectURL(await jpeg(card));
      const anchor = document.createElement('a');
      anchor.href = objectUrl; anchor.download = 'Coco-'+card.threshold+'-'+lang+'.jpg';
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
    } catch { location.assign(viewUrl(url,lang)); }
    finally { button.disabled = false; }
  }
  window.CocoRewardCards = {describe,cardId,viewUrl,jpeg,download,apply};

  // Older desktop visitors can still have the previous home HTML cached.
  // This existing, revalidated catalogue also reaches those browser tabs.
  function enableDesktopCollection() {
    if (!document.getElementById('cocoApp') || navigator.standalone ||
        /^pwa/i.test(new URLSearchParams(location.search).get('source') || '') ||
        !matchMedia('(display-mode: browser)').matches) return;
    const wideHome = matchMedia('(display-mode: browser) and (min-width: 901px) and (min-height: 621px), (display-mode: browser) and (min-width: 1001px)');
    function load() {
      if (!wideHome.matches) return;
      import('/assets/desktop-streak-cards.mjs').then(module => {
        const cards = slugs.map(id => {
          const card = describe(id,'es');
          return {nombre:card.name,subtitulo:card.motto,mini:root+id+'-mini.webp',url:root+id+'.jpg'};
        });
        module.install(cards,wideHome);
        wideHome.removeEventListener('change',load);
      }).catch(() => {});
    }
    wideHome.addEventListener('change',load);
    load();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',enableDesktopCollection,{once:true});
  else enableDesktopCollection();
})();
