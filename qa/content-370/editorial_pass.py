from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
changes=[
 ('bachillerato.txt','Con esos mismos datos, P(A|rojo) es…','Se elige A o B con probabilidad 1/2; P(rojo|A)=3/4 y P(rojo|B)=1/4. P(A|rojo) es…','Supply all probabilities in the question itself.'),
 ('bachillerato.txt','En ese equilibrio ideal, disminuir volumen a temperatura constante favorece…','En N₂(g) + 3H₂(g) ⇌ 2NH₃(g), bajo modelo ideal, disminuir volumen a temperatura constante favorece…','Include the complete gas equilibrium rather than an unseen example.'),
 ('eso.txt','Si DE es paralelo a BC, AD=3, AB=6 y AC=10, ¿cuánto vale AE?','En ABC, D está en AB y E en AC; DE es paralelo a BC. Si AD=3, AB=6 y AC=10, ¿cuánto vale AE?','Specify segment locations and the full geometric premises.'),
 ('eso.txt','100 N sobre 0,5 m² producen una presión media de…','Una fuerza normal de 100 N sobre 0,5 m² produce una presión media de…','State the normal-force assumption in the assessment, not only the explanation.')]
for name,old,new,reason in changes:
 p=ROOT/'qa/content-370'/name;s=p.read_text();assert (s.count(old)==1)or(new in s),(name,old)
 if old in s:s=s.replace(old,new)
 p.write_text(s)
(ROOT/'qa/content-370/draft-review-corrections.json').write_text(json.dumps([{'file':n,'before':a,'after':b,'reason':r,'reviewer_kind':'AI editorial review','human_teacher_reviewed':False}for n,a,b,r in changes],ensure_ascii=False,indent=2)+'\n')
