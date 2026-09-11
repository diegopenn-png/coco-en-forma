// Repair the reproduced legacy-autocut/new-microphone collision only.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hashes={
 'eterna-mic-only-v4.js':'1d392518953291995fee43e34d8a832d313387c044c90a0afb70a22789cac325',
 'eterna-voice-autocut-v160907.js':'2046cf9f2cbec83990261151ed8a55424791e9d3b071368b99ddb2a77193543e',
 'sw.js':'1045bd190a8498246c06135e1654ecc201bd6e732a8f3db81d6ae347b93f266a',
 'eterna-worker/test/client-state-contract.test.mjs':'664fb509fe8ee3d87a491c87cb79591485f3cc89924c482ef68ad5422cc6946a',
 'eterna-worker/test/mic-auto-send.test.mjs':'896f3bc9f3eec50b8b33cbc5acbbec71cd38f58bf33d8e348059212f37015ac2'
};
const files={};for(const[p,h]of Object.entries(hashes)){files[p]=readFileSync(p,'utf8');assert.equal(createHash('sha256').update(files[p]).digest('hex'),h,'Unexpected baseline: '+p)}
function replace(p,a,b){assert.equal(files[p].split(a).length,2,'Expected one patch anchor in '+p);files[p]=files[p].replace(a,b)}
const mic='eterna-mic-only-v4.js',old='eterna-voice-autocut-v160907.js',sw='sw.js';
replace(mic,'    if(!current(s))return;\n    status(\'Transcribiendo',"    if(!current(s))return;\n    s.transcribing=true;\n    status('Transcribiendo");
replace(mic,"  async function start(){\n    if(session)","  async function start(){\n    // A late synthetic stop must not cancel transcription and reopen capture.\n    if(pending&&pending.transcribing||dispatchTurn)return;\n    if(session)");
// Keep desktop presentation and the fallback for the legacy-only client unchanged.
replace(old,'  var monitor=null;',"  var monitor=null;\n  function singleMicOwnsAudio(){return root.__ETERNA_MIC_ONLY_V4__===true}");
replace(old,'  function finish(reason){\n    var m=monitor;',"  function finish(reason){\n    if(singleMicOwnsAudio()){cleanup();return}\n    var m=monitor;");
replace(old,'  function startMonitor(stream){\n    cleanup();',"  function startMonitor(stream){\n    cleanup();\n    if(singleMicOwnsAudio())return;");
replace(old,'      if(monitor!==m||m.done)return;',"      if(monitor!==m||m.done)return;\n      if(singleMicOwnsAudio()||stream.active===false){cleanup();return}");
replace(old,"      if(isAudio&&Date.now()-recentEternaMicIntentAt<5000){setTimeout(function(){startMonitor(stream)},120)}","      if(isAudio&&!singleMicOwnsAudio()&&Date.now()-recentEternaMicIntentAt<5000){setTimeout(function(){if(!singleMicOwnsAudio())startMonitor(stream)},120)}");
replace(old,'    if(mic)recentEternaMicIntentAt=Date.now()', '    if(mic&&!singleMicOwnsAudio())recentEternaMicIntentAt=Date.now()');
replace(sw,'coco-en-forma-v160.99.1-mic-auto-send-r1','coco-en-forma-v160.99.2-mic-single-owner-r1');
replace(sw,'const ETERNA_MIC_ONLY_PATH="./eterna-mic-only-v4.js";', 'const ETERNA_MIC_ONLY_PATH="./eterna-mic-only-v4.js";\nconst ETERNA_VOICE_AUTOCUT_PATH="./eterna-voice-autocut-v160907.js";');
replace(sw,'ETERNA_DESKTOP_COMPACT_PATH,ETERNA_MIC_ONLY_PATH,','ETERNA_DESKTOP_COMPACT_PATH,ETERNA_MIC_ONLY_PATH,ETERNA_VOICE_AUTOCUT_PATH,');
replace(sw,'if(eternaCore){e.respondWith', 'if(u.pathname===new URL(ETERNA_VOICE_AUTOCUT_PATH,SCOPE_URL).pathname){e.respondWith(cachedPatch(ETERNA_VOICE_AUTOCUT_PATH).then(r=>r||offlineFallback(e.request)));return}if(eternaCore){e.respondWith');
replace('eterna-worker/test/client-state-contract.test.mjs','v160\\.99\\.1-mic-auto-send-r1','v160\\.99\\.2-mic-single-owner-r1');
files['eterna-worker/test/mic-auto-send.test.mjs']+=`
// A stopped recording still owns its transcription until the one automatic Send.
test('a late microphone click cannot discard an in-flight transcription',async()=>{const d=deferred(),h=harness({response:d.promise}),p=h.transcribe();await flush();await h.start();assert.equal(h.streams.length,0);assert.equal(h.requests[0].init.signal.aborted,false);d.resolve(reply());await p;assert.equal(h.send.clicks,1)});
test('repeated late microphone clicks cannot restart capture or duplicate Send',async()=>{const d=deferred(),h=harness({response:d.promise}),p=h.transcribe();await flush();for(let i=0;i<5;i++)await h.start();d.resolve(reply());await p;assert.equal(h.streams.length,0);assert.equal(h.send.clicks,1);assert.equal(h.requests.length,1)});
test('pending legal replay keeps ownership until the automatic send is resolved',async()=>{const h=harness({delayedGate:true});await h.transcribe();await h.start();assert.equal(h.streams.length,0);h.send.click();assert.equal(h.send.clicks,1)});
test('closing during transcription still cancels rather than sending stale audio',async()=>{const d=deferred(),h=harness({response:d.promise}),p=h.transcribe();await flush();h.close();assert.equal(h.requests[0].init.signal.aborted,true);d.resolve(reply());await p;assert.equal(h.send.clicks,0)});
test('cache delivers the legacy monitor and the new owner as one release',()=>{const s=readFileSync(new URL('../../sw.js',import.meta.url),'utf8');assert.ok(s.includes('ETERNA_VOICE_AUTOCUT_PATH="./eterna-voice-autocut-v160907.js"'));assert.ok(s.includes('ETERNA_MIC_ONLY_PATH,ETERNA_VOICE_AUTOCUT_PATH,'));assert.ok(s.includes('cachedPatch(ETERNA_VOICE_AUTOCUT_PATH)'))});
`;
for(const[p,s]of Object.entries(files))writeFileSync(p,s);
console.log('Patched single microphone owner; no backend, canonical Send, layout or timing changes.');
