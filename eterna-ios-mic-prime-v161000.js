/* ETERNA iOS/PWA microphone prime · v161.0.1
 * Keeps microphone acquisition inside the original trusted iOS gesture and
 * preserves that live stream while Eterna/legal checks replay the mic action.
 * The canonical recorder/VAD remains in eterna-experience-v160.js.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_IOS_MIC_PRIME_V161001__)return;
  root.__ETERNA_IOS_MIC_PRIME_V161001__=true;

  var media=navigator.mediaDevices;
  if(!media||typeof media.getUserMedia!=='function')return;
  var originalGetUserMedia=media.getUserMedia.bind(media);
  var primed=null,primedAt=0;
  var PRIME_TTL=30000;

  function isIOSLike(){
    var ua=String(navigator.userAgent||''),platform=String(navigator.platform||''),touch=Number(navigator.maxTouchPoints||0);
    return /iPhone|iPad|iPod/i.test(ua)||(platform==='MacIntel'&&touch>1)
  }
  function isVoiceTarget(node){return Boolean(node&&node.closest&&node.closest('#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 [data-et-mic]'))}
  function stopStream(stream){try{(stream&&stream.getTracks?stream.getTracks():[]).forEach(function(t){try{t.stop()}catch(e){}})}catch(e){}}
  function streamLive(stream){
    try{var tracks=stream&&stream.getAudioTracks?stream.getAudioTracks():[];return Boolean(tracks.length&&tracks.some(function(t){return t.readyState==='live'&&t.enabled!==false}))}catch(e){return false}
  }
  function clearPrime(stop){var p=primed;primed=null;primedAt=0;if(stop&&p&&p.stream)stopStream(p.stream)}

  function primeNow(){
    if(!isIOSLike())return;
    if(primed&&Date.now()-primedAt<PRIME_TTL&&(primed.promise||streamLive(primed.stream)))return;
    clearPrime(true);
    primedAt=Date.now();
    var holder={stream:null,claimed:false,promise:null};
    /* Keep constraints deliberately simple on iOS. Eterna applies VAD itself. */
    holder.promise=originalGetUserMedia({audio:true}).then(function(stream){
      holder.stream=stream;
      if(primed!==holder){stopStream(stream);throw new Error('ETERNA_MIC_PRIME_REPLACED')}
      return stream
    }).catch(function(err){if(primed===holder)clearPrime(false);throw err});
    primed=holder;
    setTimeout(function(){if(primed===holder&&!holder.claimed)clearPrime(true)},PRIME_TTL+1000)
  }

  /* pointerdown/touchstart are earlier than click and remain trusted user gestures. */
  ['pointerdown','touchstart','click'].forEach(function(type){
    root.addEventListener(type,function(event){if(isVoiceTarget(event.target))primeNow()},true)
  });

  try{
    media.getUserMedia=function(constraints){
      var wantsAudio=Boolean(constraints&&constraints.audio),o=document.getElementById('eternaOverlayV159');
      var usable=Boolean(wantsAudio&&o&&o.classList.contains('is-open')&&primed&&Date.now()-primedAt<PRIME_TTL&&!primed.claimed);
      if(!usable)return originalGetUserMedia(constraints);
      var holder=primed;
      holder.claimed=true;
      primed=null;primedAt=0;
      return Promise.resolve(holder.promise).then(function(stream){
        if(!streamLive(stream))throw new Error('ETERNA_MIC_PRIME_NOT_LIVE');
        return stream
      })
    }
  }catch(e){}

  /* Do NOT clear on idle: legal/permission replay can emit/reset idle before
     the canonical recorder claims the stream. Clear only once recording has
     genuinely progressed, or when the Eterna context is abandoned. */
  root.addEventListener('coco:eterna-voice-state',function(event){
    var state=event&&event.detail&&event.detail.state||'';
    if(state==='listening'||state==='transcribing'||state==='speaking')clearPrime(false)
  });
  root.addEventListener('coco:eterna-ui-reset',function(){clearPrime(true)});
  root.addEventListener('coco:eterna-context-invalidated',function(){clearPrime(true)});
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearPrime(true)},{passive:true});
})(window);
