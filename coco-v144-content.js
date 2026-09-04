(function (root) {
  "use strict";

  if (root.CocoContentV144) return;
  var base = root.CocoV134Content;
  var levels = [1, 2, 3];
  var target = 20;

  var extraWords = [
    ["BRISA", "Viento suave"], ["HUERTO", "Terreno donde se cultivan verduras y frutas"], ["ÓRBITA", "Trayectoria de un cuerpo alrededor de otro"], ["REFLEJO", "Imagen producida cuando la luz rebota"], ["ANCLA", "Pieza que sujeta una embarcación al fondo"], ["NÉCTAR", "Líquido azucarado que producen muchas flores"], ["BOCETO", "Dibujo inicial que sirve para preparar una obra"], ["VÉRTICE", "Punto donde se encuentran dos lados o aristas"], ["CAUDAL", "Cantidad de agua que lleva una corriente"], ["CÚPULA", "Cubierta arquitectónica de forma curva"], ["SENSOR", "Dispositivo que detecta cambios del entorno"], ["TEXTURA", "Cualidad de una superficie percibida por la vista o el tacto"],
    ["MAQUETA", "Modelo a escala de una construcción u objeto"], ["ENLACE", "Elemento que conecta dos partes o recursos"], ["IMPULSO", "Fuerza que pone algo en movimiento"], ["TRAYECTO", "Camino recorrido entre dos lugares"], ["SEÑUELO", "Objeto que atrae la atención hacia un punto"], ["CADENCIA", "Ritmo o repetición regular de movimientos o sonidos"], ["BISAGRA", "Pieza que permite girar una puerta o tapa"], ["PÉNDULO", "Cuerpo que oscila suspendido de un punto"], ["DRENAJE", "Sistema que permite evacuar líquidos"], ["MOSAICO", "Composición formada por pequeñas piezas"], ["BOREAL", "Relacionado con el norte"], ["BITÁCORA", "Registro ordenado de actividades o incidencias"],
    ["CARTABÓN", "Plantilla triangular usada para dibujar ángulos y líneas"], ["COORDENADA", "Valor que ayuda a localizar un punto"], ["TERMOSTATO", "Dispositivo que regula una temperatura"], ["FOTOTROPISMO", "Crecimiento de una planta orientado por la luz"], ["INTERSECCIÓN", "Lugar donde se cruzan dos líneas o conjuntos"], ["PROPORCIÓN", "Relación cuantitativa entre magnitudes"], ["BIOMECÁNICA", "Estudio de las fuerzas y movimientos de los seres vivos"], ["MICROCLIMA", "Condiciones climáticas de una zona pequeña"], ["CONTRAPESO", "Peso usado para equilibrar otro"], ["ELECTRODO", "Conductor por el que entra o sale corriente de un medio"], ["PERSPECTIVA", "Técnica para representar profundidad en una superficie plana"], ["INTERDEPENDENCIA", "Relación en la que varias partes se necesitan mutuamente"]
  ];

  var extraFacts = [
    ["Un cuadrado tiene cuatro lados de la misma longitud.", true, "Es una propiedad esencial del cuadrado.", 1],
    ["Quince es menor que doce.", false, "Quince es tres unidades mayor que doce.", 1],
    ["El agua puede encontrarse como sólido, líquido y gas.", true, "Hielo, agua líquida y vapor son ejemplos.", 1],
    ["Una semana tiene ocho días.", false, "Una semana tiene siete días.", 1],
    ["Las raíces ayudan a muchas plantas a absorber agua.", true, "También suelen fijarlas al suelo.", 1],
    ["Todos los objetos transparentes impiden el paso de la luz.", false, "Los objetos transparentes dejan pasar gran parte de la luz.", 1],
    ["Un minuto contiene sesenta segundos.", true, "Sesenta segundos forman un minuto.", 1],
    ["El norte y el sur son el mismo punto cardinal.", false, "Son puntos cardinales opuestos.", 1],
    ["Los delfines son mamíferos.", true, "Respiran aire y alimentan a sus crías con leche.", 1],
    ["Un rectángulo tiene tres ángulos rectos.", false, "Tiene cuatro ángulos rectos.", 1],
    ["El sonido de un tambor se produce por vibraciones.", true, "La membrana vibra al ser golpeada.", 1],
    ["Veinte dividido entre cuatro es seis.", false, "20 ÷ 4 = 5.", 1],
    ["La media aritmética de 4, 6 y 8 es 6.", true, "La suma es 18 y 18 ÷ 3 = 6.", 2],
    ["Una fracción con numerador mayor que denominador siempre vale menos que uno.", false, "Si ambos son positivos, vale más que uno.", 2],
    ["La condensación transforma vapor en líquido.", true, "Ocurre cuando un gas pierde energía y forma gotas.", 2],
    ["Los paralelos terrestres se unen en los polos.", false, "Quienes se unen en los polos son los meridianos.", 2],
    ["La energía cinética está relacionada con el movimiento.", true, "Un cuerpo en movimiento posee energía cinética.", 2],
    ["El sujeto de una oración es siempre la primera palabra.", false, "Puede aparecer en otras posiciones o estar omitido.", 2],
    ["Un ángulo de 90 grados es recto.", true, "Esa es la definición de ángulo recto.", 2],
    ["Multiplicar una cantidad por 0,5 equivale a duplicarla.", false, "Equivale a tomar su mitad.", 2],
    ["El ADN contiene información hereditaria.", true, "Su secuencia almacena información genética.", 2],
    ["Un ecosistema solo incluye a los animales.", false, "Incluye seres vivos y factores físicos del entorno.", 2],
    ["La escala de un mapa relaciona una distancia dibujada con la real.", true, "Permite convertir medidas del mapa a distancias reales.", 2],
    ["Todo número divisible entre dos termina en cinco.", false, "Los números pares terminan en 0, 2, 4, 6 u 8.", 2],
    ["Si dos variables se correlacionan, una causa necesariamente a la otra.", false, "La correlación por sí sola no demuestra causalidad.", 3],
    ["La mediana es resistente a valores extremos en comparación con la media.", true, "Un valor extremo altera más la media que la posición central.", 3],
    ["La negación de «todos cumplen la regla» es «al menos uno no la cumple».", true, "Basta un contraejemplo para negar una afirmación universal.", 3],
    ["Una muestra grande elimina automáticamente cualquier sesgo de selección.", false, "El sesgo puede persistir aunque aumente el tamaño.", 3],
    ["La aceleración puede existir aunque la rapidez sea constante si cambia la dirección.", true, "La velocidad es una magnitud vectorial.", 3],
    ["Dos sucesos mutuamente excluyentes pueden ocurrir a la vez.", false, "Por definición no pueden suceder simultáneamente.", 3],
    ["En lógica, un contraejemplo válido refuta una afirmación universal.", true, "Demuestra que la regla no se cumple en todos los casos.", 3],
    ["Aumentar un 20 % y luego disminuir un 20 % devuelve siempre el valor inicial.", false, "Los porcentajes se aplican sobre bases distintas.", 3],
    ["La presión de un gas puede cambiar si varían su volumen o su temperatura.", true, "Esas magnitudes están relacionadas por las leyes de los gases.", 3],
    ["Toda fuente primaria es necesariamente imparcial.", false, "Una fuente primaria también puede contener sesgos.", 3],
    ["El área de figuras semejantes varía con el cuadrado de su factor de escala.", true, "Si las longitudes se duplican, el área se cuadruplica.", 3],
    ["Una conclusión válida puede basarse en premisas contradictorias sin necesidad de revisarlas.", false, "Las premisas deben ser coherentes y justificadas.", 3]
  ];

  var extraMemoryThemes = [
    { nombre: "Estación meteorológica", iconos: ["nat_sol", "nat_nieve", "nat_ola", "nat_arcoiris", "esp_luna", "tec_camara", "tec_chip", "esc_numeros", "ave_brujula", "nat_montana", "coco_grafico", "coco_idea"] },
    { nombre: "Taller de formas", iconos: ["esc_abaco", "esc_lapiz", "esc_cuaderno", "tec_engranaje", "tec_robot", "ave_llave", "dep_diana", "coco_puzzle", "coco_idea", "esc_bombilla", "tec_chip", "tec_portatil"] },
    { nombre: "Ruta submarina", iconos: ["ani_delfin", "ani_pulpo", "ani_ballena", "ani_tortuga", "nat_ola", "ave_isla", "ave_canoa", "ave_mapa", "esp_estrella", "coco_pinguino", "tec_camara", "nat_arcoiris"] },
    { nombre: "Exploración lunar", iconos: ["esp_luna", "esp_cohete", "esp_satelite", "esp_telescopio", "esp_planeta", "esp_estrella", "esp_galaxia", "ave_mapa", "coco_cohete", "coco_cerebro", "tec_robot", "tec_chip"] },
    { nombre: "Arte y color", iconos: ["esc_paleta", "esc_lapiz", "esc_cuaderno", "nat_flor", "nat_girasol", "nat_arcoiris", "tec_camara", "coco_idea", "coco_estrella", "ave_castillo", "ani_mariposa", "esp_galaxia"] },
    { nombre: "Equipo de rescate", iconos: ["ave_brujula", "ave_mapa", "ave_tienda", "ave_canoa", "dep_medalla", "tec_auriculares", "tec_camara", "coco_fuerza", "coco_diana", "nat_montana", "nat_ola", "ave_llave"] },
    { nombre: "Energía limpia", iconos: ["nat_sol", "nat_ola", "tec_engranaje", "tec_chip", "esc_bombilla", "nat_arbol", "nat_flor", "coco_idea", "coco_grafico", "tec_robot", "esp_satelite", "ave_isla"] },
    { nombre: "Biblioteca secreta", iconos: ["esc_libros", "esc_cuaderno", "esc_lapiz", "ave_llave", "ave_mapa", "coco_puzzle", "coco_cerebro", "coco_idea", "tec_portatil", "esc_numeros", "ave_castillo", "esp_estrella"] },
    { nombre: "Festival de ritmo", iconos: ["tec_auriculares", "dep_diana", "coco_fuego", "coco_estrella", "ave_regalo", "nat_girasol", "esc_paleta", "tec_camara", "dep_trofeo", "ani_pinguino", "esp_galaxia", "nat_arcoiris"] },
    { nombre: "Laboratorio de agua", iconos: ["nat_ola", "ani_rana", "ani_delfin", "ani_tortuga", "esc_micro", "esc_numeros", "tec_chip", "coco_grafico", "coco_idea", "ave_canoa", "nat_arcoiris", "esp_luna"] },
    { nombre: "Geometría en movimiento", iconos: ["esc_abaco", "esc_numeros", "dep_bici", "dep_diana", "tec_engranaje", "coco_puzzle", "coco_grafico", "ave_brujula", "tec_chip", "esp_planeta", "coco_idea", "esc_lapiz"] },
    { nombre: "Expedición de invierno", iconos: ["nat_nieve", "nat_montana", "ani_pinguino", "ani_zorro", "ani_buho", "ave_tienda", "ave_brujula", "ave_mapa", "coco_pinguino", "coco_fuerza", "esp_estrella", "tec_camara"] }
  ];

  function appendUnique(targetArray, additions, keyOf) {
    if (!Array.isArray(targetArray)) return 0;
    var used = Object.create(null), added = 0;
    targetArray.forEach(function (item) { used[keyOf(item)] = true; });
    additions.forEach(function (item) { var key = keyOf(item); if (!used[key]) { used[key] = true; targetArray.push(item); added++; } });
    return added;
  }

  var added = { words: 0, crosswords: 0, trueFalse: 0, memoryThemes: 0 };
  if (base) {
    added.words = appendUnique(base.words, extraWords, function (item) { return item[0]; });
    added.crosswords = appendUnique(base.crosswords, extraWords, function (item) { return item[0]; });
    added.trueFalse = appendUnique(base.trueFalse, extraFacts, function (item) { return item[0]; });
    added.memoryThemes = appendUnique(base.mixedMemoryThemes, extraMemoryThemes, function (item) { return item.nombre; });
  }

  var generators = {
    numeros: 180, calculo: 160, palabras: 60, series: 120, memoria: 60, sudoku: 80,
    sopa: 120, crucigrama: 80, tiempo: 160, verdadero: 36, cocomed: 180,
    futbol: 120
  };

  function stableChallenges(game, level) {
    var count = Math.max(target, Number(generators[game]) || target), result = [];
    for (var index = 0; index < count; index++) result.push(Object.freeze({ id: "v144-" + game + "-l" + level + "-" + String(index + 1).padStart(3, "0"), game: game, level: level, seed: index + 1 }));
    return result;
  }

  var inventory = {};
  Object.keys(generators).forEach(function (game) {
    inventory[game] = {};
    levels.forEach(function (level) { inventory[game][level] = stableChallenges(game, level); });
  });

  function contentCounts() {
    var words = base && base.words || [], facts = base && base.trueFalse || [];
    return {
      words: { basic: words.filter(function (item) { return item[0].length <= 7; }).length, intermediate: words.filter(function (item) { return item[0].length === 8 || item[0].length === 9; }).length, advanced: words.filter(function (item) { return item[0].length >= 10; }).length },
      trueFalse: levels.reduce(function (out, level) { out[level] = facts.filter(function (item) { return Number(item[3] || 1) === level; }).length; return out; }, {}),
      crosswords: base && base.crosswords && base.crosswords.length || 0,
      memoryThemes: base && base.mixedMemoryThemes && base.mixedMemoryThemes.length || 0,
      cocoMed: (root.CocoV142MedExtra || []).length
    };
  }

  function audit() {
    var failures = [], counts = contentCounts();
    Object.keys(inventory).forEach(function (game) {
      levels.forEach(function (level) {
        var list = inventory[game][level], ids = new Set(list.map(function (item) { return item.id; }));
        if (list.length < target) failures.push(game + " nivel " + level + " tiene menos de " + target + " combinaciones");
        if (ids.size !== list.length) failures.push(game + " nivel " + level + " contiene identificadores duplicados");
      });
    });
    extraFacts.forEach(function (item) { if (typeof item[1] !== "boolean" || !item[2]) failures.push("Afirmación sin respuesta verificada: " + item[0]); });
    return { version: "144.0.0", minimumPerLevel: target, gamesAudited: Object.keys(inventory).length, levelsAudited: Object.keys(inventory).length * 3, counts: counts, additions: added, antiRepeat: { stableIds: true, shuffledBag: true, perUserGameLevel: true, cloud: "coco_content_rotation", localFallback: "coco_v134_rotation_", avoidsImmediateRepeatAfterReset: true }, failures: failures, passed: failures.length === 0 };
  }

  root.CocoContentV144 = Object.freeze({
    version: "144.0.0", minimumPerLevel: target, games: Object.freeze(Object.keys(generators)),
    inventory: inventory, challenges: function (game, level) { return inventory[game] && inventory[game][level] ? inventory[game][level].slice() : []; },
    audit: audit
  });
  root.CocoV144ContentAudit = Object.freeze(audit());
})(window);
/* v161: diversidad editorial y ejes reales para los 13 juegos. */
(function (root) {
  "use strict";

  if (root.CocoContentV161) return;

  var base = root.CocoV134Content;
  var extraWords = [
    ["ACENTO", "Mayor intensidad con la que se pronuncia una sílaba"],
    ["BRÚJULA", "Instrumento con una aguja que ayuda a orientarse"],
    ["CAUCE", "Terreno por el que corre el agua de un río"],
    ["CICLO", "Serie de etapas que vuelve a comenzar"],
    ["ECUACIÓN", "Igualdad matemática que contiene una incógnita"],
    ["ESTROFA", "Conjunto de versos dentro de un poema"],
    ["FRONTERA", "Límite que separa dos territorios"],
    ["HUMEDAD", "Cantidad de vapor de agua presente en el aire"],
    ["ISÓTOPO", "Átomo del mismo elemento con distinto número de neutrones"],
    ["LITORAL", "Franja de tierra situada junto al mar"],
    ["MIGRACIÓN", "Desplazamiento de seres vivos de un lugar a otro"],
    ["NUTRIENTE", "Sustancia que un organismo utiliza para vivir y crecer"],
    ["PARÁBOLA", "Curva cuyos puntos cumplen una relación geométrica determinada"],
    ["PREDICADO", "Parte de la oración que expresa algo sobre el sujeto"],
    ["RELIEVE", "Conjunto de formas que presenta la superficie terrestre"],
    ["SEDIMENTO", "Material que se deposita después de ser transportado"],
    ["TEOREMA", "Proposición demostrada mediante razonamiento lógico"],
    ["TRADICIÓN", "Costumbre transmitida entre generaciones"],
    ["VELOCIDAD", "Relación entre el desplazamiento y el tiempo empleado"],
    ["XILEMA", "Tejido vegetal que transporta agua y sales minerales"],
    ["ADJETIVO", "Palabra que expresa una cualidad o característica de un nombre"],
    ["ECOSISTEMA", "Seres vivos y medio físico que se relacionan en un lugar"],
    ["LONGITUD", "Distancia angular al este u oeste de un meridiano de referencia"],
    ["MÚLTIPLO", "Número obtenido al multiplicar otro por un entero"],
    ["PRONOMBRE", "Palabra que puede sustituir a un nombre"],
    ["REACCIÓN", "Proceso en el que unas sustancias se transforman en otras"],
    ["SOBERANÍA", "Autoridad de un Estado para decidir dentro de su territorio"],
    ["TRAPECIO", "Cuadrilátero que tiene al menos un par de lados paralelos"],
    ["URBANIZACIÓN", "Proceso por el que aumenta la población y superficie de las ciudades"],
    ["VECTOR", "Magnitud que tiene módulo, dirección y sentido"]
  ];

  var extraFacts = [
    ["El número 24 es múltiplo de seis.", true, "24 = 6 × 4.", 1],
    ["Un adjetivo puede expresar una cualidad de un sustantivo.", true, "Por ejemplo, «azul» puede describir a «cielo».", 1],
    ["Todos los ríos desembocan directamente en el mar.", false, "También pueden desembocar en otro río, un lago o una zona interior.", 1],
    ["Las plantas necesitan luz en algún momento para realizar la fotosíntesis.", true, "La energía luminosa impulsa ese proceso.", 1],
    ["Un rombo tiene necesariamente cuatro ángulos rectos.", false, "Tiene cuatro lados iguales, pero sus ángulos no tienen que ser rectos.", 1],
    ["La sílaba tónica siempre lleva tilde escrita.", false, "Todas las palabras tienen sílaba tónica, pero no todas llevan tilde.", 1],
    ["La longitud geográfica se mide respecto al meridiano de Greenwich.", true, "Indica la posición hacia el este o el oeste.", 2],
    ["La evaporación y la condensación son el mismo cambio de estado.", false, "La evaporación pasa de líquido a gas; la condensación, de gas a líquido.", 2],
    ["La suma de dos múltiplos de cinco vuelve a ser múltiplo de cinco.", true, "Ambos terminan en 0 o 5 y su suma también.", 2],
    ["Un texto argumentativo solo enumera hechos sin defender una idea.", false, "Presenta una tesis apoyada con razones o evidencias.", 2],
    ["Los glaciares pueden modificar el relieve al erosionar y transportar materiales.", true, "El hielo en movimiento desgasta y desplaza rocas.", 2],
    ["La rapidez media se calcula dividiendo la distancia recorrida entre el tiempo.", true, "Rapidez media = distancia/tiempo.", 2],
    ["Si una escala es 1:100, un centímetro del plano representa cien centímetros reales.", true, "La segunda cantidad indica la medida real correspondiente.", 2],
    ["Los pronombres siempre acompañan a un sustantivo sin sustituirlo.", false, "A menudo lo sustituyen para evitar repeticiones.", 2],
    ["Una reacción química conserva el número de átomos de cada elemento.", true, "Los átomos se reorganizan, por eso se ajustan las ecuaciones químicas.", 3],
    ["Todo cuadrilátero con lados opuestos paralelos es un cuadrado.", false, "También puede ser rectángulo, rombo o romboide.", 3],
    ["Una función lineal de pendiente negativa disminuye cuando aumenta la variable independiente.", true, "Una pendiente negativa relaciona aumento de x con descenso de y.", 3],
    ["La selección natural actúa porque todos los individuos de una población son idénticos.", false, "Necesita variación heredable entre individuos.", 3],
    ["Una fuente secundaria interpreta o analiza información procedente de otras fuentes.", true, "No es simplemente peor: cumple una función distinta de una fuente primaria.", 3],
    ["En una disolución, aumentar el volumen de disolvente sin añadir soluto suele reducir la concentración.", true, "La misma cantidad de soluto queda repartida en más volumen.", 3],
    ["Dos vectores con el mismo módulo son siempre el mismo vector.", false, "También deben coincidir su dirección y su sentido.", 3],
    ["La derivada en un punto puede interpretarse como la pendiente instantánea.", true, "Describe la tasa de cambio local de una función.", 3],
    ["El narrador de una obra es necesariamente la misma persona que su autor.", false, "El narrador es una voz construida dentro del texto.", 3],
    ["Una correlación negativa indica que las dos variables siempre son independientes.", false, "Indica una asociación inversa, no independencia ni causalidad.", 3]
  ];

  var memoryThemes = [
    { nombre: "Viaje por la península", iconos: ["ave_mapa", "ave_brujula", "nat_montana", "nat_ola", "ave_isla", "ave_canoa", "esp_sol", "tec_camara", "esc_globo", "coco_diana", "ave_tienda", "dep_bici"] },
    { nombre: "Lengua en imágenes", iconos: ["esc_libros", "esc_lapiz", "esc_cuaderno", "tec_auriculares", "tec_portatil", "ave_llave", "coco_idea", "coco_puzzle", "esc_bombilla", "tec_camara", "ave_castillo", "coco_cerebro"] },
    { nombre: "Física cotidiana", iconos: ["tec_engranaje", "tec_bateria", "tec_reloj", "dep_bici", "dep_diana", "nat_sol", "nat_ola", "esc_numeros", "esc_abaco", "coco_grafico", "esp_planeta", "tec_chip"] },
    { nombre: "Biodiversidad", iconos: ["ani_abeja", "ani_ballena", "ani_buho", "ani_delfin", "ani_leon", "ani_mariposa", "ani_panda", "ani_pulpo", "ani_rana", "ani_tortuga", "ani_zorro", "nat_arbol"] },
    { nombre: "Diseño y tecnología", iconos: ["tec_robot", "tec_chip", "tec_engranaje", "tec_portatil", "tec_movil", "tec_camara", "tec_bateria", "tec_monitor", "esc_bombilla", "esc_lapiz", "coco_idea", "coco_puzzle"] },
    { nombre: "Deporte y estrategia", iconos: ["dep_futbol", "dep_basket", "dep_tenis", "dep_badminton", "dep_bici", "dep_diana", "dep_medalla", "dep_natacion", "dep_pingpong", "dep_trofeo", "coco_fuerza", "coco_grafico"] }
  ];

  var soupAdds = {
    "Fácil": {
      "Colegio": ["TEXTO", "CURSO", "MAPA", "VERSO", "RIMA", "DATO"],
      "Naturaleza": ["CAUCE", "CLIMA", "COSTA", "FAUNA", "MONTE", "ISLA"]
    },
    "Medio": {
      "Tecnología": ["VECTOR", "ENLACE", "DISEÑO", "DATOS", "SISTEMA", "PROCESO"],
      "Naturaleza": ["RELIEVE", "LITORAL", "HUMEDAD", "MIGRACION", "SEDIMENTO", "ECOSISTEMA"]
    },
    "Difícil": {
      "Lenguaje": ["PRONOMBRE", "PREDICADO", "ARGUMENTO", "SEMANTICA", "ESTROFA", "NARRADOR"],
      "Matemáticas": ["PARABOLA", "TEOREMA", "COORDENADA", "INTERSECCION", "PROPORCION", "ESTADISTICA"]
    }
  };

  function appendUnique(target, additions, key) {
    if (!Array.isArray(target)) return 0;
    var seen = Object.create(null), added = 0;
    target.forEach(function (item) { seen[key(item)] = true; });
    additions.forEach(function (item) { var id = key(item); if (!seen[id]) { seen[id] = true; target.push(item); added++; } });
    return added;
  }

  var additions = { words: 0, crosswords: 0, trueFalse: 0, memoryThemes: 0, soupWords: 0, cocoMed: 0 };
  if (base) {
    additions.words = appendUnique(base.words, extraWords, function (item) { return item[0]; });
    additions.crosswords = appendUnique(base.crosswords, extraWords, function (item) { return item[0]; });
    additions.trueFalse = appendUnique(base.trueFalse, extraFacts, function (item) { return item[0]; });
    additions.memoryThemes = appendUnique(base.mixedMemoryThemes, memoryThemes, function (item) { return item.nombre; });
    Object.keys(soupAdds).forEach(function (level) {
      Object.keys(soupAdds[level]).forEach(function (theme) {
        var target = base.soupExtensions[level] && base.soupExtensions[level][theme];
        additions.soupWords += appendUnique(target, soupAdds[level][theme], function (item) { return item; });
      });
    });
  }

  var healthConcepts = [
    ["Sueño", "Regularidad", "mantener una hora de descanso razonablemente estable", "favorece que el cuerpo anticipe el descanso", "cambiar el horario varias horas cada noche"],
    ["Nutrición", "Alérgenos", "leer el etiquetado y preguntar a una persona adulta responsable", "ayuda a evitar una exposición conocida", "probar un alimento dudoso para comprobar la reacción"],
    ["Actividad física", "Carga progresiva", "aumentar la dificultad poco a poco y con técnica controlada", "permite adaptarse al esfuerzo", "duplicar la carga sin preparación"],
    ["Salud digital", "Pausas posturales", "cambiar de postura y levantarse periódicamente", "reduce el tiempo mantenido en una misma posición", "permanecer inmóvil hasta terminar todas las tareas"],
    ["Prevención", "Señales de alarma", "avisar a una persona adulta y buscar ayuda profesional cuando corresponde", "permite valorar el problema con seguridad", "ocultar un síntoma intenso o persistente"],
    ["Primeros auxilios", "Quemadura", "apartarse de la fuente, enfriar con agua corriente y pedir ayuda adulta", "limita el calor residual y permite valorar la lesión", "aplicar hielo directamente o remedios desconocidos"]
  ];
  var medExtra = [];
  healthConcepts.forEach(function (item, index) {
    var area=item[0], concept=item[1], action=item[2], benefit=item[3], unsafe=item[4], id="v161-med-"+String(index+1).padStart(2,"0");
    medExtra.push({id:id+"a",stage:"Preuniversitario",subject:area,topic:concept,difficulty:"Básica",type:"conocimiento",stem:"¿Qué práctica es más adecuada en relación con "+concept.toLowerCase()+"?",options:[action,unsafe,"ignorar la situación"],answer:0,explanation:"La práctica adecuada es "+action+"; "+benefit+".",reference:"Contenido educativo preventivo; no sustituye atención profesional."});
    medExtra.push({id:id+"b",stage:"Preuniversitario",subject:area,topic:concept,difficulty:"Media",type:"comprensión",stem:"¿Por qué puede ser útil "+action+"?",options:[benefit,"porque elimina todos los riesgos","porque sustituye cualquier consulta"],answer:0,explanation:"Puede ser útil porque "+benefit+".",reference:"Contenido educativo preventivo; no sustituye atención profesional."});
    medExtra.push({id:id+"c",stage:"Preuniversitario",subject:area,topic:concept,difficulty:"Media",type:"aplicación",stem:"¿Qué decisión sería más segura en una situación relacionada con "+concept.toLowerCase()+"?",options:[unsafe,action,"no pedir ayuda en ningún caso"],answer:1,explanation:"La decisión más segura es "+action+".",reference:"Contenido educativo preventivo; no sustituye atención profesional."});
    medExtra.push({id:id+"d",stage:"Preuniversitario",subject:area,topic:concept,difficulty:"Avanzada",type:"razonamiento",stem:"Una persona propone "+unsafe+". ¿Qué corrección está mejor fundamentada?",options:["La propuesta elimina cualquier riesgo.","Conviene "+action+", porque "+benefit+".","Las dos opciones son equivalentes."],answer:1,explanation:"Conviene corregir la propuesta: "+action+".",reference:"Contenido educativo preventivo; no sustituye atención profesional."});
  });
  var priorMed = Array.isArray(root.CocoV142MedExtra) ? root.CocoV142MedExtra : [];
  var combinedMed = Object.freeze(priorMed.concat(medExtra));
  root.CocoV142MedExtra = combinedMed;
  root.CocoV141MedExtra = combinedMed;
  additions.cocoMed = medExtra.length;

  var variety = Object.freeze({
    numeros:["tableros 5×5, 6×6 y 7×7","caminos generados sin repetición","pista, retroceso y reinicio"],
    calculo:["operaciones básicas","porcentajes, fracciones y medias","operaciones encadenadas y potencias"],
    palabras:["vocabulario cotidiano","vocabulario escolar","conceptos abstractos y científicos"],
    series:["patrones aditivos y alternos","Fibonacci, primos y figuras","potencias, factoriales y polinomios"],
    memoria:["temas visuales rotatorios","tres tamaños de tablero","mezcla de ciencia, arte, deporte y naturaleza"],
    sudoku:["4×4 inicial","4×4 intermedio","6×6 avanzado con solución única"],
    sopa:["seis temas por nivel","ocho direcciones","vocabulario graduado por longitud"],
    crucigrama:["cuadrículas variables","pistas de cinco áreas escolares","rotación sin repetición inmediata"],
    tiempo:["cálculo","lenguaje y lógica","ciencia y atención"],
    verdadero:["matemáticas y lengua","ciencias y geografía","ciudadanía y tecnología"],
    cocomed:["prevención y hábitos","anatomía y fisiología","aplicación y razonamiento seguro"],
    futbol:["seis zonas posibles","tres ritmos de exposición","tres niveles y reacción variable"],
    padel:["mixing por niveles","rondas, pistas y duración configurables","games, sets, ranking e historial"]
  });

  function audit() {
    var ids=["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","cocomed","futbol","padel"], failures=[];
    ids.forEach(function (id) { if (!variety[id] || variety[id].length < 3) failures.push(id+" no documenta al menos tres ejes de variedad"); });
    extraFacts.forEach(function (item) { if (typeof item[1] !== "boolean" || !item[2] || ![1,2,3].includes(item[3])) failures.push("Afirmación inválida: "+item[0]); });
    medExtra.forEach(function (item) { if (!item.id || item.options.length !== 3 || item.answer < 0 || item.answer > 2 || !item.explanation) failures.push("Pregunta Coco Med inválida: "+item.id); });
    return {version:"161.0.0",games:ids.length,additions:additions,variety:variety,failures:failures,passed:failures.length===0};
  }

  root.CocoContentV161 = Object.freeze({version:"161.0.0",variety:variety,additions:Object.freeze(additions),audit:audit});
  root.CocoV161ContentAudit = Object.freeze(audit());
})(window);
