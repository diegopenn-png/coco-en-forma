const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {JSDOM} = require(process.env.COCO_JSDOM_PATH || 'jsdom');

const key = 'coco-chess-standard-v1';
const origin = 'https://coco.test';
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
const packs = Object.fromEntries(fs.readdirSync(path.join(root, 'i18n/packs'))
  .filter(name => name.endsWith('.json')).map(name => {
    const pack = JSON.parse(read('i18n/packs/' + name));
    return [pack.locale, pack];
  }));

async function openBoard(testContext, fen) {
  const {Chess} = await import('../games/ajedrez/vendor/chess.mjs');
  const {chooseMove} = await import('../games/ajedrez/engine.mjs');
  const content = await import('../games/ajedrez/content.mjs');
  const dom = new JSDOM(read('games/ajedrez/index.html'), {
    url: origin + '/games/ajedrez/?lang=es', runScripts: 'outside-only', pretendToBeVisual: true
  });
  testContext.after(() => dom.window.close());
  const w = dom.window;
  const d = w.document;
  const script = d.createElement('script');
  script.src = origin + '/i18n/coco.js';
  Object.defineProperty(d, 'currentScript', {get: () => script});
  w.fetch = async url => ({ok: true, json: async () => packs[path.basename(url.pathname, '.json')]});
  w.scrollTo = () => {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function (value) {
    this.returnValue = value;
    this.open = false;
    this.dispatchEvent(new w.Event('close'));
  };
  Object.assign(w, {Chess, chooseMove, ...content});
  if (fen) {
    const saved = {pgn: new Chess(fen).pgn(), opponent: 'local', human: 'w', level: 2, ended: ''};
    w.localStorage.setItem(key, JSON.stringify(saved));
  }
  w.eval(read('i18n/coco.js'));
  await w.CocoLocale.ready;
  w.eval(read('games/ajedrez/app.mjs').replace(/^import .*;\n/gm, '')
    .replaceAll('import.meta.url', JSON.stringify(origin + '/games/ajedrez/app.mjs')));
  const find = selector => d.querySelector(selector);
  const click = selector => find(selector).click();
  const square = name => find('[data-square="' + name + '"]');
  if (fen) click('#resume');
  else {
    click('[data-mode=standard]');
    click('[data-opponent=local]');
    click('#start');
  }
  await settle();
  assert.equal(d.body.dataset.screen, 'play');
  const pgn = () => JSON.parse(w.localStorage.getItem(key)).pgn;
  async function languages(check) {
    const select = find('.coco-language-bar select');
    const tags = Array.from(select.options, option => option.value);
    assert.equal(tags.length, 15);
    for (const tag of [...tags.filter(tag => tag !== 'es'), 'es']) {
      const changed = new Promise(resolve => w.addEventListener('coco:language', resolve, {once: true}));
      select.value = tag;
      select.dispatchEvent(new w.Event('change', {bubbles: true}));
      await changed;
      await settle();
      assert.equal(d.documentElement.lang, tag);
      assert.equal(d.documentElement.dir, tag === 'ar' ? 'rtl' : 'ltr');
      const expectText = source => tag === 'es' ? source : packs[tag].chess[source] ?? packs[tag].strings[source];
      check(expectText, tag);
    }
  }
  function move(from, to) { square(from).click(); square(to).click(); }
  async function result(source) {
    const saved = pgn();
    const history = find('#history').textContent;
    await languages((expected, tag) => {
      assert.equal(find('#status').textContent, expected(source), tag);
      assert.equal(find('#boardHelp').textContent, expected(source), tag);
      assert.equal(find('#turnTitle').textContent, expected('Partida terminada'), tag);
      assert.equal(find('#history').textContent, history, tag);
      assert.equal(pgn(), saved, tag);
    });
  }
  return {find, square, move, languages, result, pgn};
}

test('a selected piece, its legal destinations and the checkmate result survive all 15 language changes', async context => {
  const board = await openBoard(context);
  board.square('f2').click();
  await board.languages((expected, tag) => {
    assert.equal(board.square('f2').getAttribute('aria-pressed'), 'true', tag);
    assert.equal(board.square('f2').getAttribute('aria-label'), 'f2: ' + expected('Blancas') + ' · ' + expected('Peón'), tag);
    assert.ok(board.square('f3').getAttribute('aria-label').endsWith(expected('Destino disponible')), tag);
    assert.equal(board.find('#pieceName').textContent, expected('Peón') + ' · f2', tag);
    assert.equal(board.find('#turnTitle').textContent, expected('Turno de las blancas'), tag);
  });
  board.square('f3').click();
  board.move('e7','e5'); board.move('g2','g4'); board.move('d8','h4');
  assert.match(board.pgn(), /Qh4#/);
  await board.result('Jaque mate. Gana el equipo grafito (negras).');
});

test('threefold repetition and stalemate show their own reason in all 15 languages', async context => {
  const standard = await openBoard(context);
  for (let i = 0; i < 2; i++) {
    standard.move('g1','f3'); standard.move('g8','f6');
    standard.move('f3','g1'); standard.move('f6','g8');
  }
  await standard.result('Tablas por tercera repetición de la posición.');
  const saved = await openBoard(context, '7k/5K2/8/6Q1/8/8/8/8 w - - 0 1');
  saved.move('g5','g6');
  await saved.result('Tablas por ahogado: no hay jugadas legales y el rey no está en jaque.');
});

test('check and the four promotion choices change language without dismissing the dialog', async context => {
  const standard = await openBoard(context);
  standard.move('e2','e4'); standard.move('e7','e5'); standard.move('f1','c4');
  standard.move('b8','c6'); standard.move('c4','f7');
  await standard.languages((expected, tag) => {
    assert.equal(standard.find('#boardHelp').textContent, expected('¡Jaque! Protege a tu rey.'), tag);
    assert.equal(standard.find('#status').textContent, expected('¡Jaque! Protege a tu rey con una jugada legal.'), tag);
  });
  const board = await openBoard(context, '7k/4P3/6K1/8/8/8/8/8 w - - 0 1');
  board.move('e7','e8');
  await board.languages((expected, tag) => {
    assert.ok(board.find('#dialog').open, tag);
    assert.equal(board.find('#dialogTitle').textContent,expected('¡Tu peón corona!'),tag);
    assert.equal(board.find('#dialogText').textContent,expected('Elige la pieza que ocupará su lugar.'),tag);
    assert.ok(board.find('#dialog .coco-language-bar select'),tag);
    for (const [value, piece] of Object.entries({q:'Dama',r:'Torre',b:'Alfil',n:'Caballo'})) {
      assert.equal(board.find('#dialogChoices [value="' + value + '"]').textContent, expected(piece), tag);
    }
  });
  board.find('#dialog').close('n');
  await settle();
  assert.equal(board.square('e8').querySelector('.piece').dataset.type, 'n');
});
