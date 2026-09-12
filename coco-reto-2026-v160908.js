/* Coco en Forma · Reto Coco 2026 · disabled v160.100.0
 * Promotional Reto card remains removed. This compatibility hook now loads
 * the family-friendly profile/report layer without changing the home layout.
 */
(function(){
  'use strict';
  var existing=document.getElementById('cocoReto2026');
  if(existing&&existing.parentNode) existing.parentNode.removeChild(existing);
  if(!document.getElementById('coco-family-friendly-v160100')){
    var s=document.createElement('script');
    s.id='coco-family-friendly-v160100';
    s.src='./coco-family-friendly-v160100.js?v=160100';
    s.defer=true;
    (document.head||document.documentElement).appendChild(s);
  }
})();
