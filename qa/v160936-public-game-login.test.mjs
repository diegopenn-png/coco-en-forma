import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir=path.dirname(fileURLToPath(import.meta.url));
const rootDir=path.dirname(qaDir);
const source=fs.readFileSync(path.join(rootDir,"coco-v144-core.js"),"utf8");
const names=["Une los números","Cálculo veloz","Sopa de letras","Sudoku","Memoria","Series lógicas","Descifra la palabra","Crucigrama","Reto tiempo","Verdadero o falso","Coco Med","Fútbol","Pádel"];

function harness(){
  const calls={toasts:[],scroll:0,focus:0,padel:0,prevent:0,stop:0,immediate:0};
  let listener=null,loggedOut=true;
  const email={closest:()=>({scrollIntoView(){calls.scroll+=1}}),focus(){calls.focus+=1}};
  const app={querySelectorAll:()=>[],querySelector:()=>null};
  const body={appendChild(node){calls.toasts.push(node.textContent);node.parentNode=body},classList:{add(){},remove(){}}};
  const document={
    readyState:"complete",body,documentElement:{classList:{add(){},remove(){}}},activeElement:null,
    getElementById:id=>id==="cocoApp"?app:null,
    querySelector:selector=>selector==="#cocoApp input[type='email']"&&loggedOut?email:null,
    createElement:()=>({className:"",textContent:"",parentNode:null,classList:{add(){},remove(){}},setAttribute(){},remove(){}}),
    addEventListener(type,handler,capture){if(type==="click"&&capture)listener=handler}
  };
  const window={
    COCO_CONFIG:{},
    CocoPadelV152:{open(){calls.padel+=1}},
    addEventListener(){}
  };
  const context=vm.createContext({window,document,localStorage:{getItem:()=>null,setItem(){}},console,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Promise,URL,crypto:{randomUUID:()=>"id"},MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout:fn=>{fn();return 1},clearTimeout(){}});
  vm.runInContext(source,context,{filename:"coco-v144-core.js"});
  function click(name,id=name==="Pádel"?"padel":"game"){
    const card={dataset:{cocoJuego:id},querySelector:()=>({textContent:name})};
    const target={closest(selector){
      if(selector===".cocoCardShare"||selector==="[data-coco-v144-open]")return null;
      if(selector==="button,.cocoMiniJuego")return card;
      if(selector===".cocoMiniJuego[data-coco-juego]"||selector===".cocoGameCard,.cocoMiniJuego")return card;
      return null;
    }};
    listener({target,preventDefault(){calls.prevent+=1},stopPropagation(){calls.stop+=1},stopImmediatePropagation(){calls.immediate+=1}});
  }
  return {calls,click,setLoggedOut:value=>{loggedOut=value}};
}

test("las 13 tarjetas públicas muestran un mensaje de login específico",()=>{
  const h=harness();
  names.forEach(name=>h.click(name));
  assert.deepEqual(h.calls.toasts,names.map(name=>`Inicia sesión para abrir ${name}.`));
  assert.equal(h.calls.prevent,13);
  assert.equal(h.calls.stop,13);
  assert.equal(h.calls.immediate,13);
  assert.equal(h.calls.scroll,13);
  assert.equal(h.calls.focus,13);
  assert.equal(h.calls.padel,0);
});

test("sin formulario público, el catálogo autenticado conserva sus acciones",()=>{
  const h=harness();h.setLoggedOut(false);
  h.click("Crucigrama","crucigrama");
  assert.equal(h.calls.prevent,0);
  assert.deepEqual(h.calls.toasts,[]);
  h.click("Pádel","padel");
  assert.equal(h.calls.padel,1);
});
