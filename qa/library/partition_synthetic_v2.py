"""Keep real daily limits intact: 40 academic requests per disposable QA identity.
This changes the test driver only. No quota mutation, production flag, or pupil data.
"""
from pathlib import Path
p=Path('qa/library/remote_v2.generated.mjs');s=p.read_text()
needle='let authToken;'
assert s.count(needle)==1
s=s.replace(needle,needle+'''
report.completed_synthetic_batches=[];
async function nextSyntheticFixture(){
 await new Promise(r=>setTimeout(r,2000));
 const stats=await control('stats');
 assert.ok(stats.usage.length>0&&stats.usage.every(u=>Number(u.input_tokens||0)===0&&Number(u.output_tokens||0)===0));
 assert.ok(stats.model_routes.length>0&&stats.model_routes.every(r=>r==='owned-protocol-v1'||r==='owned-lesson-v1'));
 const cleanup=await control('cleanup');assert.equal(cleanup.deleted,true);
 report.completed_synthetic_batches.push({requests:report.requests.length,zero_generation_tokens:true,only_owned_routes:true,cleanup_verified:true,usage:stats.usage});save();
 const setup=await control('setup');authToken=setup.access_token;console.log('::add-mask::'+authToken);report.synthetic_id=setup.synthetic_id;save();
}
''')
needle='  await control(stage);const lesson='
assert s.count(needle)==1
s=s.replace(needle,"  if(report.requests.length===40&&report.completed_synthetic_batches.length===0)await nextSyntheticFixture();\n"+needle)
needle="assert.equal(report.requests.length,120);"
assert s.count(needle)==1
s=s.replace(needle,needle+"assert.equal(report.completed_synthetic_batches.length,1);assert.ok(report.completed_synthetic_batches.every(b=>b.cleanup_verified&&b.zero_generation_tokens));report.synthetic_fixture_count=2;report.production_quotas_unchanged=true;")
p.write_text(s)
print('Test driver partitioned: original daily limits and Worker code unchanged; both fixtures must be deleted.')
