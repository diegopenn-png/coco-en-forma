"""Version only the verified 160-lesson snapshot. Never rewrite the growing shared v2 draft."""
from pathlib import Path
from hashlib import sha256
import sys
OLD='eterna-library-2026.09-v2';NEW='eterna-library-2026.09-v2-160-3069e276'
BEFORE={'eterna-worker/src/index.js':'8849aeb754f3eaaac69a5b31f39081959ed134770066522e872766f517c98884','eterna-worker/src/library/runtime-v1.js':'7eace07381ecab1025d0cb0c2af56f883539ddfcb5a90f6fb17dc90b9a225aad','eterna-worker/src/library/content-v1.js':'44dd8a3f068de9f6f9b06cef1b6fa19e025ec0c94714ccef498b582ac8fa6143','eterna-worker/test/library-first.test.mjs':'494422d9749532d1190ec54999981b47fccb083ef08a6e40d0d3a9586e9a3c71'}
AFTER={'eterna-worker/src/index.js':'fea7fcf5085200f8472eb83a340b774f8e0ba017160a6bf9d0f57e3ad0698ae4','eterna-worker/src/library/runtime-v1.js':'b2b4152e3dc66fee81a71b1abf04e7c34022532ca06b8ca5c6eef9707def93bc','eterna-worker/src/library/content-v1.js':'676e4e834916186d9254e2bcceb44d4578d2e33768ccc8decb7c85e00f2d307f','eterna-worker/test/library-first.test.mjs':'6e8daf1897ea82e6954a37aee47430cd76b9c56ab5bfcee639c355bcbd131525'}
if sys.argv[1]=='source':
 for path,digest in BEFORE.items():
  p=Path(path);assert sha256(p.read_bytes()).hexdigest()==digest,path
  p.write_text(p.read_text().replace(OLD,NEW));assert sha256(p.read_bytes()).hexdigest()==AFTER[path],path
 print('Only release namespace changed; all lesson payloads, preserved context, voice and frontend unchanged.')
elif sys.argv[1]=='driver':
 p=Path('qa/library/remote_v2.generated.mjs');s=p.read_text().replace(OLD,NEW)
 for path in ['eterna-worker/src/index.js','eterna-worker/src/library/runtime-v1.js']:s=s.replace(BEFORE[path],AFTER[path])
 needle="const officialDocs=JSON.parse(readFileSync('library-v2-source-evidence/documents.json')),officialChunks=JSON.parse(readFileSync('library-v2-source-evidence/chunks.json'));"
 assert s.count(needle)==1
 s=s.replace(needle,"const officialDocs=[],officialChunks=[]; // Existing official archives remain in their source releases; do not duplicate or promote them.")
 needle="report.synthetic_fixture_count=2;report.production_quotas_unchanged=true;"
 assert needle in s
 s=s.replace(needle,needle+"report.shared_v2_draft_untouched=true;report.source_archive_releases=['eterna-library-2026.09-v1','eterna-library-2026.09-v2'];")
 p.write_text(s);print('QA and staging scoped to isolated snapshot; existing shared v2 rows cannot be changed.')
else:raise SystemExit('Expected source or driver')
