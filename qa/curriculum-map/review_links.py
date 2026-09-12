"""Specific single-AI editorial judgments. Never promote lexical candidates to approved coverage."""
from pathlib import Path
import json,hashlib,argparse
from lxml import etree
RELEASE='eterna-library-2026.09-v6-310-traceable-12c672'
SNAPSHOT='eterna-curriculum-map-2026.09.12-v1'
def canonical(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'),sort_keys=True)
def sha(v):return hashlib.sha256(v if isinstance(v,bytes)else v.encode()).hexdigest()
PAIRS={
'e-app-permissions':[
('BOE-A-2022-4975:II:00239:00171176b036','Comprobar finalidad, datos y alcance de los permisos prepara decisiones preventivas de privacidad. No evalúa la configuración efectiva de una cuenta real.'),
('BOE-A-2022-4975:II:00218:bf4659bb6f54','Apoya la comprensión necesaria para proteger datos mediante configuración. Las preguntas conceptuales no demuestran que el alumno configure correctamente servicios reales.')],
'b-ecosystem-matter':[
('BOE-A-2022-5521:II:00416:c9c0282b83a3','Explica la diferencia entre circulación de materia y transferencia de energía y el papel de descomponedores; no trata todos los ciclos biogeoquímicos ni resuelve toda la diversidad de problemas del saber.'),
('BOE-A-2022-5521:II:00380:7e4fe73eedac','Da vocabulario y un modelo verbal para analizar procesos ecológicos; no evalúa interpretación independiente de todos los formatos científicos del criterio.')],
'b-compound-meter':[
('BOE-A-2022-5521:II:03379:59b2baac5807','Aborda compases simples y compuestos y niveles de pulso/subdivisión; no desarrolla compases irregulares, polirritmias o equivalencias de todo el saber.'),
('BOE-A-2022-5521:II:03362:40a3016c3cf3','Apoya la descripción rítmica con terminología precisa; no demuestra análisis autónomo de una partitura completa ni habilidades de interpretación musical.')],
'b-stage-directions':[
('BOE-A-2022-5521:II:03448:1bb7b1d5f198','Distingue diálogo y acotaciones con un fragmento original autocontenido. No cubre todos los componentes del libreto enumerados.'),
('BOE-A-2022-5521:II:03440:f4f7bbfc9cd2','Apoya reconocer convenciones previas a crear un texto teatral. Las tres preguntas no equivalen a producir ni evaluar una obra dramática con intención literaria.')],
'b-affine-cost':[
('BOE-A-2022-5521:II:03904:3842ac1c00e0','Relaciona un contexto ficticio de costes con una función afín, sus coeficientes y dominio; no cubre todos los modelos de funciones de ciencias sociales.'),
('BOE-A-2022-5521:II:03857:659fe6d9a20c','Apoya resolver un problema elemental y comprobar supuestos. No acredita seleccionar y comparar de forma autónoma todas las estrategias del criterio.')],
'b-art-project':[
('BOE-A-2022-5521:II:04303:7a0405df7473','Explica fases, planificación, documentación y revisión de un proyecto; no demuestra su realización material ni todas las metodologías.'),
('BOE-A-2022-5521:II:04281:f5438b64a752','Apoya comprender un plan con fases, recursos y plazos. No certifica que el estudiante cree un plan viable, presupuesto o producto artístico real.')]
}
def main(lessons_path,units_path,source_dir,out):
 ls=json.loads(lessons_path.read_text());lb={l['id']:l for l in ls};units=[json.loads(x)for x in units_path.read_text().splitlines()];ub={u['unit_id']:u for u in units};rows=[]
 for id,pairs in PAIRS.items():
  l=lb[id]
  for uid,rationale in pairs:
   u=ub[uid];assert u['subject']==l['subject']and u['stage']==l['stage'];assert u['kind']in ('criterion','knowledge_item')
   rows.append({'snapshot_id':SNAPSHOT,'library_release_id':RELEASE,'lesson_id':id,'unit_id':uid,'status':'ai_reviewed_partial_support','link_kind':'conceptual_support_only','scope_rationale':rationale,'lesson_sha256':sha(canonical(l)),'unit_text_sha256':u['text_sha256'],'unit_kind':u['kind'],'official_code':u['official_code'],'official_subject':u['subject'],'course_band':u['course_band'],'source_text':u['text'],'official_url':u['official_url'],'territorial_alignment_checked':False,'whole_criterion_mastery_claimed':False,'human_teacher_reviewed':False,'review_method':'single_AI_multidisciplinary_simulation_exact_source_and_lesson_comparison','course_assignment_is_editorial':u['course_band']=='unspecified'})
 out.mkdir(parents=True,exist_ok=True);(out/'reviewed-partial-links.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 versions=[]
 for f in sorted((source_dir/'national').glob('*-metadatos.xml')):
  x=etree.fromstring(f.read_bytes());code=f.name.replace('-metadatos.xml','');analysis=etree.fromstring((source_dir/'national'/(code+'-analisis.xml')).read_bytes());get=lambda name:x.findtext('.//'+name)
  relations=[{'related_source':r.findtext('id_norma'),'relation':r.findtext('relacion'),'scope_as_stated_by_BOE':r.findtext('texto'),'related_source_url':'https://www.boe.es/buscar/doc.php?id='+r.findtext('id_norma')}for r in analysis.findall('.//posterior')]
  versions.append({'source_key':code,'title':get('titulo'),'authority_update_timestamp':get('fecha_actualizacion'),'publication_date':get('fecha_publicacion'),'entry_into_force':get('fecha_vigencia'),'authority_repeal_flag':get('estatus_derogacion'),'authority_consolidation_status':get('estado_consolidacion'),'official_followup_references':relations,'metadata_sha256':sha(f.read_bytes()),'meaning':'Authority metadata copied from BOE; not a human legal opinion or proof that every regional amendment has been reviewed.'})
 selected=[
 {'id':'ES-STATE-RD535-2026','source_key':'BOE-A-2026-14333','official_url':'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-14333','target':'Real Decreto 243/2022','affected_provisions':['artículo 23.4'],'effect':'Cálculo de la calificación final de Bachiller en supuestos de homologación o equivalencia académica. Esta modificación no sustituye el anexo II de saberes y criterios.','review_scope':'Specific modification identified in current BOE analysis and original promulgated text; not a complete cross-territorial legal opinion.'},
 {'id':'ES-MD-D59-2024','official_url':'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/06/13/BOCM-20240613-2.PDF','source_file':'madrid-modificacion-59-2024.pdf','target':'Decretos 61/2022, 65/2022 y 64/2022','affected_provisions':['Primaria: artículo 9','ESO: artículo 16.4, disposición adicional segunda y contenidos de Geografía e Historia del anexo II','Bachillerato: artículo 19.4 y disposición adicional segunda.1'],'effect':'Cambios en lengua de impartición, combinación de optativas y contenidos cívicos específicos de ESO. No equivale a sustituir íntegramente los saberes de Bachillerato.','review_scope':'Operative modifications read from the authentic five-page PDF; whole-chain consolidation is not claimed.'},
 {'id':'ES-MD-O114-2025','official_url':'https://bocm.es/boletin/CM_Orden_BOCM/2025/01/31/BOCM-20250131-18.PDF','source_file':'madrid-optativas-114-2025.pdf','target':'Orden 1736/2023','affected_provisions':['catálogos de optativas ESO y Bachillerato y currículos añadidos'],'effect':'Incorpora Refuerzo de Lengua Extranjera, Comunicación oral en lengua extranjera e Hitos y héroes de la cultura en inglés en ESO; Anatomía y Fisiología Humanas, Actividades Físico-deportivas y Comunicación oral en lengua extranjera en Bachillerato. Su oferta no es obligatoria para todos los centros o alumnos.','review_scope':'Purpose and operative catalogue change checked; all detailed annex criteria and staffing tables are not yet semantically mapped.'}
 ]
 for r in selected:
  r.update({'status':'specific_effect_checked_by_AI','human_legal_reviewed':False,'whole_chain_consolidated':False})
  if r.get('source_file'):r['original_pdf_sha256']=sha((source_dir/'sources'/r['source_file']).read_bytes())
 (out/'regulatory-version-chain.json').write_text(json.dumps({'snapshot_id':SNAPSHOT,'national_authority_metadata':versions,'selected_amendment_findings':selected,'regional_full_consolidation_complete':False,'unverified_sources_enabled_in_tutor':False},ensure_ascii=False,indent=2))
 gap=json.loads((out/'coverage-gaps.json').read_text());gap['validated_element_links']=len(rows);gap['validation_type']='AI-reviewed partial conceptual support, not mastery';gap['criteria_with_reviewed_partial_link']=sum(r['unit_kind']=='criterion'for r in rows);gap['knowledge_items_with_reviewed_partial_link']=sum(r['unit_kind']=='knowledge_item'for r in rows);(out/'coverage-gaps.json').write_text(json.dumps(gap,ensure_ascii=False,indent=2))
 print(json.dumps({'reviewed_partial_links':len(rows),'national_versions':len(versions),'selected_amendment_findings':len(selected),'full_coverage':False}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--lessons',type=Path,required=True);p.add_argument('--units',type=Path,required=True);p.add_argument('--sources',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();main(a.lessons,a.units,a.sources,a.output)
