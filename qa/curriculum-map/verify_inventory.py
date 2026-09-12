from pathlib import Path
import json,hashlib,collections,sys
base=Path(sys.argv[1] if len(sys.argv)>1 else 'curriculum-traceability-evidence')
units=[json.loads(x)for x in(base/'national/units.jsonl').read_text().splitlines()];report=json.loads((base/'national/national-inventory.json').read_text())
assert len(units)==9033 and len({u['unit_id']for u in units})==9033
counts=collections.Counter(u['kind']for u in units);assert counts['criterion']==1612 and counts['knowledge_item']==3120 and counts['subject_heading']==70
by={u['unit_id']:u for u in units}
for u in units:
 assert hashlib.sha256(u['text'].encode()).hexdigest()==u['text_sha256'];assert u['source_ordinal']>=0;assert u['jurisdiction']=='ES-STATE'
 assert u['official_url'].endswith('#'+u['metadata']['source_anchor'])
 if u['course_band']=='unspecified':assert u['metadata']['course_origin']=='not_asserted'
 if u['kind']=='criterion':assert u['subject'] and u['official_code'];assert u['text'].startswith(u['official_code'])
for source in report['sources']:
 rows=[u for u in units if u['source_key']==source['source_key']];assert [u['source_ordinal']for u in rows]==list(range(len(rows)));assert len(rows)==source['paragraphs'];assert source['paragraph_reconstruction_verified']
sub=json.loads((base/'mapping/lesson-subject-map.json').read_text());cand=json.loads((base/'mapping/element-link-candidates.json').read_text());reviewed=json.loads((base/'mapping/reviewed-partial-links.json').read_text());gaps=json.loads((base/'mapping/coverage-gaps.json').read_text())
assert len(sub)==310 and len({r['lesson_id']for r in sub})==310
for r in sub:assert by[r['source_subject_unit_id']]['kind']=='subject_heading';assert by[r['source_subject_unit_id']]['subject']==r['official_subject']
assert len(cand)==1037
for r in cand:assert r['unit_id']in by;assert r['status']=='candidate_not_validated';assert r['whole_criterion_mastery_claimed']is False
assert len(reviewed)==12
for r in reviewed:assert by[r['unit_id']]['text']==r['source_text'];assert r['status']=='ai_reviewed_partial_support';assert r['whole_criterion_mastery_claimed']is False;assert r['territorial_alignment_checked']is False
assert len(gaps['subject_groups'])==70 and not gaps['unrepresented_subjects'];assert gaps['validated_element_links']==12
assert not gaps['full_subject_coverage_claimed']
chain=json.loads((base/'mapping/regulatory-version-chain.json').read_text());assert len(chain['national_authority_metadata'])==4;assert not chain['regional_full_consolidation_complete']
bach=next(r for r in chain['national_authority_metadata']if r['source_key']=='BOE-A-2022-5521');assert any(r['related_source']=='BOE-A-2026-14333'and '23.4' in r['scope_as_stated_by_BOE']for r in bach['official_followup_references'])
summary={'structural_validation_passed':True,'source_paragraphs':len(units),'criteria':counts['criterion'],'knowledge_items':counts['knowledge_item'],'official_subject_families':70,'represented_subject_families':70,'lesson_subject_links':len(sub),'unvalidated_candidate_links':len(cand),'AI_reviewed_partial_links':len(reviewed),'full_curriculum_complete':False,'regional_full_consolidation_complete':False,'human_teacher_reviewed':False}
(base/'inventory-verification.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
