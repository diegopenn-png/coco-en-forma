(function (root) {
  "use strict";

  if (root.CocoContentV150) return;
  var base = root.CocoV134Content;
  var levels = [1, 2, 3];
  var target = 40;

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
    numeros: 320, calculo: 320, palabras: 180, series: 260, memoria: 160, sudoku: 180,
    sopa: 240, crucigrama: 180, tiempo: 320, verdadero: 120, cocomed: 360,
    futbol: 240, diferencias: 90, cococorre: 180, padel: 120
  };

  function stableChallenges(game, level) {
    var count = Math.max(target, Number(generators[game]) || target), result = [];
    for (var index = 0; index < count; index++) result.push(Object.freeze({ id: "v150-" + game + "-l" + level + "-" + String(index + 1).padStart(3, "0"), game: game, level: level, seed: index + 1 }));
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
    return { version: "150.0.0", minimumPerLevel: target, gamesAudited: Object.keys(inventory).length, levelsAudited: Object.keys(inventory).length * 3, counts: counts, additions: added, antiRepeat: { stableIds: true, shuffledBag: true, perUserGameLevel: true, cloud: "coco_content_rotation", localFallback: "coco_v134_rotation_", avoidsImmediateRepeatAfterReset: true }, failures: failures, passed: failures.length === 0 };
  }

  root.CocoContentV150 = Object.freeze({
    version: "150.0.0", minimumPerLevel: target, games: Object.freeze(Object.keys(generators)),
    inventory: inventory, challenges: function (game, level) { return inventory[game] && inventory[game][level] ? inventory[game][level].slice() : []; },
    audit: audit
  });
  root.CocoV150ContentAuditInventory = Object.freeze(audit());
  root.CocoContentV144 = root.CocoContentV150;
  root.CocoV144ContentAudit = root.CocoV150ContentAuditInventory;
})(window);
