import fs from 'node:fs';

const path='eterna-worker/src/index.js';
let source=fs.readFileSync(path,'utf8');

const oldVersion='const VERSION="160.99.16-current-turn-subject-vision";';
const newVersion='const VERSION="160.99.17-generic-photo-general-vision";';
if(!source.includes(oldVersion)&&!source.includes(newVersion)) throw new Error('unexpected worker version');
source=source.replace(oldVersion,newVersion);

const oldRoute='function preferGeneralWorksheetVision(text,intake){const subject=currentTurnSubjectHint(text)||intake?.subject||null,canonical=canonicalAcademicSubject(subject);return Boolean(canonical&&canonical!=="math")}';
const newRoute='function preferGeneralWorksheetVision(text,intake){const subject=currentTurnSubjectHint(text)||intake?.subject||null,canonical=canonicalAcademicSubject(subject);return canonical!=="math"}';
if(!source.includes(oldRoute)&&!source.includes(newRoute)) throw new Error('generic photo routing anchor missing');
source=source.replace(oldRoute,newRoute);

const oldFeature='regional_worksheet_vision_v1:true,grounded_arithmetic_ocr_v1:true';
const newFeature='regional_worksheet_vision_v1:true,generic_photo_general_vision_v1:true,grounded_arithmetic_ocr_v1:true';
if(!source.includes(oldFeature)&&!source.includes(newFeature)) throw new Error('vision feature anchor missing');
source=source.replace(oldFeature,newFeature);

fs.writeFileSync(path,source);
