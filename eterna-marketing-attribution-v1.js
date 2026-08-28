/* ETERNA Growth · marketing attribution v1.2
 * First-party only. Persists campaign attribution for an authenticated adult
 * after explicit measurement consent. No academic/minor content is collected.
 * Auth result hook uses the successful Supabase session token deterministically.
 * A marketing session can be consumed only once per browser and only after explicit auth.
 */
;(function(root){
  "use strict";
  if(root.__ETERNA_MARKETING_ATTRIBUTION_V1__)return;
  root.__ETERNA_MARKETING_ATTRIBUTION_V1__=true;

  var CONSENT_KEY="cef_marketing_measurement_consent_v1";
  var ATTR_KEY="cef_marketing_trial_attribution_v1";
  var USED_KEY="cef_marketing_attributed_sessions_v1";
  var CONSENT_VERSION="2026-08-28-v1";
  var TTL=24*60*60*1000;
  var USED_TTL=30*24*60*60*1000;
  var bound=false,persisting=false,authHooked=false;

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
  function usedSessions(){
    try{
      var now=Date.now(),raw=JSON.parse(localStorage.getItem(USED_KEY)||"[]");
      if(!Array.isArray(raw))raw=[];
      var cleanList=raw.filter(function(x){return x&&validUuid(x.sid)&&Number(x.at)>0&&now-Number(x.at)<=USED_TTL}).slice(-32);
      if(cleanList.length!==raw.length)localStorage.setItem(USED_KEY,JSON.stringify(cleanList));
      return cleanList
    }catch(e){return []}
  }
  function wasUsed(sid){
    if(!validUuid(sid))return false;
    return usedSessions().some(function(x){return x.sid===sid})
  }
  function markUsed(sid){
    if(!validUuid(sid))return;
    try{
      var list=usedSessions().filter(function(x){return x.sid!==sid});
      list.push({sid:sid,at:Date.now()});
      localStorage.setItem(USED_KEY,JSON.stringify(list.slice(-32)))
    }catch(e){}
  }
  function capture(){
    if(!consent())return null;
    try{
      var q=new URLSearchParams(location.search),sid=clean(q.get("mkt_session"),80,"");
      if(!validUuid(sid))return null;
      if(wasUsed(sid)){
        var old=JSON.parse(localStorage.getItem(ATTR_KEY)||"null");
        if(old&&old.anonymous_session_id===sid)localStorage.removeItem(ATTR_KEY);
        return null
      }
      var existing=JSON.parse(localStorage.getItem(ATTR_KEY)||"null");
      if(existing&&existing.anonymous_session_id===sid&&existing.at&&Date.now()-Number(existing.at)<=TTL)return existing;
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
  async function persist(session){
    if(persisting||!consent())return false;
    var d=stored(),u=session&&session.user,token=session&&session.access_token,cfg=root.COCO_CONFIG||{};
    if(!d||!u||!u.id||!token||!cfg.url||!cfg.clave)return false;
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
      var endpoint=String(cfg.url).replace(/\/+$/,"")+"/rest/v1/eterna_marketing_attribution";
      var r=await fetch(endpoint,{
        method:"POST",
        headers:{
          "apikey":String(cfg.clave),
          "Authorization":"Bearer "+String(token),
          "Content-Type":"application/json",
          "Prefer":"return=minimal"
        },
        body:JSON.stringify(row),
        cache:"no-store",
        credentials:"omit"
      });
      if(r&&((r.status>=200&&r.status<300)||r.status===409)){
        markUsed(d.anonymous_session_id);
        try{localStorage.removeItem(ATTR_KEY)}catch(e){}
        return true
      }
      return false
    }catch(e){
      return false
    }finally{persisting=false}
  }
  function hookAuth(c){
    if(authHooked||!c||!c.auth)return;
    var auth=c.auth;
    ["signInWithPassword","signUp"].forEach(function(name){
      var original=auth[name];
      if(typeof original!=="function")return;
      auth[name]=async function(){
        var result=await original.apply(this,arguments);
        try{
          var session=result&&result.data&&result.data.session;
          if(session)await persist(session)
        }catch(e){}
        return result
      }
    });
    authHooked=true
  }
  function probe(){
    if(!consent())return;
    capture();
    bind()
  }
  function bind(){
    var c=client();if(!c||!c.auth)return;
    hookAuth(c);
    if(bound)return;
    bound=true;
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
