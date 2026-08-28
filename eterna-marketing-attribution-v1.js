/* ETERNA Growth · marketing attribution v1
 * First-party only. Persists campaign attribution for an authenticated adult
 * after explicit measurement consent. No academic/minor content is collected.
 */
;(function(root){
  "use strict";
  if(root.__ETERNA_MARKETING_ATTRIBUTION_V1__)return;
  root.__ETERNA_MARKETING_ATTRIBUTION_V1__=true;

  var CONSENT_KEY="cef_marketing_measurement_consent_v1";
  var ATTR_KEY="cef_marketing_trial_attribution_v1";
  var CONSENT_VERSION="2026-08-28-v1";
  var TTL=24*60*60*1000;
  var bound=false,persisting=false;

  function clean(v,max,fallback){
    v=String(v==null?"":v).trim();
    if(!v)return fallback||"";
    return v.slice(0,max||200)
  }
  function validUuid(v){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||""))
  }
  function consent(){
    try{return localStorage.getItem(CONSENT_KEY)==="accepted"}catch(e){return false}
  }
  function capture(){
    if(!consent())return null;
    try{
      var q=new URLSearchParams(location.search),sid=clean(q.get("mkt_session"),80,"");
      if(!validUuid(sid))return null;
      var d={
        at:Date.now(),
        anonymous_session_id:sid,
        source:clean(q.get("utm_source")||q.get("source"),120,"direct"),
        medium:clean(q.get("utm_medium"),120,"none"),
        campaign:clean(q.get("utm_campaign"),200,"none"),
        content:clean(q.get("utm_content"),200,"none"),
        term:clean(q.get("utm_term"),200,"none"),
        gclid:q.get("gclid")?clean(q.get("gclid"),500,""):null,
        fbclid:q.get("fbclid")?clean(q.get("fbclid"),500,""):null
      };
      localStorage.setItem(ATTR_KEY,JSON.stringify(d));
      return d
    }catch(e){return null}
  }
  function stored(){
    if(!consent())return null;
    try{
      var d=JSON.parse(localStorage.getItem(ATTR_KEY)||"null");
      if(!d||!d.at||Date.now()-Number(d.at)>TTL||!validUuid(d.anonymous_session_id)){
        localStorage.removeItem(ATTR_KEY);return null
      }
      return d
    }catch(e){return null}
  }
  function client(){
    if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;
    var cfg=root.COCO_CONFIG||{};
    if(!root.supabase||!root.supabase.createClient||!cfg.url||!cfg.clave)return null;
    try{
      return root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(cfg.url,cfg.clave,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
      })
    }catch(e){return null}
  }
  async function getSession(){
    var c=client();if(!c||!c.auth)return null;
    try{var r=await c.auth.getSession();return r&&r.data?r.data.session:null}catch(e){return null}
  }
  async function persist(session){
    if(persisting||!consent())return false;
    var d=stored(),c=client(),u=session&&session.user;
    if(!d||!c||!u||!u.id)return false;
    persisting=true;
    try{
      var row={
        user_id:u.id,
        anonymous_session_id:d.anonymous_session_id,
        source:clean(d.source,120,"direct"),
        medium:clean(d.medium,120,"none"),
        campaign:clean(d.campaign,200,"none"),
        content:clean(d.content,200,"none"),
        term:clean(d.term,200,"none"),
        gclid:d.gclid?clean(d.gclid,500,""):null,
        fbclid:d.fbclid?clean(d.fbclid,500,""):null,
        consent_version:CONSENT_VERSION
      };
      var r=await c.from("eterna_marketing_attribution").insert(row);
      if(r&&r.error&&String(r.error.code||"")!=="23505")throw r.error;
      try{localStorage.removeItem(ATTR_KEY)}catch(e){}
      return true
    }catch(e){
      return false
    }finally{persisting=false}
  }
  async function probe(){
    if(!consent())return;
    capture();
    var s=await getSession();
    if(s)await persist(s)
  }
  function bind(){
    if(bound)return;
    var c=client();if(!c||!c.auth)return;
    bound=true;
    try{c.auth.onAuthStateChange(function(_event,session){if(session)persist(session)})}catch(e){}
    root.addEventListener("coco:daily-user",function(){probe()})
  }
  function install(){
    capture();bind();
    [200,700,1600,3500,7000].forEach(function(ms){
      setTimeout(function(){bind();probe()},ms)
    })
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install()
})(window);
