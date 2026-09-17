import test from "node:test";
import assert from "node:assert/strict";
import {
  PHOTO_INTAKE_VERSION,
  cloudflareMultimodalPayload,
  normalizePhotoMode,
  orderedPhotoImages,
  readCloudflareSchoolPhoto,
  schoolPhotoPrompt,
  schoolPhotoEvidenceUsable
} from "../src/photo-intake-v2.js";

const image="data:image/jpeg;base64,AQID";

test("all six modes share one photo input contract",()=>{
  for(const mode of ["homework","ask","review","explain","exam","practice"])assert.equal(normalizePhotoMode(mode),mode);
  assert.equal(normalizePhotoMode("unknown"),"homework");
  assert.equal(PHOTO_INTAKE_VERSION,"unified-school-photo-intake-v2")
});

test("Cloudflare receives the actual data URL through its documented multimodal message",()=>{
  const payload=cloudflareMultimodalPayload({imageDataUrl:image,prompt:"Lee la ficha"}),parts=payload.messages[0].content;
  assert.deepEqual(parts[0],{type:"text",text:"Lee la ficha"});
  assert.deepEqual(parts[1],{type:"image_url",image_url:{url:image}});
  assert.equal("image" in payload,false)
});

test("the complete photo is always first and regions stay bounded",()=>{
  const regionA="data:image/png;base64,BAUG",regionB="data:image/webp;base64,BwgJ";
  assert.deepEqual(orderedPhotoImages(image,[regionA,regionB,regionA,"bad"]),[image,regionA,regionB])
});

test("missing-image diagnostics are rejected as visual evidence",()=>{
  assert.equal(schoolPhotoEvidenceUsable("No se proporcionó una imagen para analizar la tarea."),false);
  assert.equal(schoolPhotoEvidenceUsable("Se ve el enunciado Completa con b o v y las palabras ser_icio, her_ido y escri_ir."),true)
});

test("photo perception is subject-neutral and keeps the selected mode",async()=>{
  let captured=null;
  const result=await readCloudflareSchoolPhoto({
    run:async(_model,payload)=>{captured=payload;return{response:"Se ve una ficha de Lengua con el enunciado Completa con b o v y seis palabras con huecos."}},
    model:"@cf/meta/llama-4-scout-17b-16e-instruct",
    imageDataUrl:image,
    mode:"explain",
    text:"He adjuntado una foto de mi tarea",
    profile:{school_year:"5º de Primaria"}
  });
  const prompt=captured.messages[0].content[0].text;
  assert.match(prompt,/modo de ayuda elegido es explain/);
  assert.match(prompt,/No presupongas Matemáticas/);
  assert.equal(captured.messages[0].content[1].image_url.url,image);
  assert.match(result.evidence,/Completa con b o v/)
});

test("the general reader covers text, science, humanities, arts and mathematics",()=>{
  const prompt=schoolPhotoPrompt({mode:"homework",text:"He adjuntado una foto",profile:{school_year:"5º de Primaria"}});
  for(const subject of ["Lengua","Inglés","Ciencias","Biología","Física","Química","Historia","Geografía","Tecnología","Arte","Música","Educación Física","Matemáticas"]){
    assert.match(prompt,new RegExp(subject));
  }
  for(const material of ["dibujos","mapas","diagramas","gráficos","tablas","respuestas manuscritas"]){
    assert.match(prompt,new RegExp(material));
  }
});
