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
