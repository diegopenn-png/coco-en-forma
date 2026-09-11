# Exact, transcription-backend-preserving audio capture repair.
from pathlib import Path
from hashlib import sha256
p=Path('eterna-mic-only-v4.js');s=p.read_text()
helper="""  // Start the audio engine inside the tap, before any permission/network await.
  function closeCaptureAudio(s){
    if(!s)return;
    [s.source,s.analyser,s.silentOutput].forEach(function(n){try{if(n&&n.disconnect)n.disconnect()}catch(e){}});
    try{if(s.audioCtx&&s.audioCtx.state!=='closed'){var p=s.audioCtx.close();if(p&&p.catch)p.catch(function(){})}}catch(e){}
  }
  function resumeCaptureAudio(s){
    var ctx=s.audioCtx;if(!ctx||ctx.state==='closed')return Promise.resolve(false);
    if(ctx.state==='running')return Promise.resolve(true);
    return new Promise(function(resolve){
      var done=false,timer=setTimeout(function(){finish(false)},1200);
      function finish(ok){if(done)return;done=true;clearTimeout(timer);resolve(ok)}
      try{Promise.resolve(ctx.resume()).then(function(){finish(ctx.state==='running')},function(){finish(false)})}catch(e){finish(false)}
    })
  }
  function captureUnavailable(code){status('No se ha activado correctamente la detección de voz. Toca el micrófono para reactivarla. [MIC-CAPTURE-1 '+code+']','warn')}

"""
assert 'function resumeCaptureAudio' not in s
s=s.replace('  function releaseStream(s)',helper+'  function releaseStream(s)')
s=s.replace("if(session===s)stop('cancel');else releaseStream(s)","if(session===s)stop('cancel');else{releaseStream(s);closeCaptureAudio(s)}")
s=s.replace("reason==='no-speech'||reason==='error'", "reason==='no-speech'||reason==='error'||reason==='audio-unavailable'")
s=s.replace("    try{if(s.audioCtx)s.audioCtx.close()}catch(e){}", "    closeCaptureAudio(s);")
s=s.replace("    if(reason==='no-speech')status", "    if(reason==='audio-unavailable')captureUnavailable('ANALYSIS_INTERRUPTED');\n    if(reason==='no-speech')status")
s=s.replace("    var s=newTurn();\n    try{\n      var stream=", """    var s=newTurn(),AudioCtx=root.AudioContext||root.webkitAudioContext,ctx=null,warm=null;
    try{
      // Creating and resuming after getUserMedia can lose the iOS user activation.
      if(AudioCtx){ctx=new AudioCtx();s.audioCtx=ctx;warm=resumeCaptureAudio(s)}
      if(!ctx){if(pending===s)pending=null;captureUnavailable('ANALYSER_UNAVAILABLE');return}
      var stream=""")
s=s.replace("if(!current(s)){releaseStream(s);return}", "if(!current(s)){releaseStream(s);closeCaptureAudio(s);return}")
old="""      var AudioCtx=root.AudioContext||root.webkitAudioContext,ctx=AudioCtx?new AudioCtx():null,analyser=null,data=null,source=null;s.audioCtx=ctx;
      if(ctx){try{if(ctx.state==='suspended')await ctx.resume();source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.2;source.connect(analyser);data=new Uint8Array(analyser.fftSize)}catch(e){try{ctx.close()}catch(_e){}ctx=null;analyser=null}}
      if(!current(s)){releaseStream(s);try{if(ctx)ctx.close()}catch(e){}return}
"""
new="""      if(warm)await warm;
      if(!current(s)){releaseStream(s);closeCaptureAudio(s);return}
      if(ctx.state!=='running'&&!await resumeCaptureAudio(s)){
        if(current(s))captureUnavailable('AUDIO_CONTEXT_START_TIMEOUT');
        if(pending===s)pending=null;releaseStream(s);closeCaptureAudio(s);return
      }
      if(!current(s)){releaseStream(s);closeCaptureAudio(s);return}
      var analyser=null,data=null,source=null,floatData=false;
      try{
        source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.2;
        s.source=source;s.analyser=analyser;source.connect(analyser);
        // Keep analysis pulled in WebKit without playing the child's microphone back.
        if(ctx.createGain&&ctx.destination){s.silentOutput=ctx.createGain();s.silentOutput.gain.value=0;analyser.connect(s.silentOutput);s.silentOutput.connect(ctx.destination)}
        floatData=typeof analyser.getFloatTimeDomainData==='function';data=floatData?new Float32Array(analyser.fftSize):new Uint8Array(analyser.fftSize)
      }catch(e){if(pending===s)pending=null;releaseStream(s);closeCaptureAudio(s);captureUnavailable('ANALYSER_UNAVAILABLE');return}
      if(!current(s)){releaseStream(s);closeCaptureAudio(s);return}
"""
assert old in s;s=s.replace(old,new)
s=s.replace('noise:.008,raf:0','noise:.0015,candidateAt:0,recovering:false,floatData:floatData,raf:0')
s=s.replace("s.noSpeechTimer=setTimeout(function(){if(session===s&&!s.speechAt)stop('no-speech')},noSpeechMs());", "s.noSpeechTimer=setTimeout(function(){if(session===s&&!s.speechAt)stop(s.recovering||ctx.state!=='running'?'audio-unavailable':'no-speech')},noSpeechMs());")
start=s.index('        if(analyser&&data){analyser.getByteTimeDomainData(data);');end=s.index('        s.raf=requestAnimationFrame(loop)',start)
s=s[:start]+"""        if(ctx.state!=='running'){
          if(!s.recovering){
            s.recovering=true;if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
            resumeCaptureAudio(s).then(function(ok){if(session!==s)return;s.recovering=false;if(!ok){stop('audio-unavailable');return}if(s.speechAt)s.lastVoiceAt=Date.now()})
          }
          s.raf=requestAnimationFrame(loop);return
        }
        if(analyser&&data){
          if(s.floatData)analyser.getFloatTimeDomainData(data);else analyser.getByteTimeDomainData(data);
          var sum=0,mean=0;for(var i=0;i<data.length;i++){var v=s.floatData?data[i]:(data[i]-128)/128;sum+=v*v;mean+=v}
          // Float samples retain soft voices; remove DC offset only on that precise path.
          var variance=sum/data.length-(s.floatData?Math.pow(mean/data.length,2):0),rms=Math.sqrt(Math.max(0,variance));
          var threshold=Math.max(.004,s.noise*2.2);
          if(rms>threshold){
            if(!s.candidateAt)s.candidateAt=now;
            if(!s.speechAt&&now-s.candidateAt>=64)s.speechAt=s.candidateAt;
            s.lastVoiceAt=now;
            if(s.speechAt&&s.noSpeechTimer){clearTimeout(s.noSpeechTimer);s.noSpeechTimer=null}
            if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
          }else{
            s.candidateAt=0;
            // Never calibrate using detected speech, including the first syllable.
            if(!s.speechAt)s.noise=Math.max(.0005,Math.min(.0025,s.noise*.95+rms*.05));
            if(s.speechAt&&now-s.lastVoiceAt>180&&!s.silenceTimer)s.silenceTimer=setTimeout(function(){if(session===s)stop('silence')},Math.max(0,s.pauseMs-(now-s.lastVoiceAt)))
          }
        }
"""+s[end:]
s=s.replace("releaseStream(s);try{if(s.audioCtx)s.audioCtx.close()}catch(_e){}", "releaseStream(s);closeCaptureAudio(s);")
s=s.replace("var mime=recorderMime(),rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream),chunks=[];", "var mime=recorderMime(),rec=null,chunks=[];")
s=s.replace('      Object.assign(s,{rec:rec,',"      rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);\n      Object.assign(s,{rec:rec,")
assert sha256(s.encode()).hexdigest()=='3af0f8c1bc58a6f4ca017d46b2f9813b58488bdd530721845337df8318fb3d21','Mismatch with locally tested microphone'
p.write_text(s)
p=Path('sw.js');s=p.read_text().replace('coco-en-forma-v160.99.2-mic-single-owner-r1','coco-en-forma-v160.99.3-mic-pwa-capture-r1');assert sha256(s.encode()).hexdigest()=='22313d9b77098b1b62be9f0117e97895501917fc7bcea993a3711af17c9949b8';p.write_text(s)
p=Path('eterna-worker/test/client-state-contract.test.mjs');s=p.read_text().replace(r'v160\.99\.2-mic-single-owner-r1',r'v160\.99\.3-mic-pwa-capture-r1');assert sha256(s.encode()).hexdigest()=='fe831ed390926f7ead7f4f87355902308b4e34029aeadea9b17bb02c7baa45b0';p.write_text(s)
print('Applied only microphone activation/VAD and release cache. Backend untouched.')
