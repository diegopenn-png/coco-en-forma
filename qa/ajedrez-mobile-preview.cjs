const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {chromium} = require('playwright');

async function verify(page, origin) {
  await page.goto(new URL('/juego/ajedrez/?lang=es', origin).href);
  const picker = page.locator('.coco-language-bar select');
  const tags = await picker.locator('option').evaluateAll(options => options.map(option => option.value));
  assert.equal(tags.length, 15);
  async function choose(tag) {
    await picker.selectOption(tag);
    await page.waitForFunction(tag => document.documentElement.lang === tag, tag);
  }
  await choose('en');
  for (const link of await page.locator('a[href*="/games/ajedrez/"]').all()) {
    assert.equal(new URL(await link.getAttribute('href'), origin).searchParams.get('lang'), 'en');
  }
  await page.locator('a[data-play]').tap();
  await page.locator('[data-mode="standard"]').tap();
  await page.locator('[data-opponent="local"]').tap();
  await page.locator('#start').tap();
  const square = name => page.locator('[data-square="'+name+'"]');
  await square('f2').tap();
  const initial = await square('f2').boundingBox();
  await choose('ar');
  assert.equal(await square('f2').getAttribute('aria-pressed'), 'true');
  const a = await square('a1').boundingBox();
  const h = await square('h1').boundingBox();
  assert.ok(a.x < h.x, 'Arabic must keep a1 to the left of h1 for White');
  assert.ok(Math.abs((await square('f2').boundingBox()).x - initial.x) < 1, 'selected file keeps its place');
  for (const name of ['f3','e7','e5','g2','g4','d8','h4']) await square(name).tap();
  const result = 'Jaque mate. Gana el equipo grafito (negras).';
  const history = await page.locator('#history').textContent();
  assert.match(history, /Qh4#/);
  for (const tag of tags) {
    await choose(tag);
    const expected = tag === 'es' ? result : JSON.parse(readFileSync(join(__dirname,'../i18n/packs',tag+'.json'),'utf8')).chess[result];
    await page.waitForFunction(expected => document.getElementById('boardHelp').textContent === expected, expected);
    assert.equal(await page.locator('#history').textContent(),history);
  }
  await page.locator('#options').tap();
  await page.locator('#optionsDialog [data-rules]').tap();
  await choose('fr');
  assert.ok(await page.locator('#rulesDialog').isVisible());
  await page.locator('#rulesDialog .dialog-return').tap();
  await page.locator('#optionsDialog .coco-language-bar select').waitFor({state:'visible'});
  await page.locator('#optionsDialog .dialog-return').tap();
  await page.locator('#optionsDialog').waitFor({state:'hidden'});
  await page.locator('body > [data-coco-language-menu] select').waitFor({state:'visible'});
  const menuLink = page.locator('.topbar nav a');
  await menuLink.waitFor({state:'visible'});
  try {
    await menuLink.tap({timeout:7000});
  } catch (error) {
    const geometry = await menuLink.evaluate(link => {
      function rect(el) {
        const {x,y,width,height}=el.getBoundingClientRect();
        return {x,y,width,height};
      }
      const {x,y,width,height}=rect(link);
      const hit=document.elementFromPoint(x+width/2,y+height/2);
      const view=window.visualViewport;
      return {link:rect(link),nav:rect(link.parentElement),hit:hit?.outerHTML.slice(0,350),
        overflow:[...document.body.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,15).map(el=>[el.tagName,el.id,el.className,rect(el)]),client:document.documentElement.clientWidth,body:document.body.scrollWidth,hitStyle:getComputedStyle(link).pointerEvents,active:document.activeElement?.id,
        openDialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),
        scroll:[window.scrollX,window.scrollY],viewport:[innerWidth,innerHeight],
        visual:[view.width,view.height,view.offsetLeft,view.offsetTop,view.scale]};
    });
    console.error('Mobile menu geometry',JSON.stringify(geometry));
    throw error;
  }
  await page.waitForFunction(() => document.documentElement.lang === 'fr');
  assert.equal(new URL(page.url()).pathname,'/');
  assert.equal(await picker.inputValue(),'fr');
  await page.goto(new URL('/games/ajedrez/?lang=es',origin).href);
  await page.locator('[data-mode="standard"]').tap();
  await page.locator('[data-opponent="local"]').tap();
  await page.locator('#start').tap();
  for (const name of ['a2','a4','h7','h5','a4','a5','h5','h4','a5','a6','h4','h3','a6','b7','h3','g2','b7','a8']) {
    await square(name).tap();
  }
  const promotion = page.locator('#dialog[open]');
  await promotion.locator('select').waitFor({state:'visible'});
  await choose('en');
  assert.equal(await promotion.locator('h2').innerText(),'Promote your pawn!');
  await promotion.getByRole('button',{name:'Knight',exact:true}).tap();
  await square('a8').locator('[data-type="n"]').waitFor({state:'visible'});
  await page.locator('body > [data-coco-language-menu] select').waitFor({state:'visible'});
  console.log('Promotion dialog changes language and the chosen knight appears on a8.');
  console.log('15 checkmate messages verified, board orientation preserved in Arabic, French retained through nested dialogs and return to the main menu.');
}
(async()=>{
  const browser = await chromium.launch({channel:process.env.COCO_QA_BROWSER_CHANNEL});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    page.setDefaultTimeout(12000);
    try {
      await verify(page,process.env.COCO_QA_URL);
    } catch(error) {
      const state=await page.evaluate(()=>({
        path:location.pathname,screen:document.body.dataset.screen,lang:document.documentElement.lang,
        dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),
        active:document.activeElement?.outerHTML.slice(0,220)
      }));
      console.error('Chess screen',JSON.stringify(state));
      throw error;
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
