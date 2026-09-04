(function () {
  "use strict";

  var content = window.CocoV134Content;
  if (!content || window.CocoV142ContentAudit) return;

  var vocabulary = [
    ["BOSQUE", "Terreno poblado por muchos árboles"],
    ["NUBE", "Conjunto visible de gotas de agua en el cielo"],
    ["PUENTE", "Construcción que permite cruzar un obstáculo"],
    ["FARO", "Torre luminosa que guía a los barcos"],
    ["LAGO", "Masa de agua rodeada de tierra"],
    ["PLAYA", "Orilla de arena junto al mar"],
    ["BARCO", "Vehículo que navega por el agua"],
    ["CAMPO", "Terreno abierto alejado de la ciudad"],
    ["PINCEL", "Herramienta con pelos usada para pintar"],
    ["TAMBOR", "Instrumento que suena al golpear una membrana"],
    ["TEATRO", "Lugar donde se representan obras ante el público"],
    ["RELOJ", "Instrumento que indica la hora"],
    ["LLAVE", "Objeto que abre una cerradura"],
    ["MIEL", "Alimento dulce elaborado por las abejas"],
    ["QUESO", "Alimento que se elabora a partir de leche"],
    ["OLIVO", "Árbol cuyo fruto es la aceituna"],
    ["HOJA", "Parte plana de una planta donde capta luz"],
    ["RAMA", "Parte del árbol que nace del tronco"],
    ["CUEVA", "Hueco natural grande dentro de una roca"],
    ["ISLA", "Tierra rodeada de agua por todas partes"],
    ["NIEVE", "Agua congelada que cae en copos"],
    ["LLUVIA", "Agua que cae de las nubes"],
    ["TRUENO", "Sonido producido por una descarga eléctrica atmosférica"],
    ["SOMBRA", "Zona oscura donde un objeto bloquea la luz"],
    ["PRISMA", "Cuerpo transparente que separa colores de la luz"],
    ["MORSA", "Mamífero marino con grandes colmillos"],
    ["JUNGLA", "Bosque tropical de vegetación abundante"],
    ["RUBÍ", "Piedra preciosa de color rojo"],
    ["NORIA", "Rueda que sirve para elevar agua"],
    ["GESTO", "Movimiento del rostro o cuerpo que comunica algo"],
    ["ARMADURA", "Protección rígida que cubre el cuerpo"],
    ["ZOOLÓGICO", "Lugar donde se cuidan y muestran animales"],
    ["HORIZONTE", "Línea aparente donde parecen unirse cielo y tierra"],
    ["ACUEDUCTO", "Construcción que transporta agua"],
    ["CATARATA", "Caída grande de agua en un río"],
    ["HERRADURA", "Pieza metálica que protege la pezuña de un caballo"],
    ["INVERNADERO", "Espacio protegido donde se cultivan plantas"],
    ["VENDAVAL", "Viento muy fuerte"],
    ["MOLINILLO", "Utensilio pequeño que tritura o muele"],
    ["ALFABETO", "Conjunto ordenado de letras de una lengua"],
    ["CARACOLA", "Concha en espiral de algunos moluscos"],
    ["CATAPULTA", "Máquina antigua que lanzaba objetos"],
    ["EQUIPAJE", "Conjunto de maletas de una persona que viaja"],
    ["FLOTADOR", "Objeto que ayuda a mantenerse sobre el agua"],
    ["GRANIZO", "Precipitación en pequeñas bolas de hielo"],
    ["HEMISFERIO", "Cada mitad de una esfera o del planeta"],
    ["LUCIÉRNAGA", "Insecto que produce luz"],
    ["MAREMOTO", "Movimiento brusco del mar causado por el fondo oceánico"],
    ["MOSQUETÓN", "Anilla metálica con cierre usada para sujetar"],
    ["NARANJAL", "Terreno plantado de naranjos"],
    ["PARACAÍDAS", "Dispositivo de tela que frena una caída"],
    ["PLANISFERIO", "Mapa en el que aparece toda la Tierra"],
    ["PORTAVOZ", "Aparato que amplifica la voz"],
    ["RECICLAJE", "Proceso de convertir residuos en nuevos materiales"],
    ["SALVAVIDAS", "Objeto o persona que ayuda ante peligro en el agua"],
    ["TERMÓMETRO", "Instrumento que mide la temperatura"],
    ["TORNILLO", "Pieza con rosca que sirve para unir objetos"],
    ["TRAVESÍA", "Viaje que recorre una distancia considerable"],
    ["VENTILADOR", "Aparato que mueve el aire con aspas"],
    ["YACIMIENTO", "Lugar donde se encuentran minerales o restos antiguos"],
    ["CROMOSOMA", "Estructura celular que contiene ADN"],
    ["POLINIZACIÓN", "Transporte de polen que permite formar semillas"],
    ["EVAPORACIÓN", "Paso de un líquido al estado gaseoso"],
    ["CONDENSACIÓN", "Paso de un gas al estado líquido"],
    ["METAMORFOSIS", "Cambio profundo de forma durante el desarrollo"],
    ["FOTOSFERA", "Capa visible del Sol"],
    ["GRAVITACIÓN", "Atracción que existe entre cuerpos con masa"],
    ["MICROORGANISMO", "Ser vivo tan pequeño que suele requerir microscopio"],
    ["ELECTROIMÁN", "Imán producido por una corriente eléctrica"],
    ["ARQUEOLOGÍA", "Ciencia que estudia sociedades mediante sus restos"],
    ["CARTOGRAFÍA", "Disciplina dedicada a elaborar y estudiar mapas"],
    ["OCEANOGRAFÍA", "Ciencia que estudia los océanos"],
    ["PALEONTOLOGÍA", "Ciencia que estudia seres vivos del pasado mediante fósiles"],
    ["BIOLUMINISCENCIA", "Producción de luz por un organismo vivo"],
    ["ELECTRICISTA", "Persona especializada en instalaciones eléctricas"],
    ["HELICOIDAL", "Que tiene forma de hélice"],
    ["PARALELOGRAMO", "Cuadrilátero con lados opuestos paralelos"],
    ["MULTIPLICACIÓN", "Operación que suma una cantidad varias veces"],
    ["DENOMINADOR", "Número inferior de una fracción"],
    ["NUMERADOR", "Número superior de una fracción"],
    ["EQUILIBRIO", "Estado en el que fuerzas o pesos se compensan"],
    ["TRANSLÚCIDO", "Que deja pasar luz sin mostrar imágenes nítidas"],
    ["INVERTEBRADO", "Animal que no tiene columna vertebral"],
    ["HERBÍVORO", "Animal que se alimenta principalmente de plantas"],
    ["MIGRACIÓN", "Desplazamiento periódico de animales o personas"],
    ["PRECIPITACIÓN", "Agua que cae de la atmósfera como lluvia, nieve o granizo"],
    ["CLIMATOLOGÍA", "Ciencia que estudia los climas"],
    ["DEMOCRACIA", "Sistema en el que la ciudadanía participa en las decisiones"],
    ["PATRIMONIO", "Bienes y expresiones que una comunidad valora y conserva"],
    ["EMPATÍA", "Capacidad de comprender cómo se siente otra persona"],
    ["MEDIACIÓN", "Ayuda imparcial para resolver un desacuerdo"],
    ["BIENESTAR", "Estado de salud, seguridad y satisfacción"],
    ["PUNTUALIDAD", "Cualidad de llegar o actuar a la hora acordada"],
    ["ORIENTACIÓN", "Acción de determinar una posición o dirección"],
    ["PREDICCIÓN", "Anticipación razonada de lo que puede suceder"],
    ["VERIFICACIÓN", "Comprobación de que algo es correcto"],
    ["CLASIFICACIÓN", "Organización de elementos según características comunes"],
    ["INTERPRETACIÓN", "Explicación del significado de datos o mensajes"],
    ["CONSERVACIÓN", "Protección y cuidado para evitar el deterioro"],
    ["REFORESTACIÓN", "Plantación de árboles para recuperar un terreno"],
    ["DESCOMPOSICIÓN", "Separación de algo en partes más simples"],
    ["GEOTERMIA", "Energía procedente del calor interior de la Tierra"],
    ["AERODINÁMICA", "Estudio del movimiento del aire alrededor de los cuerpos"],
    ["CRISTALIZACIÓN", "Formación de un sólido con estructura ordenada"],
    ["TELECOMUNICACIÓN", "Transmisión de información a distancia"],
    ["CIBERSEGURIDAD", "Protección de equipos, redes y datos digitales"],
    ["PROTOTIPO", "Primer modelo usado para probar una idea"],
    ["MECANISMO", "Conjunto de piezas que produce un movimiento o función"],
    ["ESTRATEGIA", "Plan de acciones para alcanzar un objetivo"],
    ["RAZONAMIENTO", "Proceso de relacionar ideas para obtener una conclusión"],
    ["VOCABULARIO", "Conjunto de palabras que conoce o usa una persona"],
    ["ORTOGRAFÍA", "Reglas para escribir correctamente una lengua"],
    ["PARÁFRASIS", "Explicación de una idea con palabras distintas"],
    ["CRONOLOGÍA", "Orden temporal de acontecimientos"],
    ["ESCENOGRAFÍA", "Decorado que representa un espacio en una obra"],
    ["PERCUSIÓN", "Familia de instrumentos que suenan al golpearlos"],
    ["COREOGRAFÍA", "Conjunto organizado de movimientos de una danza"],
    ["RESTAURACIÓN", "Reparación cuidadosa de una obra u objeto antiguo"]
  ];

  var existingWords = Object.create(null);
  content.words.forEach(function (entry) { existingWords[entry[0]] = true; });
  var newWords = vocabulary.filter(function (entry) {
    if (existingWords[entry[0]]) return false;
    existingWords[entry[0]] = true;
    return true;
  });
  Array.prototype.push.apply(content.words, newWords);

  var existingCrosswords = Object.create(null);
  content.crosswords.forEach(function (entry) { existingCrosswords[entry[0]] = true; });
  var newCrosswords = vocabulary.filter(function (entry) {
    if (existingCrosswords[entry[0]]) return false;
    existingCrosswords[entry[0]] = true;
    return true;
  });
  Array.prototype.push.apply(content.crosswords, newCrosswords);

  var facts = [
    ["La Tierra tarda aproximadamente un día en girar sobre sí misma.", true, "Ese giro produce la sucesión de día y noche.", 1],
    ["La Luna produce luz propia como una estrella.", false, "La Luna refleja la luz del Sol.", 1],
    ["Los insectos tienen seis patas.", true, "Tres pares de patas es una característica de los insectos.", 1],
    ["Todos los mamíferos ponen huevos.", false, "La mayoría pare crías vivas; solo unos pocos mamíferos ponen huevos.", 1],
    ["Una hora contiene sesenta minutos.", true, "Sesenta minutos forman una hora.", 1],
    ["Un triángulo puede tener cuatro vértices.", false, "Todo triángulo tiene tres lados y tres vértices.", 1],
    ["El sonido necesita un medio material para propagarse.", true, "No se propaga por el vacío.", 2],
    ["La luz visible viaja más despacio que el sonido en el aire.", false, "La luz viaja muchísimo más rápido que el sonido.", 2],
    ["La suma de los ángulos interiores de un triángulo plano es 180 grados.", true, "Es una propiedad de los triángulos en geometría euclídea.", 2],
    ["Dos fracciones equivalentes representan siempre cantidades distintas.", false, "Las fracciones equivalentes representan la misma cantidad.", 2],
    ["Las plantas liberan oxígeno durante la fotosíntesis.", true, "La fotosíntesis utiliza luz, agua y dióxido de carbono.", 2],
    ["La sangre circula porque los pulmones la impulsan por todo el cuerpo.", false, "El corazón es el órgano que bombea la sangre.", 1],
    ["El ecuador divide la Tierra en hemisferio norte y hemisferio sur.", true, "Es una línea imaginaria situada a igual distancia de ambos polos.", 1],
    ["Los meridianos son paralelos entre sí y nunca se encuentran.", false, "Los meridianos se encuentran en los polos.", 2],
    ["El vapor de agua puede condensarse y formar gotas.", true, "Al enfriarse, el vapor pasa al estado líquido.", 1],
    ["La masa de un objeto cambia solo por trasladarlo de una mesa al suelo.", false, "Moverlo de lugar no cambia la cantidad de materia.", 2],
    ["Un número primo tiene exactamente dos divisores positivos.", true, "Sus divisores son uno y el propio número.", 2],
    ["El número uno es primo.", false, "El uno solo tiene un divisor positivo.", 2],
    ["En una cadena alimentaria, los productores suelen ser plantas o algas.", true, "Fabrican su propio alimento mediante fotosíntesis.", 2],
    ["Los hongos pertenecen al mismo reino que las plantas.", false, "Los hongos forman un reino diferente.", 2],
    ["La rotación terrestre dura más o menos veinticuatro horas.", true, "Es el tiempo aproximado de una vuelta sobre su eje.", 1],
    ["El año bisiesto tiene 364 días.", false, "Un año bisiesto tiene 366 días.", 1],
    ["El prefijo kilo indica mil unidades.", true, "Un kilómetro contiene mil metros.", 2],
    ["Cien centímetros forman diez metros.", false, "Cien centímetros forman un metro.", 1],
    ["La brújula se orienta gracias al campo magnético terrestre.", true, "Su aguja imantada se alinea aproximadamente con ese campo.", 2],
    ["El vidrio transparente bloquea toda la luz visible.", false, "Deja pasar gran parte de la luz visible.", 1],
    ["La sílaba tónica es la que se pronuncia con mayor intensidad.", true, "Todas las palabras tienen una sílaba tónica.", 1],
    ["Un sinónimo tiene significado opuesto a otra palabra.", false, "Eso describe a un antónimo; un sinónimo tiene significado igual o parecido.", 1],
    ["Una oración debe expresar una idea con sentido completo.", true, "Esa unidad comunica una idea completa.", 1],
    ["Los signos de interrogación en español solo se escriben al final.", false, "Se escriben al principio y al final: ¿ ?.", 1],
    ["La densidad relaciona la masa con el volumen.", true, "Se calcula dividiendo masa entre volumen.", 3],
    ["Al duplicar numerador y denominador de una fracción cambia su valor.", false, "Se obtiene una fracción equivalente con el mismo valor.", 2],
    ["La energía puede transformarse de una forma a otra.", true, "Por ejemplo, una bombilla transforma energía eléctrica en luz y calor.", 2],
    ["Una máquina simple crea energía de la nada.", false, "Puede cambiar la fuerza o la dirección, pero no crea energía.", 2],
    ["La erosión puede ser causada por agua, viento o hielo.", true, "Esos agentes desgastan y transportan materiales.", 2],
    ["Todos los volcanes están en erupción continuamente.", false, "Muchos están inactivos durante largos periodos.", 1],
    ["Los glóbulos rojos transportan principalmente oxígeno.", true, "La hemoglobina se une al oxígeno.", 2],
    ["El intestino delgado no participa en la absorción de nutrientes.", false, "En él se absorbe gran parte de los nutrientes.", 2],
    ["Lavarse las manos con jabón ayuda a retirar microorganismos.", true, "El lavado correcto reduce su transmisión.", 1],
    ["Dormir menos siempre mejora la concentración.", false, "La falta de sueño suele perjudicar atención y memoria.", 1],
    ["El sistema solar incluye al Sol y los cuerpos que orbitan a su alrededor.", true, "Incluye planetas, planetas enanos, asteroides y cometas.", 1],
    ["Marte está más cerca del Sol que Mercurio.", false, "Mercurio es el planeta más cercano al Sol.", 1],
    ["La variable independiente es la que se modifica de forma controlada en un experimento.", true, "Se cambia para observar su efecto sobre la variable dependiente.", 3],
    ["Un experimento controlado cambia muchas variables a la vez sin medirlas.", false, "Busca cambiar una variable y controlar las demás.", 3],
    ["Los datos de una gráfica deben interpretarse usando sus ejes y unidades.", true, "Ejes y unidades indican qué representa cada valor.", 2],
    ["Una fuente fiable no necesita aportar ninguna evidencia.", false, "La evidencia y la posibilidad de verificación ayudan a valorar una fuente.", 2],
    ["El área de un rectángulo se calcula multiplicando base por altura.", true, "La fórmula es A = base × altura.", 1],
    ["El perímetro mide la superficie interior de una figura.", false, "El perímetro mide la longitud de su contorno.", 1],
    ["En una democracia, votar es una forma de participación ciudadana.", true, "Permite elegir representantes o decidir sobre propuestas.", 2],
    ["Respetar un turno de palabra impide el diálogo.", false, "Ayuda a escuchar y mantener un diálogo ordenado.", 1],
    ["Reutilizar un objeto puede reducir la cantidad de residuos.", true, "Alarga su vida útil y evita desecharlo antes.", 1],
    ["El papel y el vidrio se reciclan siempre en el mismo contenedor.", false, "Se separan en contenedores distintos según el sistema local.", 1],
    ["Una contraseña larga y única suele ser más segura que una corta y repetida.", true, "La longitud y la exclusividad dificultan accesos no autorizados.", 2],
    ["Compartir una contraseña con desconocidos mejora la seguridad.", false, "Las contraseñas deben mantenerse privadas.", 1],
    ["Un algoritmo es una secuencia ordenada de pasos.", true, "Describe cómo resolver una tarea o problema.", 2],
    ["Un error de programa demuestra siempre que el ordenador está roto.", false, "También puede deberse a instrucciones o datos incorrectos.", 1],
    ["Una melodía es una sucesión organizada de sonidos.", true, "Las alturas y duraciones forman una línea musical.", 1],
    ["El silencio no puede formar parte de un ritmo.", false, "Las pausas también organizan el ritmo.", 1],
    ["Los músculos suelen trabajar junto con huesos y articulaciones para movernos.", true, "La contracción muscular produce movimiento en el sistema locomotor.", 1],
    ["Calentar antes de una actividad intensa garantiza que nunca habrá lesiones.", false, "Puede preparar el cuerpo, pero no elimina por completo el riesgo.", 2]
  ];
  Array.prototype.push.apply(content.trueFalse, facts);

  var soupExtra = {
    "Fácil": {
      "Animales": ["NUTRIA", "BISONTE", "CAMELLO", "GACELA", "LAGARTO", "MEDUSA", "GORILA", "HURON", "JABALI", "KOALA"],
      "Espacio": ["COMETA", "VENUS", "MARTE", "TIERRA", "LUNAR", "SONDA", "ASTRO", "POLVO", "SOLAR", "NEBULA"],
      "Deportes": ["RUGBY", "HOCKEY", "SURF", "JUDO", "REMO", "BOXEO", "GOLF", "ESQUI", "SALTO", "CARRERA"],
      "Naturaleza": ["BOSQUE", "LLUVIA", "TRUENO", "PRADERA", "ROBLE", "SAUCE", "MUSGO", "DUNA", "VOLCAN", "VALLE"],
      "Ciencia": ["ATOMO", "MATERIA", "FUERZA", "MASA", "VOLUMEN", "CELULA", "TEJIDO", "ENERGIA", "PRISMA", "IMAN"]
    },
    "Medio": {
      "Supermente": ["ATENCION", "ESTRATEGIA", "ENFOQUE", "CALCULAR", "IMAGINAR", "ANALIZAR", "RECORDAR", "ORDENAR", "COMPARAR", "INFERIR"],
      "Animales": ["ORNITORRINCO", "CAMALEON", "FLAMENCO", "COCODRILO", "MANDRIL", "ALBATROS", "CARIBU", "CHACAL", "GUEPARDO", "LANGOSTA"],
      "Espacio": ["MERCURIO", "JUPITER", "NEPTUNO", "URANO", "ASTEROIDE", "GALAXIA", "METEORO", "ROVER", "ECLIPSE", "COSMOS"],
      "Deportes": ["TRIATLON", "BALONMANO", "ATLETISMO", "ESCALADA", "PIRAGUA", "CICLISMO", "GIMNASIA", "CANOTAJE", "LANZADOR", "PORTERIA"],
      "Naturaleza": ["MANGLAR", "GLACIAR", "TUNDRA", "PRADERA", "VOLCANICO", "TORRENTE", "PENINSULA", "MESETA", "CORDILLERA", "GEISER"],
      "Tecnología": ["PANTALLA", "TECLADO", "PROGRAMA", "BATERIA", "CAMARA", "ROBOTICA", "INTERNET", "ANTENA", "CONSOLA", "ALTAVOZ"]
    },
    "Difícil": {
      "Supermente": ["RAZONAMIENTO", "VERIFICACION", "ESTRATEGIA", "PRIORIDAD", "DEDUCCION", "PREDICCION", "CREATIVIDAD", "CONSTANCIA", "ABSTRACCION", "SECUENCIA"],
      "Ciencia": ["CROMOSOMA", "GRAVITACION", "CONDENSACION", "ECOSISTEMA", "ELECTROIMAN", "MOLECULA", "MICROBIO", "TECTONICA", "SOLUBILIDAD", "REACCION"],
      "Espacio": ["EXOPLANETA", "TELESCOPIO", "ASTRONAUTICA", "GRAVEDAD", "SUPERNOVA", "ATMOSFERA", "CONSTELACION", "ASTROLABIO", "LANZADERA", "ORBITADOR"],
      "Aventura": ["CAMPAMENTO", "EXPLORACION", "EXPEDICION", "DESCENSO", "ALTIMETRO", "MOSQUETON", "TRAVESIA", "SENDERISMO", "SALVAVIDAS", "ITINERARIO"],
      "Lenguaje": ["PARAFRASIS", "ORTOGRAFIA", "VOCABULARIO", "NARRADOR", "DESCRIPCION", "CRONOLOGIA", "CONECTOR", "PREDICADO", "ANTONIMO", "SINONIMIA"],
      "Matemáticas": ["DENOMINADOR", "NUMERADOR", "PARALELAS", "ECUACION", "COCIENTE", "PRODUCTO", "POLIGONO", "DIAGONAL", "ESTADISTICA", "GEOMETRIA"]
    }
  };
  var addedSoupWords = 0;
  Object.keys(soupExtra).forEach(function (level) {
    Object.keys(soupExtra[level]).forEach(function (category) {
      var target = content.soupExtensions[level] && content.soupExtensions[level][category];
      if (!target) return;
      var maximum = level === "Fácil" ? 8 : level === "Medio" ? 10 : 12;
      soupExtra[level][category].forEach(function (word) {
        if (word.length <= maximum && target.indexOf(word) < 0) { target.push(word); addedSoupWords++; }
      });
    });
  });
  window.CocoV142SoupExtra = soupExtra;
  window.CocoV141SoupExtra = window.CocoV142SoupExtra;

  var memoryThemes = [
    { nombre: "Laboratorio", iconos: ["esc_micro", "esc_bombilla", "tec_robot", "tec_chip", "tec_engranaje", "esc_numeros", "esc_abaco", "coco_idea", "coco_cerebro", "tec_portatil", "esp_satelite", "ave_llave"] },
    { nombre: "Océano", iconos: ["ani_delfin", "ani_pulpo", "ani_ballena", "ani_tortuga", "nat_ola", "ave_isla", "ave_canoa", "ani_rana", "nat_arcoiris", "esp_luna", "coco_pinguino", "ave_mapa"] },
    { nombre: "Noche estrellada", iconos: ["esp_luna", "esp_estrella", "esp_planeta", "esp_galaxia", "esp_telescopio", "esp_satelite", "esp_cohete", "ani_buho", "coco_estrella", "coco_cohete", "ave_cometa", "nat_nieve"] },
    { nombre: "Bosque", iconos: ["nat_arbol", "nat_flor", "nat_montana", "ani_zorro", "ani_buho", "ani_abeja", "ani_mariposa", "ani_rana", "nat_arcoiris", "ave_tienda", "ave_brujula", "ave_mapa"] },
    { nombre: "Música", iconos: ["tec_auriculares", "esc_paleta", "esc_lapiz", "coco_idea", "coco_estrella", "coco_fuego", "ave_regalo", "nat_girasol", "dep_trofeo", "tec_camara", "ave_castillo", "esp_galaxia"] },
    { nombre: "Aventura polar", iconos: ["ani_pinguino", "ani_ballena", "nat_nieve", "nat_montana", "ave_tienda", "ave_brujula", "ave_mapa", "ave_canoa", "esp_estrella", "coco_pinguino", "coco_fuerza", "dep_medalla"] },
    { nombre: "Ciudad inteligente", iconos: ["tec_robot", "tec_chip", "tec_portatil", "tec_camara", "tec_auriculares", "tec_engranaje", "ave_llave", "esc_bombilla", "esc_numeros", "coco_grafico", "coco_idea", "esp_satelite"] },
    { nombre: "Jardín", iconos: ["nat_flor", "nat_girasol", "nat_arbol", "ani_abeja", "ani_mariposa", "ani_rana", "nat_sol", "nat_arcoiris", "ani_tortuga", "ani_buho", "coco_idea", "ave_regalo"] },
    { nombre: "Deportes de equipo", iconos: ["dep_futbol", "dep_tenis", "dep_pingpong", "dep_badminton", "dep_diana", "dep_medalla", "dep_trofeo", "dep_bici", "dep_natacion", "dep_karate", "coco_fuerza", "coco_trofeo"] },
    { nombre: "Inventores", iconos: ["esc_bombilla", "tec_engranaje", "tec_chip", "tec_robot", "esc_micro", "esc_abaco", "esc_numeros", "coco_idea", "coco_puzzle", "coco_cerebro", "tec_portatil", "ave_llave"] }
  ];
  Array.prototype.push.apply(content.mixedMemoryThemes, memoryThemes);

  var healthConcepts = [
    ["Higiene", "Lavado de manos", "frotar con agua y jabón todas las zonas de las manos", "reduce la transmisión de muchos microorganismos", "lavar solo las puntas de los dedos"],
    ["Higiene", "Cepillado dental", "cepillar dientes y encías con suavidad y regularidad", "ayuda a retirar placa dental y restos de alimentos", "sustituir el cepillado por enjuagarse con agua"],
    ["Nutrición", "Hidratación", "beber agua de forma regular y atender a la sed", "ayuda a mantener las funciones normales del organismo", "esperar siempre a tener sed intensa"],
    ["Nutrición", "Fibra alimentaria", "incluir frutas, verduras, legumbres y cereales integrales", "favorece el tránsito intestinal", "eliminar todos los alimentos vegetales"],
    ["Nutrición", "Proteínas", "obtenerlas de fuentes variadas como legumbres, huevos, pescado o carne", "aportan aminoácidos necesarios para tejidos", "pensar que solo existen en un alimento"],
    ["Nutrición", "Desayuno equilibrado", "combinar alimentos nutritivos y una bebida sin exceso de azúcar", "puede aportar energía y nutrientes para la mañana", "tomar únicamente una bebida azucarada"],
    ["Descanso", "Rutina de sueño", "mantener horarios regulares y reducir pantallas antes de dormir", "facilita el descanso y la atención al día siguiente", "cambiar de horario cada noche"],
    ["Actividad física", "Calentamiento", "aumentar poco a poco la intensidad antes del ejercicio", "prepara músculos y articulaciones para la actividad", "empezar con el esfuerzo máximo sin preparación"],
    ["Actividad física", "Recuperación", "alternar esfuerzo con descanso suficiente", "permite que el cuerpo se recupere", "repetir actividad intensa sin pausas"],
    ["Seguridad", "Protección solar", "usar sombra, ropa adecuada y protector según las indicaciones", "reduce la exposición excesiva a radiación ultravioleta", "mirar directamente al Sol para acostumbrar los ojos"],
    ["Seguridad", "Casco", "usar un casco bien ajustado en actividades que lo requieren", "protege la cabeza ante determinados impactos", "llevarlo suelto o desabrochado"],
    ["Primeros auxilios", "Emergencia", "avisar a una persona adulta y llamar al servicio de emergencias cuando corresponde", "permite activar ayuda especializada", "ocultar lo ocurrido y marcharse"],
    ["Anatomía", "Corazón", "bombear sangre a través de los vasos sanguíneos", "mantiene la circulación por el organismo", "producir el aire que respiramos"],
    ["Anatomía", "Pulmones", "intercambiar oxígeno y dióxido de carbono", "participan en la respiración", "digerir los alimentos"],
    ["Anatomía", "Cerebro", "coordinar información, movimientos y muchas funciones corporales", "forma parte del sistema nervioso", "filtrar la sangre para producir orina"],
    ["Anatomía", "Huesos", "sostener el cuerpo y proteger órganos junto con otras funciones", "forman gran parte del esqueleto", "transportar oxígeno como función principal"],
    ["Anatomía", "Músculos", "contraerse para producir movimiento", "trabajan con huesos y articulaciones", "permanecer siempre inmóviles"],
    ["Anatomía", "Piel", "actuar como barrera y participar en la sensibilidad y la temperatura", "es el órgano más extenso del cuerpo", "sustituir al corazón en la circulación"],
    ["Fisiología", "Glóbulos rojos", "transportar oxígeno mediante la hemoglobina", "circulan por los vasos sanguíneos", "fabricar hueso nuevo"],
    ["Fisiología", "Digestión", "transformar alimentos en sustancias que el organismo puede aprovechar", "comienza en la boca y continúa en el aparato digestivo", "ocurrir únicamente en el intestino grueso"],
    ["Fisiología", "Riñones", "filtrar la sangre y ayudar a regular agua y sales", "participan en la formación de orina", "bombear sangre a los pulmones"],
    ["Fisiología", "Sistema inmunitario", "reconocer y responder frente a muchas amenazas biológicas", "incluye células, tejidos y órganos coordinados", "funcionar como un único hueso"],
    ["Prevención", "Vacunación", "entrenar al sistema inmunitario frente a enfermedades concretas", "puede reducir el riesgo o la gravedad de ciertas infecciones", "curar de inmediato cualquier enfermedad existente"],
    ["Prevención", "Ventilación", "renovar el aire de espacios cerrados cuando es posible", "puede reducir la acumulación de contaminantes y aerosoles", "sellar siempre todas las entradas de aire"],
    ["Salud mental", "Respiración pausada", "inspirar y espirar lentamente durante un momento de tensión", "puede ayudar a recuperar calma", "aguantar la respiración hasta marearse"],
    ["Salud mental", "Pedir ayuda", "hablar con una persona adulta de confianza ante un problema persistente", "permite buscar apoyo y soluciones seguras", "aislarse y no contárselo a nadie"],
    ["Salud mental", "Pausa activa", "levantarse y moverse después de un periodo largo sentado", "ayuda a variar la postura y reactivar la atención", "permanecer muchas horas sin cambiar de postura"],
    ["Salud digital", "Volumen de auriculares", "mantener un volumen moderado y hacer descansos", "reduce la exposición prolongada a sonidos intensos", "subirlo al máximo para oír mejor"],
    ["Salud digital", "Ergonomía", "ajustar pantalla, silla y postura a una posición cómoda", "puede disminuir molestias por posturas mantenidas", "encorvarse para acercar los ojos a la pantalla"],
    ["Salud digital", "Descanso visual", "mirar periódicamente a una distancia mayor", "relaja el enfoque cercano mantenido", "fijar la vista sin parpadear"],
    ["Ciencia de la salud", "Temperatura corporal", "medirla con un termómetro adecuado", "aporta un dato que debe interpretarse junto con síntomas y contexto", "calcularla tocando una pantalla"],
    ["Ciencia de la salud", "Frecuencia cardiaca", "contar los latidos durante un tiempo conocido", "indica cuántas veces late el corazón por unidad de tiempo", "medir la longitud de los huesos"],
    ["Ciencia de la salud", "Respiración", "contar ciclos de inspiración y espiración", "permite estimar la frecuencia respiratoria", "contar únicamente los parpadeos"],
    ["Nutrición", "Variedad alimentaria", "combinar grupos de alimentos y variar las elecciones", "ayuda a obtener nutrientes diferentes", "comer todos los días exactamente un único alimento"],
    ["Nutrición", "Etiquetado", "comparar porciones e información nutricional completa", "ayuda a valorar productos de forma informada", "mirar solo el color del envase"],
    ["Seguridad alimentaria", "Cadena de frío", "mantener refrigerados los alimentos que lo necesitan", "dificulta el crecimiento de muchos microorganismos", "dejarlos horas al sol"],
    ["Seguridad alimentaria", "Contaminación cruzada", "separar alimentos crudos de los listos para comer", "reduce el paso de microorganismos entre alimentos", "usar siempre la misma tabla sin limpiarla"],
    ["Higiene", "Tos segura", "cubrir boca y nariz con el codo flexionado", "disminuye la dispersión de gotas hacia las manos y el entorno", "toser directamente sobre otra persona"],
    ["Higiene", "Herida pequeña", "lavarla con agua, pedir ayuda adulta y protegerla de forma adecuada", "ayuda a retirar suciedad y vigilar su evolución", "aplicar productos desconocidos"],
    ["Prevención", "Medicamentos", "tomarlos solo según indicación de una persona adulta responsable o profesional", "reduce errores de dosis y uso", "compartirlos porque otra persona tiene síntomas parecidos"],
    ["Actividad física", "Hidratación en ejercicio", "beber antes, durante o después según duración, intensidad y calor", "ayuda a reponer líquidos", "evitar el agua durante toda actividad"],
    ["Actividad física", "Técnica", "aprender el movimiento de forma progresiva y supervisada", "mejora el control y puede reducir riesgos", "usar cargas altas antes de dominar el gesto"],
    ["Entorno", "Calidad del aire", "alejarse del humo y buscar espacios ventilados", "reduce la exposición a contaminantes", "respirar humo de forma voluntaria"],
    ["Entorno", "Ruido", "usar protección y limitar el tiempo en ambientes muy ruidosos", "reduce el riesgo de daño auditivo", "acercarse más a la fuente de ruido"],
    ["Desarrollo", "Crecimiento", "comparar la evolución con controles adecuados y no con una única medida aislada", "el crecimiento se valora a lo largo del tiempo", "sacar conclusiones definitivas con un solo dato"]
  ];
  var medExtra = [];
  healthConcepts.forEach(function (item, index) {
    var subject = item[0], concept = item[1], action = item[2], benefit = item[3], unsafe = item[4], prefix = "v141-med-" + String(index + 1).padStart(3, "0");
    medExtra.push({ id: prefix + "a", stage: "Preuniversitario", subject: subject, topic: concept, difficulty: "Básica", type: "conocimiento", stem: "¿Qué práctica describe mejor " + concept.toLowerCase() + "?", options: [action, unsafe, "no prestar atención a ninguna señal del cuerpo"], answer: 0, explanation: "La opción adecuada es " + action + "; " + benefit + ".", reference: "Contenido educativo preventivo v141; no sustituye atención profesional." });
    medExtra.push({ id: prefix + "b", stage: "Preuniversitario", subject: subject, topic: concept, difficulty: "Básica", type: "comprensión", stem: "¿Por qué es útil " + action + "?", options: [benefit, "porque elimina cualquier riesgo en todas las situaciones", "porque sustituye una consulta profesional"], answer: 0, explanation: "Es útil porque " + benefit + ".", reference: "Contenido educativo preventivo v141; no sustituye atención profesional." });
    medExtra.push({ id: prefix + "c", stage: "Preuniversitario", subject: subject, topic: concept, difficulty: "Media", type: "aplicación", stem: "En una situación cotidiana relacionada con " + concept.toLowerCase() + ", ¿qué decisión es más segura?", options: [action, unsafe, "ignorar el contexto y copiar lo que haga otra persona"], answer: 0, explanation: "La decisión más segura es " + action + ", ya que " + benefit + ".", reference: "Contenido educativo preventivo v141; no sustituye atención profesional." });
    medExtra.push({ id: prefix + "d", stage: "Preuniversitario", subject: subject, topic: concept, difficulty: "Media", type: "razonamiento", stem: "Una persona propone " + unsafe + ". ¿Cuál es la mejor corrección?", options: ["Conviene " + action + ", porque " + benefit + ".", "La propuesta es siempre segura.", "No importa qué opción se elija."], answer: 0, explanation: "La propuesta debe corregirse: conviene " + action + ".", reference: "Contenido educativo preventivo v141; no sustituye atención profesional." });
  });
  window.CocoV142MedExtra = Object.freeze(medExtra);
  window.CocoV141MedExtra = window.CocoV142MedExtra;

  window.CocoV142ContentAudit = Object.freeze({
    version: "142.0.0",
    addedWords: newWords.length,
    addedCrosswords: newCrosswords.length,
    addedTrueFalse: facts.length,
    addedSoupWords: addedSoupWords,
    addedMemoryThemes: memoryThemes.length,
    addedCocoMed: medExtra.length
  });
  window.CocoV141ContentAudit = window.CocoV142ContentAudit;
})();
