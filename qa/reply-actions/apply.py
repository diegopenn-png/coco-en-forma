"""Only remove the three response buttons Diego identified, not voice input or tutor behavior."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
EXPECTED={'eterna-v159.js':'de19099149319e31086e8e0f09a6952293326a03','index.html':'f5d547a8b38b7716a04ba16c7b5c706286e7b04d','sw.js':'b1694cfaa31bc445e283e5318a8af5a911799582'}
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
for name,want in EXPECTED.items():assert blob((ROOT/name).read_bytes())==want,name+' base changed'
p=ROOT/'eterna-v159.js';s=p.read_text();lines=s.splitlines(keepends=True)
found=[i for i,l in enumerate(lines)if 'if(canAct){var q=document.createElement("div");q.className="eternaV159Quick";' in l]
assert len(found)==1
old=lines[found[0]]
for marker in ['data-et-understood','data-et-hint','data-et-listen','data-et-listen-slow']:assert marker in old
lines[found[0]]='      // Reply actions 160.99.4: remove Pista/Escuchar/Más lento; keep the existing completion action outside exam/practice.\n      if(canAct&&state.mode!=="exam"&&state.mode!=="practice"){var q=document.createElement("div");q.className="eternaV159Quick";q.setAttribute("data-et-question-id",meta.question_id);q.innerHTML=\'<button type="button" data-et-understood>✅ Lo entendí</button>\';q.querySelector("[data-et-understood]").onclick=function(){sendStudentAction("understood",meta,q)};chat.appendChild(q)}\n'
p.write_text(''.join(lines))
p=ROOT/'sw.js';s=p.read_text();a='coco-en-forma-v160.99.3-mic-pwa-capture-r1';b='coco-en-forma-v160.99.4-reply-actions-r1';assert s.count(a)==1;p.write_text(s.replace(a,b))
p=ROOT/'index.html';s=p.read_text();replacements={'<script id="coco-v159-eterna" src="./eterna-v159.js?v=160980"></script>':'<script id="coco-v159-eterna" src="./eterna-v159.js?v=160994-reply-actions-r1"></script>','sw.js?v=160980-r1':'sw.js?v=160994-reply-actions-r1'}
for a,b in replacements.items():assert s.count(a)==1,(a,s.count(a));s=s.replace(a,b)
p.write_text(s)
report={'change':'remove three response buttons','base_commit':'679609154a891036d793f4ad656f3573ab07ed44','files':{},'worker_changed':False,'microphone_changed':False,'voice_autosend_changed':False,'subject_content_changed':False,'hint_via_chat_preserved':True,'automatic_voice_reply_path_preserved':True}
for name in EXPECTED:
 b=(ROOT/name).read_bytes();report['files'][name]={'sha':blob(b),'sha256':hashlib.sha256(b).hexdigest()}
o=ROOT/'reply-actions-evidence';o.mkdir(exist_ok=True);(o/'patch.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
