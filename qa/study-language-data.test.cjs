const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path'),root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8'),json=name=>JSON.parse(read(name));
const locales=['en','de','nl','fr','it','pl','uk','ru','zh-Hans','ar','sv','fi','nb','da'];
function clinicalQuestions(){
  const rows=json('assets/data/coco-med-cda16aea8bb4.json');
  for(const file of ['coco-v142-content-extension.js','coco-v144-content.js']){
    const src=read(file),start=src.indexOf('var healthConcepts'),end=src.indexOf('\n  });',src.indexOf('healthConcepts.forEach',start))+6,env={};
    vm.runInNewContext(src.slice(start,end)+';this.result=medExtra',env);rows.push(...env.result);
  }
  return rows;
}
test('every original Coco Med question, option and explanation stays usable after localization',async()=>{
  const env={window:{},document:{currentScript:{src:'https://coco.test/i18n/med.js'}},URL,
    fetch:async u=>({ok:true,json:async()=>json(new URL(u).pathname.slice(1))})};
  vm.runInNewContext(read('i18n/med.js'),env);
  const api=env.window.CocoMedLanguage,questions=clinicalQuestions(),source=json('i18n/med/source.json');
  assert.equal(questions.length,4704);assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
  const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}]/gu,'');
  for(const tag of locales){await api.load(tag);const values=json('i18n/med/'+tag+'.json').values,names=new Set(source.terms);
    assert.equal(values.length,source.terms.length);const failures=[];
    for(const q of questions){
      const stem=api.text(q.stem,tag),explanation=api.text(q.explanation,tag),options=q.options.map(v=>api.text(v,tag));
      if(stem===q.stem||explanation===q.explanation||!options.every(Boolean)||new Set(options.map(norm)).size!==options.length||!q.options.every(v=>names.has(v)))failures.push(q.id);
      assert.equal(api.text(q.options[q.answer],tag),options[q.answer]);
    }
    assert.deepEqual(failures.slice(0,10),[],tag+' translated choices or coverage, '+failures.length+' questions');
    assert.notEqual(api.text('reduce falsos negativos',tag),api.text('reduce falsos positivos',tag));
  }
});
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
