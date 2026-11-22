const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {chromium} = require('playwright');

(async()=>{
  const origin = process.env.COCO_QA_URL || 'http://127.0.0.1:8372';
  const browser = await chromium.launch({channel:process.env.COCO_QA_BROWSER_CHANNEL || 'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await page.addInitScript(()=>{
      window.rewardLines = [];
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text,...args) {
        window.rewardLines.push([text,this.direction]);
        return original.call(this,text,...args);
      };
    });
    await page.goto(origin+'/tarjetas/ver/?id=coco-heroe&lang=fi');
    const save = page.locator('#save');
    await save.waitFor();
    assert.equal(await page.title(),'Sankari-Coco · Coco en Forma');
    const [download] = await Promise.all([page.waitForEvent('download'),save.click()]);
    assert.equal(download.suggestedFilename(),'Coco-21-fi.jpg');
    const bytes = await fs.readFile(await download.path());
    assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff');
    const tags = ['en','de','nl','fr','it','pl','uk','ru','zh-Hans','ar','sv','fi','nb','da'];
    const ids = ['coco','coco-en-racha','coco-campeon','coco-heroe','coco-astronauta','coco-leyenda'];
    for (const id of ids) {
      const results = await page.evaluate(async({id,tags})=>{
        const service = window.CocoRewardCards, values = [];
        for (const tag of tags) {
          const card = service.describe(id,tag);
          window.rewardLines = [];
          const blob = await service.jpeg(card), image = await createImageBitmap(blob);
          const expected = [card.header,card.name,card.motto,...(card.threshold?[card.days(card.threshold)]:[])];
          const expectedDirection = tag==='ar' ? 'rtl' : 'ltr';
          if (blob.type!=='image/jpeg' || image.width!==1086 || image.height!==1448 ||
              JSON.stringify(window.rewardLines.map(x=>x[0]))!==JSON.stringify(expected) ||
              window.rewardLines.some(x=>x[1]!==expectedDirection)) throw Error(id+' / '+tag);
          const canvas = document.createElement('canvas');
          canvas.width=image.width; canvas.height=image.height;
          const ctx=canvas.getContext('2d'); ctx.drawImage(image,0,0); image.close();
          // Inspect the interior of each lettering band, excluding the gold frame.
          const heights=[.054,card.threshold ? .775 : .80,card.threshold ? .864 : .90];
          for (const y of heights) {
            const pixels=ctx.getImageData(55,Math.floor(y*canvas.height)-27,canvas.width-110,54).data;
            let ink=0;
            for (let i=0;i<pixels.length;i+=4) if (pixels[i]>160 && pixels[i+1]>120) ink++;
            if (ink<48) throw Error('Empty lettering band: '+id+' / '+tag+' / '+y);
          }
          values.push(card.header);
        }
        return values;
      },{id,tags});
      assert.equal(new Set(results).size,tags.length,id);
    }
    // Exercise the same gallery, avatar and lock controls without creating a player account.
    await page.evaluate(()=>{
      const box = document.createElement('section'); box.id = 'reward-test';
      box.innerHTML = '<article class="tarjetaLogro bloqueada" data-dias="21"><button class="tarjetaMini" disabled><img class="tarjetaImagenOptimizada" alt="Tarjeta Coco héroe" src="/assets/tarjetas/premium-v160127/coco-heroe-mini.webp"></button><div class="datosTarjeta"><b>Coco héroe</b><span>Valentía y esfuerzo</span><small></small><span class="estadoBloqueoTarjeta">Faltan 5 días</span></div></article>';
      document.body.append(box);
      for (const tag of ['de','ar','fi']) window.CocoRewardCards.apply(box,tag);
    });
    const gallery = page.locator('#reward-test'), img = gallery.locator('img');
    await page.waitForFunction(()=>document.querySelector('#reward-test img').src.startsWith('data:image/'));
    assert.equal(await gallery.locator('b').textContent(),'Sankari-Coco');
    assert.equal(await img.getAttribute('alt'),'Sankari-Coco · Rohkeutta ja sisua');
    assert.equal(await gallery.locator('button').isDisabled(),true);
    await page.evaluate(()=>window.CocoRewardCards.apply(document.getElementById('reward-test'),'es'));
    assert.match(await img.getAttribute('src'),/coco-heroe-mini.webp$/);
    assert.equal(await gallery.locator('b').textContent(),'Coco héroe');
    await page.goto(origin+'/tarjetas/ver/?id=coco-campeon&lang=ar');
    await page.locator('#save').waitFor(); assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
    await page.goto(origin+'/?lang=fi&verify='+Date.now(),{waitUntil:'domcontentloaded'});
    const select = page.locator('.coco-language-bar select:visible').first();
    await select.waitFor();
    for (const tag of ['fi','nb','ar','zh-Hans','es']) {
      await select.selectOption(tag);
      await page.waitForFunction(tag=>document.documentElement.lang===tag,tag);
      if (tag==='es') {
        await page.waitForFunction(()=>!document.querySelector('.cocoLocalizedThumbnail,.cocoLocalizedHero'));
        break;
      }
      await page.waitForFunction(tag=>{
        const hero = [...document.querySelectorAll('.cocoLocalizedHero')].find(el=>el.offsetWidth);
        const poster = [...document.querySelectorAll('.cocoLocalizedPoster')].find(el=>el.offsetWidth);
        const memory = [...document.querySelectorAll('[data-coco-thumbnail="memoria"]')].find(el=>el.offsetWidth);
        return hero?.querySelector('img')?.naturalWidth && poster?.querySelector('img')?.naturalWidth
          && poster.querySelector('.cocoRewardHeader')?.textContent === CocoRewardCards.describe('coco',tag).header
          && memory?.querySelector('strong')?.textContent === CocoLocale.t('Memoria');
      },tag,{timeout:45000});
      const fits = await page.evaluate(()=>{
        const captions = [...document.querySelectorAll('.cocoLocalizedHero [data-coco-banner-caption],.cocoLocalizedPoster [data-coco-banner-caption]')].filter(el=>el.offsetWidth);
        return captions.every(el=>{
          const frame=el.parentElement.getBoundingClientRect();
          return [...el.children].every(child=>{
            const box=child.getBoundingClientRect();
            return box.top>=frame.top-1 && box.bottom<=frame.bottom+1 && box.left>=frame.left-1 && box.right<=frame.right+1;
          });
        });
      });
      assert.equal(fits,true,'home banner overflow: '+tag);
    }
    console.log('Verified live home banner and game thumbnail language changes.');
    console.log('Verified 84 localized reward JPEGs, touch download, gallery language changes, locked state and Spanish restoration.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
