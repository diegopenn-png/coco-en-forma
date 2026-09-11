# Exact-source microphone-only repair; no server, model, UI or curriculum changes.
from pathlib import Path
import hashlib
root=Path(__file__).resolve().parents[2]
p=root/'eterna-mic-only-v4.js';source=p.read_text();s=source
assert hashlib.sha256(source.encode()).hexdigest()=='7cc892abd2d4050b73766c508dd08a949374e3e7f189089fc52a31b10e986861'
helpers=r'''  // Create/resume in the microphone click, before the permission promise yields.
  // Each turn owns a fresh graph; mode changes can never retain an old source.
  function openInputGraph(s){
    var Ctx=root.AudioContext||root.webkitAudioContext;
    if(!Ctx)return;
    try{s.audioCtx=new Ctx();if(s.audioCtx.state!=='running')s.audioReady=Promise.resolve(s.audioCtx.resume()).catch(function(){return false})}catch(e){closeInputGraph(s)}
  }
  function closeInputGraph(s){
    if(!s)return;
    ['source','analyser','sink'].forEach(function(k){try{if(s[k]&&s[k].disconnect)s[k].disconnect()}catch(e){}s[k]=null});
    var ctx=s.audioCtx;s.audioCtx=null;
    try{if(ctx&&ctx.state!=='closed')Promise.resolve(ctx.close()).catch(function(){})}catch(e){}
  }
  async function inputGraphReady(s){
    var ctx=s.audioCtx;if(!ctx||ctx.state==='closed')return false;
    if(ctx.state==='running')return true;
    var timer;try{
      var ready=s.audioReady||Promise.resolve(ctx.resume()).catch(function(){return false});
      await Promise.race([ready,new Promise(function(resolve){timer=setTimeout(resolve,1500)})]);
      return ctx.state==='running'
    }catch(e){return false}finally{if(timer)clearTimeout(timer);s.audioReady=null}
  }
  function inputFault(s,code){
    if(!current(s))return;
    if(session===s)stop('error');else{cancelPending();releaseStream(s);closeInputGraph(s)}
    voiceDiagnostic(0,code,'El micrófono no está entregando sonido de forma estable. Tócalo de nuevo para activarlo.');
  }
  function resumeInterruptedGraph(s){
    if(s.resuming||!s.audioCtx)return;
    s.resuming=true;
    if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
    s.audioReady=null;
    inputGraphReady(s).then(function(ok){
      s.resuming=false;if(!current(s)||session!==s)return;
      if(!ok){inputFault(s,'AUDIO_CONTEXT_INTERRUPTED');return}
      s.lastClock=s.audioCtx.currentTime;s.clockAt=Date.now();if(s.speechAt)s.lastVoiceAt=Date.now()
    })
  }
  function sampleVoice(s,now){
    var values=s.data,analyser=s.analyser,sum=0,mean=0,i,v;
    if(s.floatSamples){
      analyser.getFloatTimeDomainData(values);
      for(i=0;i<values.length;i++)mean+=values[i];mean/=values.length;
      for(i=0;i<values.length;i++){v=values[i]-mean;sum+=v*v}
    }else{
      analyser.getByteTimeDomainData(values);
      for(i=0;i<values.length;i++){v=(values[i]-128)/128;sum+=v*v}
    }
    var rms=Math.sqrt(sum/values.length),step=Math.max(0,Math.min(50,now-s.lastSampleAt));s.lastSampleAt=now;
    if(!Number.isFinite(rms))return false;
    s.sampleCount++;s.peakRms=Math.max(s.peakRms,rms);
    var threshold=Math.max(s.speechAt?.0018:.003,s.noise*(s.speechAt?1.6:2.4));
    if(rms>threshold){
      s.voiceEvidence+=step;
      if(!s.speechAt&&s.voiceEvidence>=64)s.speechAt=now;
      if(s.speechAt){
        s.lastVoiceAt=now;
        if(s.noSpeechTimer){clearTimeout(s.noSpeechTimer);s.noSpeechTimer=null}
        if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
      }
    }else{
      s.voiceEvidence=0;
      // Learn background only from quiet frames, never from the child's first words.
      if(!s.speechAt)s.noise=Math.max(.0003,Math.min(.01,s.noise*.94+rms*.06));
      if(s.speechAt&&now-s.lastVoiceAt>180&&!s.silenceTimer){
        s.silenceTimer=setTimeout(function(){
          s.silenceTimer=null;if(session!==s||!current(s))return;
          if(s.audioCtx&&s.audioCtx.state!=='running'){resumeInterruptedGraph(s);return}
          stop('silence')
        },Math.max(0,s.pauseMs-(now-s.lastVoiceAt)))
      }
    }
    return true
  }

'''
s=s.replace('  function installStyle(){',helpers+'  function installStyle(){',1)
s=s.replace("if(session===s)stop('cancel');else releaseStream(s)","if(session===s)stop('cancel');else{releaseStream(s);closeInputGraph(s)}")
s=s.replace("    try{if(s.audioCtx)s.audioCtx.close()}catch(e){}\n    if(s.cancelled)releaseStream(s);", "    if(s.cancelled){releaseStream(s);closeInputGraph(s)}")
s=s.replace('    var s=newTurn();\n    try{', '    var s=newTurn();openInputGraph(s);\n    try{',1)
s=s.replace("if(!current(s)){releaseStream(s);return}","if(!current(s)){releaseStream(s);closeInputGraph(s);return}",1)
start=s.index('      var AudioCtx=root.AudioContext||root.webkitAudioContext,ctx=AudioCtx?new AudioCtx():null,analyser=null,data=null,source=null;s.audioCtx=ctx;')
end=s.index('      Object.assign(s,',start)
s=s[:start]+'''      var ctx=s.audioCtx,analyser=null,data=null,source=null,sink=null;
      if(!await inputGraphReady(s)){inputFault(s,'AUDIO_CONTEXT_NOT_RUNNING');return}
      if(!current(s)){releaseStream(s);closeInputGraph(s);return}
      try{
        source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.2;source.connect(analyser);
        s.source=source;s.analyser=analyser;
        // A zero-gain output keeps the graph processing without microphone feedback.
        if(ctx.createGain&&analyser.connect){sink=ctx.createGain();sink.gain.value=0;analyser.connect(sink);sink.connect(ctx.destination);s.sink=sink}
        s.floatSamples=typeof analyser.getFloatTimeDomainData==='function';
        data=s.floatSamples?new Float32Array(analyser.fftSize):new Uint8Array(analyser.fftSize)
      }catch(e){inputFault(s,'AUDIO_ANALYSER_UNAVAILABLE');return}
      if(!current(s)){releaseStream(s);closeInputGraph(s);return}
'''+s[end:]
s=s.replace('noise:.008,raf:0', 'noise:.001,voiceEvidence:0,lastSampleAt:Date.now(),sampleCount:0,peakRms:0,lastClock:ctx.currentTime,clockAt:Date.now(),mutedAt:0,resuming:false,raf:0',1)
s=s.replace("        releaseStream(s);if(s.processed)return;s.processed=true;", "        releaseStream(s);closeInputGraph(s);if(s.processed)return;s.processed=true;",1)
s=s.replace("s.noSpeechTimer=setTimeout(function(){if(session===s&&!s.speechAt)stop('no-speech')},noSpeechMs());", "s.noSpeechTimer=setTimeout(function(){if(session!==s||s.speechAt)return;if(!s.audioCtx||s.audioCtx.state!=='running'||!s.sampleCount){inputFault(s,'AUDIO_INPUT_NOT_READY');return}stop('no-speech')},noSpeechMs());",1)
start=s.index('        if(analyser&&data){analyser.getByteTimeDomainData(data);')
end=s.index('\n        s.raf=requestAnimationFrame(loop)',start)
s=s[:start]+'''        if(!current(s)){cancelPending();return}
        var track=stream.getAudioTracks?stream.getAudioTracks()[0]:null;
        if(stream.active===false||track&&(track.readyState==='ended'||track.enabled===false)){inputFault(s,'AUDIO_TRACK_ENDED');return}
        if(track&&track.muted){
          if(!s.mutedAt)s.mutedAt=now;
          if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
          if(now-s.mutedAt>1500){inputFault(s,'AUDIO_TRACK_MUTED');return}
        }else if(ctx.state!=='running'){
          resumeInterruptedGraph(s)
        }else{
          if(s.mutedAt){s.mutedAt=0;if(s.speechAt)s.lastVoiceAt=now}
          // 'running' alone is insufficient on some mobile audio interruptions.
          if(typeof ctx.currentTime==='number'){
            if(ctx.currentTime!==s.lastClock){s.lastClock=ctx.currentTime;s.clockAt=now}
            else if(now-s.clockAt>1500){inputFault(s,'AUDIO_CLOCK_STALLED');return}
          }
          try{if(!sampleVoice(s,now)){inputFault(s,'AUDIO_ANALYSIS_INVALID');return}}catch(e){inputFault(s,'AUDIO_ANALYSIS_UNAVAILABLE');return}
        }'''+s[end:]
s=s.replace("releaseStream(s);try{if(s.audioCtx)s.audioCtx.close()}catch(_e){}", "releaseStream(s);closeInputGraph(s);",1)
assert hashlib.sha256(s.encode()).hexdigest()=='7163e7e56ecc2a74c007b226fde4f45b18098209a00706d60145d27f55a206dd'
p.write_text(s)
p=root/'sw.js';p.write_text(p.read_text().replace('coco-en-forma-v160.99.2-mic-single-owner-r1','coco-en-forma-v160.99.3-mic-mobile-input-r1'))
p=root/'eterna-worker/test/client-state-contract.test.mjs';p.write_text(p.read_text().replace(r'v160\.99\.2-mic-single-owner-r1',r'v160\.99\.3-mic-mobile-input-r1'))
p=root/'eterna-worker/test/mic-auto-send.test.mjs';s=p.read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='201b40769494dcb184e5999af5c627b8d51a24acaab3a20e1ac3e9f7f7be9320'
s=s.replace('canonical=false,delayedGate=false','canonical=false,delayedGate=false,floatInput=false,volume=.008,contextState="running",resumeStuck=false')
s=s.replace('const targetGuards=[];', 'const targetGuards=[],audioContexts=[],resourceTrace=[];')
old="  class AudioContext {state='running';createMediaStreamSource(){return{connect(){}}}createAnalyser(){return{fftSize:1024,getByteTimeDomainData(a){a.fill(voiced?144:128)}}}close(){return Promise.resolve()}resume(){return Promise.resolve()}}"
new="""  class AudioContext {
    constructor(){this.state=contextState;this.connections=[];this.resumes=0;this.closed=0;audioContexts.push(this);resourceTrace.push('context-created')}
    get currentTime(){return this.state==='running'?now/1000:0}
    createMediaStreamSource(){const n={connect(){},disconnect(){}};this.connections.push(n);return n}
    createGain(){const n={gain:{value:1},connect(){},disconnect(){}};this.connections.push(n);return n}
    createAnalyser(){const n={fftSize:1024,connect(){},disconnect(){},getByteTimeDomainData(a){a.fill(voiced?144:128)}};if(floatInput)n.getFloatTimeDomainData=a=>{for(let i=0;i<a.length;i++)a[i]=voiced?volume*Math.sin(i*.1):0};this.connections.push(n);return n}
    close(){this.state='closed';this.closed++;return Promise.resolve()}
    resume(){this.resumes++;resourceTrace.push('context-resumed');if(resumeStuck)return new Promise(()=>{});this.state='running';return Promise.resolve()}
  }"""
assert old in s;s=s.replace(old,new)
s=s.replace('getUserMedia:async()=>{const stream=',"getUserMedia:async()=>{resourceTrace.push('microphone-request');const stream=")
s=s.replace('return{window,document,ctx,field,send,mic,label,courseNode,requests,recorders,streams,sent,', 'return{window,document,ctx,field,send,mic,label,courseNode,requests,recorders,streams,sent,audioContexts,resourceTrace,\n    finishTurn(){requestPending=false;field.disabled=false;field.value="";send.disabled=true},\n    nextMode(mode){ctx.mode=mode;ctx.session_id="session-"+mode+"-"+(++ctx.epoch);emit(listeners,"coco:eterna-context-invalidated")},')
s+=r'''

// Mobile input regression: use real float amplitudes, not a permanently loud fake microphone.
for(const mode of ['homework','ask','review','explain','exam','practice']){
  test('quiet floating-point input auto-sends in '+mode,async()=>{const h=harness({floatInput:true,volume:.006});h.nextMode(mode);await speakThenPause(h,1500);assert.equal(h.send.clicks,1);assert.equal(h.audioContexts[0].state,'closed')});
}
test('one page records all six modes twice with fresh per-turn graphs',async()=>{
  const h=harness({floatInput:true,volume:.006});let count=0;
  for(const mode of ['explain','exam','practice','ask','review','homework','practice','review','exam','explain','homework','ask']){
    h.finishTurn();h.nextMode(mode);await h.start();await h.advance(150);h.voice(true);await h.advance(800);h.voice(false);await h.advance(1700);
    assert.equal(h.send.clicks,++count,mode);assert.equal(h.audioContexts.length,count);assert.ok(h.audioContexts.every(c=>c.state==='closed'));assert.ok(h.streams.every(s=>s.stopped>0));
  }
});
test('audio context is opened and resumed before microphone permission await',async()=>{const h=harness({contextState:'suspended'});await h.start();assert.deepEqual(h.resourceTrace.slice(0,3),['context-created','context-resumed','microphone-request']);h.event('pagehide')});
test('interrupted context is resumed on a new tap',async()=>{const h=harness({contextState:'interrupted',floatInput:true});await speakThenPause(h,1500);assert.equal(h.send.clicks,1);assert.equal(h.audioContexts[0].resumes,1)});
test('mid-recording interruption resumes the same graph without another recorder',async()=>{const h=harness({floatInput:true});await h.start();await h.advance(200);h.voice(true);await h.advance(400);h.audioContexts[0].state='interrupted';await h.advance(200);assert.equal(h.audioContexts[0].state,'running');h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,1);assert.equal(h.recorders.length,1)});
test('speaking immediately is not calibrated as background noise',async()=>{const h=harness({floatInput:true,volume:.01});h.voice(true);await h.start();await h.advance(2600);assert.equal(h.send.clicks,0);assert.equal(h.recorders[0].state,'recording');h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,1)});
test('real silence is still not transcribed or automatically sent',async()=>{const h=harness({floatInput:true});await h.start();await h.advance(13000);assert.equal(h.send.clicks,0);assert.equal(h.requests.length,0);assert.ok(h.audioContexts.every(c=>c.state==='closed'))});
test('an isolated brief click is not enough speech to submit',async()=>{const h=harness({floatInput:true});await h.start();await h.advance(200);h.voice(true);await h.advance(32);h.voice(false);await h.advance(13000);assert.equal(h.send.clicks,0);assert.equal(h.requests.length,0)});
test('blocked audio activation has a diagnostic, not a false no-speech message',async()=>{const h=harness({contextState:'interrupted',resumeStuck:true}),p=h.start();await flush();await h.advance(1600);await p;assert.equal(h.send.clicks,0);assert.equal(h.requests.length,0);assert.match(h.label.textContent,/AUDIO_CONTEXT_NOT_RUNNING/);assert.doesNotMatch(h.label.textContent,/No he oído voz/);assert.ok(h.audioContexts.every(c=>c.state==='closed'))});
test('silent output graph is muted and never plays the microphone to the speaker',async()=>{const h=harness({floatInput:true});await h.start();const gain=h.audioContexts[0].connections.find(n=>n.gain);assert.equal(gain.gain.value,0);h.event('pagehide')});
'''
assert hashlib.sha256(s.encode()).hexdigest()=='2dc467ee4fd98cf1c984329aa29e18cd4ebdd3551d9b2e2ce80e3d68feb3fb7c'
p.write_text(s)
print('Exact locally tested microphone and test bytes prepared; backend unchanged')
