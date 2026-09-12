from pathlib import Path
import json,re,unicodedata,hashlib
root=Path(__file__).resolve().parents[2]
units=[json.loads(l) for l in (root/'qa/sprint/units-source.jsonl').read_text().splitlines()]
assert len(units)==9033
N=lambda v: ''.join(c for c in unicodedata.normalize('NFD',v).lower() if unicodedata.category(c)!='Mn')
subjects={s:sorted({u['subject'] for u in units if u['stage']==s and u['kind']=='subject_heading'}) for s in ['infantil','primaria','eso','bachillerato']}
words={}
for u in units:
 if u['kind'] not in ['knowledge_item','criterion']:continue
 for word in re.findall(r'[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]{3,35}',u['text']):words.setdefault(N(word),word.lower())
# Only vocabulary already present in public norms may be sent to the shared source lookup.
payload={'snapshot_id':'eterna-curriculum-map-2026.09.12-v1','source_elements':9033,'knowledge_items':3120,'criteria':1612,'subjects':subjects,'vocabulary':words,'normative_text_is_not_a_lesson':True,'territorial_consolidation_complete':False}
text=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
(root/'eterna-worker/src/library/compass-data-v1.js').write_text('/* Public normative vocabulary only; no student-derived data. */\nglobalThis.ETERNA_COMPASS_DATA='+text+';\n')
print(json.dumps({'vocabulary':len(words),'subject_families':sum(map(len,subjects.values())),'bytes':len(text.encode()),'sha256':hashlib.sha256(text.encode()).hexdigest()}))
