import fs from 'node:fs';
// Retrigger validated patch from current main after PR #86 merged before the bot commit landed.
const path='eterna-worker/src/index.js';
let s=fs.readFileSync(path,'utf8');
const oldVersion='const VERSION="160.99.14-full-image-arithmetic-ocr";';
if(!s.includes(oldVersion)&&!s.includes('const VERSION="160.99.15-general-worksheet-vision";')) throw new Error('unexpected worker version');
s=s.replace(oldVersion,'const VERSION="160.99.15-general-worksheet-vision";');
const anchor='  if(aiProvider(env)==="cloudflare"&&openaiFallbackEnabled(env)&&visionNeedsClarification(reliableVisionForReasoning(best?.vision))){';
if(!s.includes(anchor)&&!s.includes('ETERNA VISION GENERAL REGIONS')) throw new Error('general vision insertion anchor missing');
if(!s.includes('ETERNA VISION GENERAL REGIONS')){
  const insert=`  if(aiProvider(env)==="cloudflare"&&visionNeedsClarification(reliableVisionForReasoning(best?.vision))){\n    const generalImages=arithmeticVisionImages(image,imageRegions);\n    const settled=await Promise.allSettled(generalImages.map((region,index)=>structured(env,{...args,input:[{role:"user",content:[{type:"input_text",text:\`${'${prompt}'}\\nEsta es la zona ${'${index+1}'} de ${'${generalImages.length}'} de la misma hoja. Es una lectura GENERAL de material escolar: puede ser Lengua, Inglés, Ciencias, Matemáticas u otra asignatura. Transcribe literalmente instrucciones, palabras, frases, letras, símbolos y huecos visibles. No presupongas que es aritmética. Si el mensaje del alumno aclara la asignatura, úsalo para interpretar la tarea, no para repetir una petición de foto. Que la hoja continúe fuera del recorte no obliga a pedir otra foto.\`},{type:"input_image",image_url:region,detail:"high"}]}],name:\`eterna_general_region_${'${index+1}'}\`})));\n    const generalData=settled.filter(result=>result.status==="fulfilled").map(result=>result.value.data),generalMerged=mergeRegionalIntakes([best,...generalData]),generalScore=visionReliabilityScore(generalMerged?.vision);\n    console.error("ETERNA VISION GENERAL REGIONS",\`previous_score=${'${bestScore}'}\`,\`general_score=${'${generalScore}'}\`,\`regions=${'${generalImages.length}'}\`);\n    if(generalMerged&&generalScore>bestScore){best=generalMerged;bestScore=generalScore}\n  }\n`;
  s=s.replace(anchor,insert+anchor);
}
fs.writeFileSync(path,s);
