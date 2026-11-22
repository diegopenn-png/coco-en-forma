const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');

(async () => {
  const {renderApp} = await import('../src/ui.mjs');
  const {bankLanguages} = await import('../src/translations.mjs');
  const {action, summary, CATALOG} = await import('../src/engine.mjs');
  const now = Date.now();
  const market = {prices:{},events:[],updatedAt:now};
  const player = 'Mi dinero';
  const apply = (state, command) => action(state,market,{requestId:crypto.randomUUID(),...command},now,{parent:true});
  let state = apply(null,{type:'open_account',name:player});
  state = apply(state,{type:'setup',config:{experience:'investing',salary:10,initial:0}});
  state = apply(state,{type:'receive'});
  const expectedNav = ['Mi dinero','Invertir','Mi cartera','Aprender'];
  assert.equal(Object.keys(bankLanguages).length,14);
  assert.equal(renderApp('unknown'),renderApp('es'));
  for (const lang of ['es',...Object.keys(bankLanguages)]) {
    for (const ready of [false,true]) {
      const dictionary = bankLanguages[lang] || {};
      const translate = key => dictionary[key] || key;
      const fixture = {state:ready?state:null,summary:ready?summary(state,market,now):null,market,catalog:CATALOG,serverTime:now,parent:{configured:true}};
      const dom = new JSDOM(renderApp(lang),{url:'https://cocoenforma.com',runScripts:'dangerously',beforeParse(window) {
        window.scrollTo = () => {};
        window.postMessage = msg => {
          if (msg.path !== '/state') throw new Error('Unexpected bank request');
          queueMicrotask(() => window.dispatchEvent(new window.MessageEvent('message',{source:window,data:{channel:msg.channel,id:msg.id,reply:true,data:fixture}})));
        };
      }});
      try {
        const document = dom.window.document;
        const tick = () => new Promise(resolve => setTimeout(resolve,0));
        await tick();
        assert.equal(document.documentElement.lang,lang);
        assert.equal(document.documentElement.dir || 'ltr',lang==='ar'?'rtl':'ltr');
        assert.deepEqual([...document.querySelectorAll('nav button')].map(b=>b.textContent),expectedNav.map(translate));
        if (ready) {
          assert.equal(document.querySelector('[data-bank-verbatim]').textContent,player);
          document.querySelector('[data-go="invest"]').click();
          await tick();
          assert.equal(document.querySelectorAll('[data-asset]').length,20);
          assert.ok([...document.querySelectorAll('[data-asset] h3')].some(el=>el.textContent==='Apple'));
        } else {
          assert.equal(document.querySelector('#account button').textContent,translate('Crear mi cuenta'));
          const name = document.querySelector('input[name="name"]');
          name.value = 'Mi dinero · علي';
          name.parentElement.appendChild(document.createTextNode(' '));
          await tick();
          assert.equal(name.value,'Mi dinero · علي');
        }
      } finally { dom.window.close(); }
    }
  }
  console.log('15 languages verified in the real Coco Bank frame, before and after account setup.');
})().catch(error => {console.error(error);process.exitCode=1;});
