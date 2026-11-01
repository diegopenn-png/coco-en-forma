const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('coco-v155-identity.js','utf8');
const fn=source.slice(source.indexOf('  function upgradeShareLinks('),source.indexOf('  function eternaShareUrlFinal47('));
(async()=>{
for(const item of JSON.parse(fs.readFileSync('share/colorful-v160125/catalog.json','utf8'))){
 let copied,shared;const nodes={},children=[];
 const modal={dataset:{},querySelector:s=>nodes[s]??=(s==='.cocoShareSheet'?{appendChild:x=>children.push(x)}:{})};
 const data={name:item.title,description:item.description,image:'./share/colorful-v160125/'+item.id+'.jpg'};
 const ctx={root:{},DATA:{[item.id]:data},document:{createElement:()=>({})},navigator:{clipboard:{writeText:async v=>{copied=v}},share:async v=>{shared=v}},window:{open(){throw Error('Unexpected external send')}}};
 vm.createContext(ctx);vm.runInContext(fn,ctx);ctx.upgradeShareLinks(modal,item.id);ctx.upgradeShareLinks(modal,item.id);
 await nodes['[data-share-copy]'].onclick();assert.equal(copied,'https://cocoenforma.com/juego/'+item.id+'/');
 await nodes['[data-share-native]'].onclick();assert.equal(shared.url,copied);
 assert.equal(children.length,2);assert.equal(children[0].href,data.image);assert.equal(children[0].download,'coco-'+item.id+'.jpg');
}
console.log('PASS: all 14 copy links, native share payloads, downloads and idempotent menu upgrades. No messages sent.');
})().catch(e=>{console.error(e);process.exit(1)});
