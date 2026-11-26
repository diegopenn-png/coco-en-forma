// Small dictionaries for the public catalogue; the game itself uses the same translations.
import {messages} from '../games/truco/locale.mjs';
import {guideCopy} from '../games/truco/guide-copy.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
export function buildTrucoLanguages(){
 const folder=new URL('../i18n/truco/',import.meta.url);mkdirSync(folder,{recursive:true});
 for(const [tag,m] of Object.entries(messages)){
   if(tag==='es')continue;
   const guide=guideCopy[tag],strings={};
   const add=(source,value)=>{strings[source]=value;};
   for(const key of ['title','entry','intro','start','ranking','hand','yourCards','points'])add(messages.es[key],m[key]);
   for(const key of Object.keys(guide))add(guideCopy.es[key],guide[key]);
   messages.es.rulesText.split('\n\n').forEach((source,i)=>add(source,m.rulesText.split('\n\n')[i]));
   add(guideCopy.es.headline+' | Coco en Forma',guide.headline+' | Coco en Forma');
   add('¿Qué es '+messages.es.title+'?',guide.qRules);
   add('¿Cómo accedo a '+messages.es.title+'?',guide.qFriends);
   add(guideCopy.es.access+' El botón de esta página te lleva al juego dentro de Coco.',guide.access);
   add('Copiar enlace de '+messages.es.title,m.share);
   writeFileSync(new URL(tag+'.json',folder),JSON.stringify({locale:tag,strings},null,1)+'\n');
 }
}
