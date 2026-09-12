"""Rebase the exact v2 build recipe onto the concurrently published context source.
Used only in the isolated QA build. Never replaces production or drops new main code.
"""
from pathlib import Path
from hashlib import sha256
import json
expected={
 'qa/library/build_expansion_v2.py':'0816296dbd7f3d3f9a8d41ae1dbafab5cda60a5b3a43a1de245c3d742fb2207d',
 'qa/library/prepare_remote_v2.py':'a5761606c32df6069cd6795138c6ebf36206adf5afa0482bb5fe9dcb53761d61',
 'qa/library/v2-extra-tests.mjs.txt':'093464a1e43e1cb2d3e5263d4ede8daef617f7d20fbb834f39421856f6757320'}
for path,digest in expected.items():assert sha256(Path(path).read_bytes()).hexdigest()==digest,path
p=Path('qa/library/build_expansion_v2.py');s=p.read_text()
s=s.replace('92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb','0a142b6705aa1ee4b63562cd59cfc66c8e5702768d5413e46c94106f6e1eb52c').replace('26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21','ed83c7f574db28c0e32e996579aed1ac9f03a85e91a2d59ff1cf28eb94c1b976')
s=s.replace("const VERSION='library-first-v1'","const VERSION='library-first-v1.1'")
old="return /[0-9]/.test(raw)?raw:raw.toLocaleLowerCase('es-ES')"
new=r"return /[0-9]|^(?:(?:es )?m\\/?s(?:²|2)?|cm(?:²|³)?|m(?:²|³)?|kg|g|mg|s|ms|Hz|N|J|W|Pa|V|A|C|K|mol|L|mL|Ω|°C)$/i.test(raw)?raw:raw.toLocaleLowerCase('es-ES')"
assert s.count(old)==1;s=s.replace(old,new)
s=s.replace('c0a46f5eb8fbcc014be1fb51e2ee5cc3e90fec2a5cb46a222bfc4d4bfacd0156','8849aeb754f3eaaac69a5b31f39081959ed134770066522e872766f517c98884').replace('faa289b941fb995a6cdecf924bc9c7ea32973fa9ad6c624ef386d11ca2c0f421','7eace07381ecab1025d0cb0c2af56f883539ddfcb5a90f6fb17dc90b9a225aad')
p.write_text(s)
p=Path('qa/library/prepare_remote_v2.py');s=p.read_text().replace('c0a46f5eb8fbcc014be1fb51e2ee5cc3e90fec2a5cb46a222bfc4d4bfacd0156','8849aeb754f3eaaac69a5b31f39081959ed134770066522e872766f517c98884').replace('faa289b941fb995a6cdecf924bc9c7ea32973fa9ad6c624ef386d11ca2c0f421','7eace07381ecab1025d0cb0c2af56f883539ddfcb5a90f6fb17dc90b9a225aad').replace('438466cb-f081-48f1-a4cc-7986deb58f8a','5da15a04-5396-4841-8b21-a94c0c6647c3').replace('regressions_passed:474','regressions_passed:485')
needle="Path('qa/library/remote_v2.generated.mjs').write_text(s)"
assert needle in s;s=s.replace(needle,"s=s.replace(\"const report={phase:\",\"const report={baseline_source_commit:'e40e3bbbd7d6ae464a9e17659cd8ae3d36245852',phase:\")\n"+needle);p.write_text(s)
p=Path('qa/library/v2-extra-tests.mjs.txt');p.write_text(p.read_text()+'''
test('v2 standalone unit answers are case-sensitive too',()=>{
 const h=harness(),l=h.lessons.find(x=>x.id==='e-acceleration'),q=l.quiz[1],ped={current_mode:'practice',active_concept:l.title,pending_question:h.library.question(q),next_teaching_goal:`lib:v1:${l.id}:1:0:practice`};
 assert.equal(h.library.decision({text:'m/S²',profile:profile(l),pedState:ped,mode:'practice'}),null);
 assert.equal(h.library.decision({text:'m/s²',profile:profile(l),pedState:ped,mode:'practice'})?.assessment,'correct');
});
''')
print('Exact context revision e40e3bb preserved; v2 remains gated by private verification and unchanged live version.')
