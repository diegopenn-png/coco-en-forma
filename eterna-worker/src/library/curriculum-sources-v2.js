globalThis.ETERNA_CURRICULUM_SOURCES_V2 = Object.freeze({
  version: '2026.09.12-v2',
  reviewed_at: '2026-09-12',
  human_teacher_reviewed: false,
  scope_note: 'Official-source traceability layer. This is not a claim that every autonomous-community criterion is exhaustively encoded.',
  national: {
    infantil: ['https://www.boe.es/buscar/act.php?id=BOE-A-2022-1654'],
    primaria: ['https://www.boe.es/buscar/act.php?id=BOE-A-2022-3296'],
    eso: ['https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975'],
    bachillerato: ['https://www.boe.es/buscar/act.php?id=BOE-A-2022-5521']
  },
  autonomous_communities: {
    'Andalucía': {
      authority: 'Junta de Andalucía / BOJA',
      status: 'territorial_reference_layer',
      note: 'Verified territorial framework for the four ETERNA stages. Subject/course criterion-level mapping remains explicit and must not be inferred merely from these stage sources.',
      official_portals: ['https://www.juntadeandalucia.es/eboja.html','https://www.juntadeandalucia.es/educacion/portals/web/ordenacion-y-evaluacion-educativa'],
      stages: {
        infantil: {
          decree: {label:'Decreto 100/2023, de 9 de mayo',url:'https://www.juntadeandalucia.es/boja/2023/90/1'},
          development_order: {label:'Orden de 30 de mayo de 2023 — Educación Infantil',url:'https://www.juntadeandalucia.es/boja/2023/104/38'}
        },
        primaria: {
          decree: {label:'Decreto 101/2023, de 9 de mayo',url:'https://www.juntadeandalucia.es/boja/2023/90/2'},
          development_order: {label:'Orden de 30 de mayo de 2023 — Educación Primaria',url:'https://www.juntadeandalucia.es/boja/2023/104/39'}
        },
        eso: {
          decree: {label:'Decreto 102/2023, de 9 de mayo',url:'https://www.juntadeandalucia.es/boja/2023/90/3'},
          development_order: {label:'Orden de 30 de mayo de 2023 — Educación Secundaria Obligatoria',url:'https://www.juntadeandalucia.es/boja/2023/104/36'}
        },
        bachillerato: {
          decree: {label:'Decreto 103/2023, de 9 de mayo',url:'https://www.juntadeandalucia.es/boja/2023/90/4'},
          development_order: {label:'Orden de 30 de mayo de 2023 — Bachillerato',url:'https://www.juntadeandalucia.es/boja/2023/104/37'},
          corrections: [{label:'Corrección de errores del Decreto 103/2023',url:'https://www.juntadeandalucia.es/boja/2023/112/2'}]
        }
      }
    },
    'Aragón': {authority:'Gobierno de Aragón',status:'territorial_reference_layer',official_portals:['https://educa.aragon.es/']},
    'Asturias': {authority:'Principado de Asturias',status:'territorial_reference_layer',official_portals:['https://www.educastur.es/']},
    'Illes Balears': {authority:'Govern de les Illes Balears',status:'territorial_reference_layer',official_portals:['https://www.caib.es/sites/educacio/']},
    'Canarias': {authority:'Gobierno de Canarias',status:'territorial_reference_layer',official_portals:['https://www.gobiernodecanarias.org/educacion/web/']},
    'Cantabria': {authority:'Gobierno de Cantabria',status:'territorial_reference_layer',official_portals:['https://www.educantabria.es/']},
    'Castilla-La Mancha': {authority:'Junta de Comunidades de Castilla-La Mancha',status:'territorial_reference_layer',official_portals:['https://educacion.castillalamancha.es/']},
    'Castilla y León': {authority:'Junta de Castilla y León',status:'territorial_reference_layer',official_portals:['https://www.educa.jcyl.es/']},
    'Cataluña': {authority:'Generalitat de Catalunya',status:'territorial_reference_layer',official_portals:['https://educacio.gencat.cat/']},
    'Comunitat Valenciana': {authority:'Generalitat Valenciana',status:'territorial_reference_layer',official_portals:['https://ceice.gva.es/']},
    'Extremadura': {authority:'Junta de Extremadura',status:'territorial_reference_layer',official_portals:['https://educarex.es/']},
    'Galicia': {authority:'Xunta de Galicia',status:'territorial_reference_layer',official_portals:['https://www.edu.xunta.gal/portal/']},
    'La Rioja': {authority:'Gobierno de La Rioja',status:'territorial_reference_layer',official_portals:['https://www.larioja.org/edu-orden-academica/es']},
    'Madrid': {authority:'Comunidad de Madrid',status:'territorial_reference_layer',official_portals:['https://www.comunidad.madrid/servicios/educacion']},
    'Murcia': {authority:'Región de Murcia',status:'territorial_reference_layer',official_portals:['https://www.educarm.es/']},
    'Navarra': {authority:'Gobierno de Navarra',status:'territorial_reference_layer',official_portals:['https://www.educacion.navarra.es/']},
    'País Vasco': {authority:'Eusko Jaurlaritza / Gobierno Vasco',status:'territorial_reference_layer',official_portals:['https://www.euskadi.eus/gobierno-vasco/educacion/']},
    'Ceuta': {authority:'Ministerio de Educación, Formación Profesional y Deportes',status:'territorial_reference_layer',official_portals:['https://www.educacionfpydeportes.gob.es/']},
    'Melilla': {authority:'Ministerio de Educación, Formación Profesional y Deportes',status:'territorial_reference_layer',official_portals:['https://www.educacionfpydeportes.gob.es/']}
  }
});
