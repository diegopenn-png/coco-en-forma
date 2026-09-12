"""Merge tested PWA integration changes with exact immutable published source.
Retains published language policy and punctuation-safe mathematical grading.
No frontend, microphone, content, secrets, database or provider modification.
"""
from pathlib import Path
from hashlib import sha256
root=Path('.');draft=Path('.context-candidate')
h=lambda p:sha256(p.read_bytes()).hexdigest()
paths=['eterna-worker/src/index.js','eterna-worker/src/library/runtime-v1.js','eterna-worker/test/library-first.test.mjs']
expected_before=['92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb','26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21','3ee5bc6227e8260725106c026d7f60ae4775a27729be6530bbc340bd1d60a02e']
expected_draft=['f19f07b712288fc331cefe32cab54adafd3e9b12b5cd948030d7474c6b0c4f93','761cef30b0a271a18490de31999194c86f6a384488054efd70c530233198caf2','30dab624892da60bd0511c179ec7f2a5ca8c0f710377ca1f454bf0f8acbc4009']
for path,before,want in zip(paths,expected_before,expected_draft):
 assert h(root/path)==before,('Published source changed; stop',path)
 assert h(draft/path)==want,('Tested source changed; stop',path)
p=root/paths[1];current=p.read_text();new=(draft/paths[1]).read_text()
for start,end in [('  function appropriate(','  const PROTOCOLS'),('  function choice(','  function decision(')]:
 original=current[current.index(start):current.index(end)]
 new=new[:new.index(start)]+original+new[new.index(end):]
p.write_text(new)
(root/paths[0]).write_bytes((draft/paths[0]).read_bytes())
p=root/paths[2];data=(draft/paths[2]).read_text();p.write_text(p.read_text()+'\n'+data[data.index('// Exercise the exact deployed client resolver'):])
expected_after=['f19f07b712288fc331cefe32cab54adafd3e9b12b5cd948030d7474c6b0c4f93','ed83c7f574db28c0e32e996579aed1ac9f03a85e91a2d59ff1cf28eb94c1b976','001721fd3b2f3ff5e0a3e3408cda401777b3fafdf52742362feb61fbc81f1578']
for path,want in zip(paths,expected_after):assert h(root/path)==want,path
print('Reconciled exact PWA fixes; all existing published safeguards preserved.')
