import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir=path.dirname(fileURLToPath(import.meta.url));
const rootDir=path.dirname(qaDir);
const source=fs.readFileSync(path.join(rootDir,"coco-v152-padel.js"),"utf8");

function loadPadel(session){
  const calls={modal:0,toast:[],scroll:0,focus:0};
  const email={
    closest(){return {scrollIntoView(){calls.scroll+=1}}},
    focus(){calls.focus+=1}
  };
  const window={CocoV144:{
    session:async()=>session,
    client:()=>null,
    openModal(){calls.modal+=1},
    toast(message){calls.toast.push(message)},
    body:()=>null,
    id:prefix=>`${prefix}-1`,
    today:()=>"2026-09-05",
    esc:value=>String(value??""),
    setModalTitle(){}
  }};
  const context=vm.createContext({
    window,console,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Promise,URL,Blob,
    document:{querySelector:selector=>selector==="#cocoApp input[type='email']"?email:null},
    localStorage:{getItem:()=>null,setItem(){}},
    navigator:{},
    setTimeout:fn=>{fn();return 1},
    clearTimeout(){}
  });
  vm.runInContext(source,context,{filename:"coco-v152-padel.js"});
  return {padel:window.CocoPadelV152,calls};
}

test("Pádel rechaza visitantes y dirige el foco al login",async()=>{
  const {padel,calls}=loadPadel(null);
  assert.equal(await padel.open(),false);
  assert.equal(calls.modal,0);
  assert.deepEqual(calls.toast,["Inicia sesión para abrir Pádel."]);
  assert.equal(calls.scroll,1);
  assert.equal(calls.focus,1);
});

test("Pádel conserva la apertura con una sesión válida",async()=>{
  const {padel,calls}=loadPadel({user:{id:"user-1"}});
  await padel.open();
  assert.equal(calls.modal,1);
  assert.deepEqual(calls.toast,[]);
});

test("el fingerprint y el service worker publican el control de acceso",()=>{
  const html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  const sw=fs.readFileSync(path.join(rootDir,"sw.js"),"utf8");
  assert.match(html,/coco-v152-padel\.js\?v=15201/);
  assert.match(sw,/coco-en-forma-v160\.94\.2-audit-1-3-r1/);
});
