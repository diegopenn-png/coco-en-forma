/* ETERNA iOS/PWA microphone prime · v161.0.0
 * Purpose: acquire the microphone on the original trusted user gesture, before
 * async permission/profile checks in Eterna can cause Safari/PWA to lose the
 * activation window. The canonical recorder/VAD remains in eterna-experience-v160.js.
 * Scope: Eterna mic + persistent conversation only. No auth/payments/games changes.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_IOS_MIC_PRIME_V161000__)return;
  root.__ETERNA_IOS_MIC_PRIME_V161000__=true;

  var media=navigator.mediaDevices;
  if(!media||typeof media.getUserMedia!=='function')return;

  var originalGetUserMedia=media.getUserMedia.bind(media);
  var primed=null;
  var primedAt=0;
  var PRIME_TTL=12000;

  function isIOSLike(){
    var ua=String(navigator.userAgent||'');
    var platform=String(navigator.platform||'');
    var touch=Number(navigator.maxTouchPoints||0);
    return /iPhone|iPad|iPod/i.test(ua)||(platform==='MacIntel'&&touch>1)
  }

  function isEternaVoiceTarget(node){
    if(!node||!node.closest)return false;
    return Boolean(node.closest('#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 [data-et-mic]'))
  }

  function stopStream(stream){
    try{(stream&&stream.getTracks?stream.getTracks():[]).forEach(function(t){try{t.stop()}catch(e){}})}catch(e){}
  }

  function clearPrime(stop){
    var p=primed;
    primed=null;primedAt=0;
    if(stop&&p&&p.stream)stopStream(p.stream)
  }

  function primeNow(){
    if(!isIOSLike())return;
    if(primed&&Date.now()-primedAt<PRIME_TTL)return;
    clearPrime(true);
    primedAt=Date.now();
    var holder={stream:null,claimed:false,promise:null};
    holder.promise=originalGetUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}})
      .then(function(stream){
        holder.stream=stream;
        if(primed!==holder||Date.now()-primedAt>PRIME_TTL){stopStream(stream);throw new Error('ETERNA_MIC_PRIME_EXPIRED')}
        return stream
      })
      .catch(function(err){if(primed===holder)clearPrime(false);throw err});
    primed=holder;
    setTimeout(function(){if(primed===holder&&!holder.claimed)clearPrime(true)},PRIME_TTL+500)
  }

  /* Window capture runs before Eterna's document capture handlers. This keeps
     getUserMedia inside the original trusted tap on iOS/PWA. */
  root.addEventListener('click',function(event){
    if(!isEternaVoiceTarget(event.target))return;
    primeNow()
  },true);

  /* Reuse only the short-lived stream created for the Eterna voice tap.
     All unrelated getUserMedia calls keep their native behaviour. */
  try{
    media.getUserMedia=function(constraints){
      var wantsAudio=Boolean(constraints&&constraints.audio);
      var overlay=document.getElementById('eternaOverlayV159');
      var usable=Boolean(wantsAudio&&overlay&&overlay.classList.contains('is-open')&&primed&&Date.now()-primedAt<PRIME_TTL&&!primed.claimed);
      if(!usable)return originalGetUserMedia(constraints);
      var holder=primed;
      holder.claimed=true;
      primed=null;primedAt=0;
      return holder.promise
    }
  }catch(e){}

  root.addEventListener('coco:eterna-voice-state',function(event){
    var state=event&&event.detail&&event.detail.state||'';
    if(state==='listening'||state==='transcribing'||state==='speaking')clearPrime(false);
    if(state==='idle')clearPrime(true)
  });
  root.addEventListener('coco:eterna-ui-reset',function(){clearPrime(true)});
  root.addEventListener('coco:eterna-context-invalidated',function(){clearPrime(true)});
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearPrime(true)},{passive:true});
})(window);
