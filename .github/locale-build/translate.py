"""Build static Coco language resources from published educational copy only."""
import json, os, sys, time, urllib.request
from pathlib import Path
tag=sys.argv[1]
names={'en':'English','de':'German','nl':'Dutch','fr':'French','it':'Italian','pl':'Polish','uk':'Ukrainian','ru':'Russian','zh-Hans':'Simplified Chinese','ar':'Modern Standard Arabic','sv':'Swedish','fi':'Finnish','nb':'Norwegian Bokmål','da':'Danish'}
language=names[tag]
source=json.loads(Path('.github/locale-build/source.json').read_text())
out={}
groups={}
for key,scope,value,context in source:
 groups.setdefault(scope,[]).append((key,value,context))
def call(rows,scope):
 lang='English' if scope=='item' else 'Spanish'
 task={'item':'Original first-person self-reflection statements. Retain first person, frequency, construct and negation. Keep child wording simple.', 'med':'Original educational medical quiz text. Some options are intentionally false. Translate their actual meaning exactly; never correct or explain them. Use standard anatomy, physiology, statistics and chemistry terms. Preserve negation, ↑/↓, positive/negative, emergency distinctions, numbers, units, organism and drug names. The context is provided for disambiguation only.', 'report':'Personal reflection and coaching material. Preserve tentative language, limits, omissions, uncertainty, and age-appropriate language. Do not invent a diagnosis.', 'ui':'Interface and controls for a medical learning game and a self-reflection questionnaire.'}[scope]
 prompt='Translate each input from '+lang+' to '+language+'. '+task+' Return only an object with a translations array, exactly one answer for each input, in order. Do not add explanations, numbering, context, markdown, commentary or variants. Preserve named entities Coco, Coco Med, Eterna, original author names, formulas and placeholders. Use fluent '+language+'.'
 body={'messages':[{'role':'system','content':prompt},{'role':'user','content':json.dumps([{'text':r[1],**({'context':r[2]} if r[2] else {})} for r in rows],ensure_ascii=False)}],'chat_template_kwargs':{'enable_thinking':False},'temperature':0,'max_tokens':max(500,min(4400,sum(len(r[1]) for r in rows)*3+160)),'response_format':{'type':'json_schema','json_schema':{'name':'translated_text','schema':{'type':'object','properties':{'translations':{'type':'array','items':{'type':'string'},'minItems':len(rows),'maxItems':len(rows)}},'required':['translations'],'additionalProperties':False}}}}
 req=urllib.request.Request('http://127.0.0.1:8014/v1/chat/completions',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=480) as response:ans=json.load(response)['choices'][0]['message']['content']
 result=json.loads(ans)['translations']
 if len(result)!=len(rows) or any(not isinstance(v,str) or not v.strip() for v in result):raise ValueError('missing translation')
 return [v.strip() for v in result]
def translate(rows,scope):
 try: values=call(rows,scope)
 except Exception:
  if len(rows)==1:
   time.sleep(2);values=call(rows,scope)
  else:
   at=len(rows)//2;return translate(rows[:at],scope)+translate(rows[at:],scope)
 return values
for scope in ['item','report','ui','med']:
 rows=groups[scope]
 for start in range(0,len(rows),20):
  block=rows[start:start+20]
  values=[r[1] for r in block] if tag=='en' and scope=='item' else translate(block,scope)
  out.update((row[0],s) for row,s in zip(block,values))
  if start%300==0:print(tag,scope,start,'/',len(rows),flush=True)
 Path('out').mkdir(exist_ok=True);Path('out/'+tag+'.json').write_text(json.dumps(out,ensure_ascii=False))
assert len(out)==len(source)
