(function(root){
  "use strict";
  if(root.CocoV150ContentAudit)return;
  var base=root.CocoV134Content;
  if(!base)return;
  function addUnique(target, additions, keyFn){
    if(!Array.isArray(target))return 0;
    var seen=Object.create(null), added=0;
    target.forEach(function(x){seen[keyFn(x)]=1});
    additions.forEach(function(x){var k=keyFn(x);if(!seen[k]){seen[k]=1;target.push(x);added++}});
    return added;
  }
  var words=[
    ["ALMENDRA","Semilla comestible protegida por una cáscara"],["BRÚJULA","Instrumento que ayuda a orientarse"],["TRÍPODE","Soporte de tres patas"],["PALANCA","Barra rígida que permite transmitir una fuerza"],["POLEA","Rueda acanalada que ayuda a mover cargas"],["RESORTE","Pieza elástica que recupera su forma"],["BOSQUEJO","Dibujo rápido que prepara una idea"],["ACERTIJO","Problema breve que se resuelve pensando"],["SECUENCIA","Conjunto ordenado de elementos"],["PATRÓN","Regla que se repite de forma reconocible"],
    ["MECANISMO","Conjunto de piezas que producen un movimiento"],["EQUILIBRIO","Estado en el que fuerzas o elementos se compensan"],["VELOCIDAD","Relación entre distancia recorrida y tiempo"],["FRICCIÓN","Fuerza que se opone al deslizamiento entre superficies"],["PALANCA","Barra que gira alrededor de un punto de apoyo"],["ENGRANAJE","Rueda dentada que transmite movimiento"],["HIDRÁULICA","Tecnología que utiliza líquidos para transmitir fuerza"],["PROTOTIPO","Primer modelo usado para probar una idea"],["SECUENCIAR","Ordenar elementos siguiendo un criterio"],["ESTRATEGIA","Plan para alcanzar un objetivo"],
    ["INFERENCIA","Conclusión obtenida a partir de datos o pistas"],["ALGORITMO","Conjunto ordenado de pasos para resolver un problema"],["VARIABLE","Cantidad o elemento que puede cambiar"],["SIMETRÍA","Correspondencia equilibrada entre partes de una figura"],["PERSPECTIVA","Forma de representar profundidad o punto de vista"],["TRIANGULACIÓN","Método que usa triángulos para determinar posiciones"],["FRECUENCIA","Número de veces que se repite un fenómeno"],["LONGITUD","Medida de una distancia"],["VOLUMEN","Espacio que ocupa un cuerpo"],["DENSIDAD","Relación entre masa y volumen"],
    ["NEBULOSA","Nube interestelar de gas y polvo"],["CONSTELACIÓN","Grupo aparente de estrellas con una figura reconocible"],["ECOSISTEMA","Conjunto de seres vivos y su entorno"],["CORRIENTE","Movimiento continuo de agua, aire o electricidad"],["POLINIZADOR","Animal que transporta polen entre flores"],["GERMINACIÓN","Inicio del crecimiento de una semilla"],["EROSIÓN","Desgaste y transporte de materiales de la superficie"],["RELIEVE","Conjunto de formas de la superficie terrestre"],["MERIDIANO","Línea imaginaria que une los polos"],["LATITUD","Distancia angular respecto del ecuador"],
    ["COHERENCIA","Relación lógica y ordenada entre ideas"],["SÍNTESIS","Resumen que integra las ideas esenciales"],["ARGUMENTO","Conjunto de razones que apoyan una conclusión"],["EVIDENCIA","Dato que sirve para apoyar o revisar una idea"],["HIPÓTESIS","Explicación provisional que puede ponerse a prueba"],["CONTRASTE","Comparación que destaca diferencias"],["PRECISIÓN","Grado de exactitud con el que se realiza algo"],["FLEXIBILIDAD","Capacidad de adaptar una estrategia ante cambios"],["ATENCIÓN","Capacidad de concentrarse en información relevante"],["MEMORIA","Capacidad de conservar y recuperar información"],
    ["NAVEGACIÓN","Acción de orientarse y desplazarse por una ruta"],["EXPLORACIÓN","Búsqueda organizada para conocer algo nuevo"],["INVENTARIO","Lista ordenada de elementos disponibles"],["BITÁCORA","Registro cronológico de una actividad"],["CALIBRACIÓN","Ajuste de un instrumento para mejorar su medición"],["COORDENADA","Dato numérico que ayuda a localizar un punto"],["TRAYECTORIA","Camino que sigue un objeto en movimiento"],["PROPULSIÓN","Acción que impulsa un cuerpo hacia adelante"],["SOSTENIBILIDAD","Uso responsable de recursos pensando en el futuro"],["BIODIVERSIDAD","Variedad de seres vivos de un lugar"]
  ];
  var facts=[
    ["Un hexágono tiene seis lados.",true,"Hexa significa seis y un hexágono posee seis lados.",1],
    ["Una pera es una herramienta de taller.",false,"La pera es una fruta.",1],
    ["El martillo es una herramienta.",true,"Se utiliza para golpear o clavar, entre otras tareas.",1],
    ["Un triángulo puede tener cuatro vértices.",false,"Todo triángulo tiene tres vértices.",1],
    ["La Luna es un satélite natural de la Tierra.",true,"Orbita alrededor de la Tierra.",1],
    ["Todos los frutos tienen exactamente el mismo color.",false,"Los frutos presentan colores muy variados.",1],
    ["Dieciocho es un número par.",true,"18 es divisible entre 2.",1],
    ["Un rombo tiene cuatro lados.",true,"Es un cuadrilátero.",1],
    ["Una brújula ayuda a orientarse.",true,"Su aguja permite identificar aproximadamente la dirección norte-sur.",1],
    ["La suma de 7 y 8 es 14.",false,"7 + 8 = 15.",1],
    ["Si un patrón alterna rojo-azul-rojo-azul, después corresponde rojo.",true,"La secuencia repite dos elementos de forma alternada.",2],
    ["Un objeto puede cambiar de dirección aunque mantenga la misma rapidez.",true,"La velocidad incluye dirección, no solo rapidez.",2],
    ["La mitad de 50 es 20.",false,"La mitad de 50 es 25.",2],
    ["Un hexágono regular tiene todos sus lados iguales.",true,"Eso forma parte de la definición de polígono regular.",2],
    ["La fricción puede ayudar a que una rueda agarre el suelo.",true,"Sin suficiente fricción la rueda puede deslizar.",2],
    ["Una polea siempre elimina por completo la fuerza necesaria para elevar una carga.",false,"Puede cambiar la dirección o reducir la fuerza requerida según el sistema, pero no la elimina.",2],
    ["En una escala 1:100, un centímetro del dibujo representa cien centímetros reales.",true,"La relación indicada es de uno a cien.",2],
    ["El volumen y la longitud miden exactamente la misma magnitud.",false,"La longitud mide distancia y el volumen mide espacio ocupado.",2],
    ["Un dato aislado siempre demuestra una causa.",false,"Para establecer causalidad se necesitan más evidencias y un diseño adecuado.",3],
    ["Una estrategia puede ser correcta aunque exista otra solución diferente.",true,"Muchos problemas admiten más de un método válido.",3],
    ["Si una regla cambia durante una tarea, ignorar el cambio es una buena estrategia.",false,"Hay que actualizar el criterio para responder a la regla vigente.",3],
    ["La precisión de una medición puede mejorar al repetirla de forma controlada.",true,"Las repeticiones ayudan a detectar variabilidad y errores aleatorios.",3],
    ["Dos figuras con igual perímetro tienen necesariamente igual área.",false,"Pueden tener el mismo perímetro y áreas diferentes.",3],
    ["Si una secuencia duplica cada término, 3, 6, 12 continúa con 24.",true,"Cada término es el doble del anterior.",3],
    ["Una hipótesis científica útil debe poder contrastarse con observaciones o experimentos.",true,"Debe generar predicciones que puedan evaluarse.",3],
    ["Una correlación perfecta garantiza por sí sola que una variable cause la otra.",false,"La correlación no basta para demostrar causalidad.",3],
    ["El promedio de 5, 10 y 15 es 10.",true,"La suma es 30 y 30 dividido entre 3 es 10.",2],
    ["Si aumentas 100 un 10 %, obtienes 110.",true,"El 10 % de 100 es 10.",2],
    ["La diagonal de un cuadrado es menor que cualquiera de sus lados.",false,"La diagonal es más larga que un lado.",3],
    ["Una conclusión lógica debe guardar relación con las premisas usadas.",true,"Las premisas deben aportar apoyo pertinente a la conclusión.",3]
  ];
  var memory=[
    {nombre:"Frutas del mercado",iconos:["nat_manzana","nat_sandia","nat_flor","nat_girasol","coco_estrella","ave_regalo","esc_paleta","ani_abeja","nat_arcoiris","ave_mapa","esc_numeros","coco_idea"]},
    {nombre:"Banco de herramientas",iconos:["ave_llave","tec_engranaje","tec_robot","tec_chip","esc_regla","esc_lapiz","coco_fuerza","coco_idea","dep_diana","ave_brujula","tec_portatil","esc_abaco"]},
    {nombre:"Misión espacial",iconos:["esp_cohete","esp_planeta","esp_luna","esp_estrella","esp_satelite","esp_astronauta","esp_telescopio","esp_galaxia","coco_cohete","coco_cerebro","ave_mapa","tec_robot"]},
    {nombre:"Laboratorio brillante",iconos:["esc_micro","esc_bombilla","tec_chip","tec_robot","tec_engranaje","coco_idea","coco_grafico","coco_cerebro","esc_numeros","ave_llave","tec_camara","esp_satelite"]},
    {nombre:"Pista deportiva",iconos:["dep_futbol","dep_tenis","dep_basket","dep_pingpong","dep_bici","dep_natacion","dep_medalla","dep_trofeo","dep_diana","coco_fuerza","coco_fuego","ave_brujula"]},
    {nombre:"Aventura tropical",iconos:["nat_arbol","nat_flor","nat_ola","nat_sol","ani_delfin","ani_tortuga","ani_mariposa","ani_pulpo","ave_isla","ave_canoa","ave_mapa","nat_arcoiris"]},
    {nombre:"Ingeniería de Coco",iconos:["tec_engranaje","tec_chip","tec_robot","tec_portatil","esc_regla","esc_abaco","ave_llave","coco_idea","coco_grafico","coco_puzzle","esc_bombilla","tec_camara"]},
    {nombre:"Noche de observatorio",iconos:["esp_luna","esp_estrella","esp_telescopio","esp_planeta","esp_galaxia","esp_satelite","coco_cerebro","coco_estrella","tec_camara","ave_mapa","nat_nieve","ani_buho"]},
    {nombre:"Expedición marina",iconos:["ani_delfin","ani_ballena","ani_pulpo","ani_tortuga","nat_ola","ave_canoa","ave_isla","ave_mapa","coco_pinguino","tec_camara","esp_estrella","nat_arcoiris"]},
    {nombre:"Taller de colores",iconos:["esc_paleta","esc_lapiz","esc_cuaderno","nat_flor","nat_girasol","nat_arcoiris","coco_idea","coco_estrella","tec_camara","ave_cometa","esp_galaxia","ani_mariposa"]},
    {nombre:"Reto de lógica",iconos:["coco_puzzle","coco_cerebro","coco_grafico","esc_numeros","esc_abaco","tec_chip","tec_engranaje","ave_llave","dep_diana","ave_brujula","coco_idea","esc_regla"]},
    {nombre:"Equipo de rescate",iconos:["ave_brujula","ave_mapa","ave_tienda","ave_canoa","dep_medalla","tec_camara","tec_auriculares","coco_fuerza","nat_montana","nat_ola","ave_llave","coco_diana"]}
  ];
  var addedWords=addUnique(base.words,words,function(x){return x[0]});
  var addedCross=addUnique(base.crosswords,words,function(x){return x[0]});
  var addedFacts=addUnique(base.trueFalse,facts,function(x){return x[0]});
  var addedMemory=addUnique(base.mixedMemoryThemes,memory,function(x){return x.nombre});
  var soup=root.CocoV141SoupExtra||root.CocoV142SoupExtra||{};
  var soupAdds={
    "Fácil":{"Coco":["MENTE","RETO","FOCO","ORDEN","RITMO"],"Animales":["PATO","LOBO","FOCA","KOALA","TIGRE"],"Espacio":["MARTE","VENUS","COMETA","ASTRO","NAVE"],"Deportes":["GOLF","JUDO","SURF","SALTO","META"],"Naturaleza":["RIO","FLOR","NUBE","PINAR","PLAYA"],"Colegio":["LIBRO","REGLA","LAPIZ","CLASE","MAPA"]},
    "Medio":{"Coco":["ATENCION","MEMORIA","ESTRATEGIA","SECUENCIA","CONTROL"],"Animales":["DELFIN","PANTERA","TORTUGA","PINGUINO","MARIPOSA"],"Espacio":["NEBULOSA","SATELITE","GALAXIA","ASTEROIDE","COHETE"],"Deportes":["CICLISMO","ATLETISMO","BALONMANO","ESCALADA","GIMNASIA"],"Naturaleza":["CASCADA","BOSQUE","VOLCAN","DESIERTO","PRADERA"],"Tecnología":["ROBOTICA","PANTALLA","TECLADO","BATERIA","CIRCUITO"]},
    "Difícil":{"Supermente":["INFERENCIA","ESTRATEGIA","FLEXIBILIDAD","PERSISTENCIA","CONCENTRACION"],"Ciencia":["GRAVITACION","ECOSISTEMA","POLINIZACION","EVAPORACION","MICROCLIMA"],"Espacio":["CONSTELACION","TRAYECTORIA","GRAVEDAD","EXOPLANETA","TELESCOPIO"],"Aventura":["COORDENADA","EXPEDICION","NAVEGACION","ORIENTACION","CAMPAMENTO"],"Lenguaje":["COHERENCIA","ARGUMENTO","VOCABULARIO","SIGNIFICADO","DESCRIPCION"],"Matemáticas":["ALGORITMO","GEOMETRIA","FRACCIONES","ECUACION","SIMETRIA"]}
  };
  Object.keys(soupAdds).forEach(function(level){soup[level]=soup[level]||{};Object.keys(soupAdds[level]).forEach(function(theme){soup[level][theme]=soup[level][theme]||[];addUnique(soup[level][theme],soupAdds[level][theme],function(x){return x})})});
  root.CocoV150ContentAudit=Object.freeze({version:"150.0.0",addedWords:addedWords,addedCrosswords:addedCross,addedFacts:addedFacts,addedMemoryThemes:addedMemory,soupExpanded:true,gameVariety:{numeros:"procedural paths + anti-repeat",calculo:"multi-operation procedural pool",palabras:"expanded vocabulary",series:"expanded pattern rotation",memoria:"expanded themes",sudoku:"generated unique boards",sopa:"expanded topic vocabularies",crucigrama:"expanded clues",tiempo:"mixed microchallenges",verdadero:"expanded verified facts",cocomed:"existing large academic bank + stratified daily rotation",futbol:"sequence permutations and speed tiers",diferencias:"10 scenes + character differences",cococorre:"8 categories, 8 colors, 7 shapes",padel:"mixing and tournament combinations"}});
})(window);
