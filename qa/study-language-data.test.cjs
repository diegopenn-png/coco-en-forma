const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path'),root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8'),json=name=>JSON.parse(read(name));
const locales=['en','de','nl','fr','it','pl','uk','ru','zh-Hans','ar','sv','fi','nb','da'];
test('every age-specific Enneagram item and scale has a translation independent of scoring',async()=>{
  const {buildItems,summarize}=await import('../explora/engine.mjs');
  for(const age of [9,16,38]){const items=buildItems(age),answers=Object.fromEntries(items.map((q,i)=>[q.id,1+i%5])),baseline=summarize(answers,age);
    assert.equal(items.length,54);
    for(const tag of locales){const l=json('i18n/assessment/'+tag+'.json').strings;const texts=items.map(q=>l[q.text]);assert.ok(texts.every((s,i)=>s&&s!==items[i].text),tag);
      assert.equal(new Set(texts).size,54,tag);assert.equal(new Set(['Nada','Poco','Algo','Bastante','Mucho'].map(s=>l[s])).size,5,tag);
      assert.deepEqual(summarize(answers,age),baseline);
    }
  }
});
test('report templates retain all scored values and the author’s name in every language',()=>{
  const english=json('i18n/assessment/en.json');
  const fields=s=>[...s.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
  for(const tag of locales){
    const translated=json('i18n/assessment/'+tag+'.json');
    assert.deepEqual(Object.keys(translated.templates).sort(),Object.keys(english.templates).sort(),tag);
    for(const [source,target] of Object.entries(translated.templates)){
      assert.deepEqual(fields(target),fields(source),tag+' '+source);
    }
    assert.equal(translated.strings['Diego Pennise'],'Diego Pennise');
    assert.equal(translated.strings['Universidad de San Andrés'],'Universidad de San Andrés');
  }
});

test('the installed app caches the downloadable report module and only existing study scripts',()=>{
  const worker=read('sw.js');
  const core=JSON.parse(worker.match(/const ENEAGRAM_CORE=(\[[^;]+\]);/)[1]);
  assert.ok(core.includes('./explora/localized-pdf.mjs'));
  const studyAssets=new Set([...core,...worker.matchAll(/"(\.\/i18n\/[^"]+\.js)"/g)].map(entry=>Array.isArray(entry)?entry[1]:entry));
  for(const asset of studyAssets)assert.ok(fs.existsSync(path.join(root,asset)),asset);
});

test('the 24 published Coco Med questions keep their original choices and explanations across languages',async()=>{
  const rows=json('assets/data/coco-med-cda16aea8bb4.json');
  const source=json('i18n/med/source.json');
  const env={window:{},document:{currentScript:{src:'https://coco.test/i18n/med.js'}},URL,fetch:async url=>({ok:true,json:async()=>json(new URL(url).pathname.slice(1))})};
  vm.runInNewContext(read('i18n/med.js'),env);
  const api=env.window.CocoMedLanguage;
  const selected=rows.filter(q=>api.hasQuestion(q.id));
  assert.equal(selected.length,24);assert.equal(source.questionIds.length,24);
  for(const tag of locales){
    await api.load(tag);
    for(const q of selected){
      const answers=q.options.map(v=>api.text(v,tag));
      assert.equal(new Set(answers).size,3,tag+' '+q.id);
      assert.notEqual(api.text(q.stem,tag),q.stem);
      const explanation=api.text(q.explanation,tag);
      assert.ok(explanation.includes(answers[q.answer]),tag+' original correct concept in explanation for '+q.id);
      assert.ok(explanation.includes(' — '));
    }
  }
});
