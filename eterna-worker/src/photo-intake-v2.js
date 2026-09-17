/*
 * ETERNA unified school-photo intake v2
 *
 * This module owns only perception. It never tutors, grades or bypasses the
 * existing safety/scope/pedagogy pipeline. Every mode receives the same
 * grounded representation of the current photograph.
 */

export const PHOTO_INTAKE_VERSION="unified-school-photo-intake-v2";

const PHOTO_MODES=new Set(["homework","ask","review","explain","exam","practice"]);

export function normalizePhotoMode(value){
  const mode=String(value||"").trim();
  return PHOTO_MODES.has(mode)?mode:"homework"
}

export function orderedPhotoImages(fullImage,regions=[]){
  const values=[fullImage,...(Array.isArray(regions)?regions:[])].filter(value=>typeof value==="string"&&/^data:image\/(?:png|jpeg|webp);base64,/.test(value));
  return[...new Set(values)].slice(0,3)
}

export function schoolPhotoPrompt({mode,text,profile,regionIndex=0,regionTotal=1}={}){
  const safeMode=normalizePhotoMode(mode),position=regionTotal>1?` Esta es la zona ${regionIndex+1} de ${regionTotal} de la misma fotografía.`:"";
  return `Observa los píxeles de ESTA fotografía escolar del turno actual.${position}
El modo de ayuda elegido es ${safeMode}, pero el modo no determina la asignatura ni puede cambiar lo visible.
Perfil escolar: ${JSON.stringify(profile||{})}.
Mensaje acompañante: ${String(text||"").slice(0,1600)}.

Transcribe con fidelidad el enunciado, palabras, letras, números, símbolos, dibujos, mapas, diagramas, gráficos, tablas, huecos y respuestas manuscritas que realmente se vean. Conserva el orden y la relación espacial. Distingue contenido impreso, escritura del alumno y espacios pendientes. No resuelvas la tarea. No completes huecos. No uses conversaciones anteriores para inferir la materia. No presupongas Matemáticas: puede ser Lengua, Literatura, Inglés u otro idioma, Ciencias, Biología, Física, Química, Historia, Geografía, Tecnología, Arte, Música, Educación Física u otra asignatura. Si algo no se distingue, indícalo como dudoso en vez de inventarlo. Devuelve una descripción visual concreta; nunca respondas solo que es una ficha o que no se proporcionó una imagen.`
}

export function cloudflareMultimodalPayload({imageDataUrl,prompt,maxTokens=2600}={}){
  return{
    messages:[{
      role:"user",
      content:[
        {type:"text",text:String(prompt||"")},
        {type:"image_url",image_url:{url:String(imageDataUrl||"")}}
      ]
    }],
    max_tokens:Math.max(256,Math.min(4096,Number(maxTokens)||2600)),
    temperature:.1,
    stream:false
  }
}

export function cloudflareResponseText(result){
  if(typeof result?.response==="string")return result.response.trim();
  if(typeof result?.answer==="string")return result.answer.trim();
  if(typeof result?.description==="string")return result.description.trim();
  if(typeof result?.caption==="string")return result.caption.trim();
  if(typeof result==="string")return result.trim();
  return""
}

export function schoolPhotoEvidenceUsable(value){
  const text=String(value||"").trim(),words=text.split(/\s+/).filter(Boolean);
  if(text.length<20||words.length<4)return false;
  if(/\b(?:no (?:se )?(?:proporcion[oó]|adjunt[oó]) (?:una )?imagen|imagen no proporcionada|no image (?:was )?provided|missing image)\b/i.test(text))return false;
  const concrete=/\b(?:palabra|letra|frase|enunciado|t[ií]tulo|hueco|casilla|fila|columna|tabla|dibujo|diagrama|gr[aá]fic|s[ií]mbolo|n[uú]mero|word|letter|sentence|blank|row|column|table|diagram|symbol|number)\b/i.test(text);
  return concrete||/[=×xX÷+−_]/.test(text)||words.length>=14
}

export async function readCloudflareSchoolPhoto({run,model,imageDataUrl,mode,text,profile,regionIndex=0,regionTotal=1,maxTokens=2600}={}){
  if(typeof run!=="function")throw new Error("Cloudflare AI binding is unavailable");
  const prompt=schoolPhotoPrompt({mode,text,profile,regionIndex,regionTotal}),payload=cloudflareMultimodalPayload({imageDataUrl,prompt,maxTokens}),result=await run(model,payload),evidence=cloudflareResponseText(result);
  if(!schoolPhotoEvidenceUsable(evidence))throw new Error("The visual model did not return grounded photo evidence");
  return{evidence,usage:result?.usage||{},model,payload_contract:PHOTO_INTAKE_VERSION}
}
