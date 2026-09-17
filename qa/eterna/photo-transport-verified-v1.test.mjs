import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const worker=readFileSync("eterna-worker/src/index.js","utf8");
const client=readFileSync("eterna-v159.js","utf8");
const fixture=readFileSync("eterna-worker/src/photo-dependency-fixture.js","utf8");

test("the client requires an acknowledged photo transport",()=>{
  assert.match(client,/data\.photo_receipt\.accepted!==true/);
  assert.match(client,/ETERNA_PHOTO_TRANSPORT_FAILED/);
  assert.match(worker,/photo_receipt:meta\.photoReceipt/);
  assert.match(worker,/X-Eterna-Photo-Received/);
  assert.match(worker,/X-Eterna-Photo-Bytes/);
});

test("the protected dependency probe requires visible grounded fractions",()=>{
  assert.match(worker,/checked\.data\?\.visible===true/);
  assert.match(worker,/DEPENDENCY_FRACTION_PROBE_IMAGE_DATA_URL/);
  assert.match(worker,/items\.length>=3/);
  assert.match(worker,/grounded_values/);
  for(const value of ["7/5","2/3","8/7","9/11","11/4","1/9"])assert.match(worker,new RegExp(value.replace("/","\\/")));
  assert.match(fixture,/Synthetic worksheet used only by the protected deployment dependency probe/);
  assert.doesNotMatch(fixture,/IMG_\d|libfile_|diegopenn/i);
});

test("the general vision chain includes a documented compatibility reader",()=>{
  assert.match(worker,/@cf\/meta\/llama-4-scout-17b-16e-instruct/);
  assert.match(worker,/@cf\/meta\/llama-3\.2-11b-vision-instruct/);
  assert.match(worker,/@cf\/moondream\/moondream3\.1-9B-A2B/);
  assert.match(worker,/fraction_photo_grounding_v1:true/);
  assert.match(worker,/photo_transport_verified_v1:true/);
});
