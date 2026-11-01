export const VERSION='city-1';
export const TYPES={property:['Propiedad','🏡'],work:['Trabajo','💼'],chance:['Oportunidad','🎁'],cost:['Imprevisto','🧾'],study:['Formación','🎓'],life:['Experiencia','🌍'],social:['Colaboración','🤝'],city:['La ciudad','🌦️']};
const squares=[['Salida','work'],['Jardines','property'],['Oportunidad','chance'],['Casa del Río','property'],['Gastos','cost'],['Aprender','study'],['Tienda del Barrio','property'],['Encuentro','social'],['Piso de la Plaza','property'],['La ciudad','city'],['Parque','life'],['Trabajo','work'],['Casa del Mirador','property'],['Sorpresa','chance'],['Cafetería Central','property'],['Formación','study'],['Piso Alameda','property'],['Imprevisto','cost'],['Casa del Sol','property'],['Colaborar','social'],['Viajes','life'],['Oportunidad','chance'],['Taller Creativo','property'],['La ciudad','city'],['Piso del Mar','property'],['Trabajo','work'],['Librería','property'],['Aprender','study'],['Casa de la Playa','property'],['Imprevisto','cost'],['Descanso','life'],['Piso Luna','property'],['Sorpresa','chance'],['Mercado Local','property'],['Encuentro','social'],['La ciudad','city'],['Casa del Olivo','property'],['Viajar','life'],['Piso del Puerto','property'],['Trabajo','work']];
export const BOARD=squares.map(([name,type],i)=>({id:i,name,type,business:/Tienda|Cafetería|Taller|Librería|Mercado/.test(name),price:350+(i%7)*50,rent:40+(i%5)*10}));
export const GOALS=[
 {id:'builder',name:'Crear un hogar',targets:[['properties',3,'Tener 3 propiedades'],['upgrades',1,'Hacer 1 reforma'],['wellbeing',4,'Alcanzar 4 de bienestar']]},
 {id:'entrepreneur',name:'Emprender',targets:[['business',2,'Tener 2 negocios'],['skill',4,'Aprender 4 habilidades'],['money',600,'Guardar 600 CB']]},
 {id:'explorer',name:'Descubrir el mundo',targets:[['experience',5,'Vivir 5 experiencias'],['skill',3,'Aprender 3 habilidades'],['wellbeing',5,'Alcanzar 5 de bienestar']]},
 {id:'community',name:'Construir comunidad',targets:[['community',5,'Sumar 5 de comunidad'],['properties',2,'Tener 2 propiedades'],['experience',3,'Vivir 3 experiencias']]},
 {id:'learner',name:'Aprender y crecer',targets:[['skill',6,'Aprender 6 habilidades'],['salary',350,'Llegar a un sueldo de 350 CB'],['wellbeing',4,'Alcanzar 4 de bienestar']]},
 {id:'balanced',name:'Una vida equilibrada',targets:[['money',1000,'Guardar 1.000 CB'],['experience',4,'Vivir 4 experiencias'],['community',4,'Sumar 4 de comunidad']]}
];
// Each line is an authored situation with two distinct choices and explicit effects.
// Values are game mechanics, never actual financial advice or real-world prices.
function effects(s){return Object.fromEntries(s.split(',').filter(Boolean).map(x=>{const[k,v]=x.split(':');return[k,Number(v)]}))}
function cards(type,source){return source.trim().split('\n').map((line,i)=>{const[t,story,a,ea,b,eb]=line.split('|');return{id:type+'-'+i,type,title:t,story,options:[{label:a,effects:effects(ea)},{label:b,effects:effects(eb)},...(type==='cost'?[]:[{label:'Seguir mi camino',effects:{}}])]}})}
const property=[
 ['Un jardín por descubrir','Una vivienda con espacio para cultivar y descansar.',-20],['Mudanza del propietario','El vendedor quiere cerrar la operación pronto.',-70],['Una calle renovada','El barrio acaba de mejorar sus espacios públicos.',40],['Necesita pintura','El precio refleja pequeños arreglos pendientes.',-50],['Buena orientación','La luz natural hace esta propiedad especial.',30],['Local con escaparate','Un espacio visible con potencial para emprender.',20],['Venta de temporada','Una rebaja temporal para quien se decida hoy.',-60],['Junto al parque','Un entorno tranquilo cerca de zonas verdes.',30],['Distribución práctica','Un inmueble sencillo de mantener y aprovechar.',-10],['Reforma reciente','El propietario ya ha renovado las instalaciones.',60],['Patio compartido','Los vecinos cuidan juntos un espacio al aire libre.',-30],['Cerca del transporte','Una ubicación cómoda para moverse por la ciudad.',40],['Pequeño pero versátil','Un espacio compacto con varias posibilidades.',-40],['Nueva oportunidad','Sale al mercado una propiedad de la zona.',0],['Buena negociación','El vendedor acepta ajustar su precio inicial.',-80]
].map(([title,story,shift],i)=>({id:'property-'+i,type:'property',title,story,shift,options:[]}));
export const CARDS=[...property,
...cards('work',`
Primer encargo|Una vecina necesita ayuda con su catálogo.|Hacer el encargo|money:100,skill:1|Compartirlo con el barrio|money:50,community:2
Ascenso|Te ofrecen más responsabilidad en el trabajo.|Aceptar el puesto|salary:50,wellbeing:-1|Mantener el horario|wellbeing:2
Feria de artesanía|Puedes ofrecer tus creaciones este fin de semana.|Montar un puesto|money:100,experience:1|Ayudar a organizar|community:2,skill:1
Trabajo en equipo|Una tarea grande necesita coordinación.|Coordinar el proyecto|money:80,skill:2|Apoyar al equipo|community:2,money:40
Proyecto creativo|Una tienda quiere una identidad nueva.|Diseñar la propuesta|money:120|Aprender junto al equipo|money:40,skill:2
Horario flexible|Puedes reorganizar tu semana laboral.|Ganar tiempo libre|wellbeing:2|Dedicarlo a un curso|skill:2
Cliente nuevo|Llega una oportunidad que exige preparación.|Preparar el trabajo|money:90,skill:1|Recomendar a otra persona|community:2
Pequeño taller|Te piden enseñar algo que sabes hacer.|Cobrar por el taller|money:120|Organizarlo abierto|community:3
Cambio de profesión|Una nueva actividad te resulta interesante.|Formarte primero|money:-80,skill:3|Probar un encargo|money:60,experience:1
Reparar bicicletas|El barrio prepara un paseo en grupo.|Trabajar en las bicis|money:100,skill:1|Reparar gratis algunas|community:2,wellbeing:1
Entrega urgente|Un encargo necesita una tarde adicional.|Completarlo hoy|money:160,wellbeing:-1|Reservar la tarde|wellbeing:2
Idea de negocio|Has encontrado una necesidad en tu ciudad.|Probar la idea|money:-100,salary:40|Investigar primero|skill:2
Un buen consejo|Una persona experimentada quiere ayudarte.|Escuchar y practicar|skill:2,salary:20|Ayudarle con una tarea|money:70,community:1
Proyecto sostenible|Un comercio quiere reducir desperdicios.|Preparar mejoras|money:80,community:1|Aprender el proceso|skill:2,experience:1
Reconocimiento|Tu trabajo recibe una pequeña recompensa.|Elegir el bono|money:150|Elegir formación|skill:3
`),...cards('chance',`
Bicicleta de segunda mano|Encuentras una bici útil a buen precio.|Comprar y aprender a arreglarla|money:-60,experience:2,skill:1|Guardar el dinero|wellbeing:1
Concurso del barrio|Tu propuesta ha quedado finalista.|Preparar la presentación|money:100,skill:1|Presentarla en equipo|money:50,community:2
Libro con dedicatoria|Un libro especial despierta una nueva afición.|Comprar el libro|money:-30,skill:2|Buscarlo en biblioteca|skill:1,community:1
Mercadillo|Tienes objetos que ya no utilizas.|Venderlos|money:120|Donarlos|community:3
Invitación a una feria|Puedes descubrir proyectos de otras personas.|Ir a explorar|money:-40,experience:2|Participar como voluntario|community:2,skill:1
Vale de regalo|Has recibido un vale para una actividad.|Usarlo en un curso|skill:2|Usarlo en una experiencia|experience:2
Caja de herramientas|Un vecino vende herramientas que no necesita.|Comprarlas|money:-70,skill:2|Compartir herramientas|community:2
Concurso de cocina|Hay un encuentro gastronómico en la plaza.|Preparar una receta|money:-40,experience:2|Ayudar al organizador|money:60,community:1
Premio sorpresa|Una actividad del barrio tiene premio.|Guardar el premio|money:140|Compartir parte|money:70,community:2
Una colección|Unas piezas antiguas podrían interesar a otros.|Vender la colección|money:100|Investigar su historia|skill:2,experience:1
Huerto disponible|Se libera un pequeño espacio para cultivar.|Empezar tu huerto|money:-50,wellbeing:2|Crear un huerto compartido|money:-30,community:2
Oferta de materiales|Puedes aprovechar materiales recuperados.|Comprar para practicar|money:-60,skill:2|Ayudar a repartirlos|community:2
Entrada de última hora|Queda una entrada para un espectáculo.|Disfrutar la salida|money:-50,experience:2|Cederla a un amigo|community:2
Mentoría gratuita|Una profesional te ofrece una conversación.|Preparar preguntas|skill:2,salary:20|Invitar a otro aprendiz|skill:1,community:2
Tesoro del desván|Encuentras algo que ya habías olvidado.|Venderlo|money:110|Restaurarlo|money:-30,skill:2,wellbeing:1
`),...cards('cost',`
Grifo que gotea|Hay que detener una pequeña pérdida de agua.|Llamar a un profesional|money:-60|Arreglarlo con ayuda|money:-30,skill:1
Rueda pinchada|Tu bicicleta necesita reparación.|Cambiar la cámara|money:-50|Aprender a repararla|money:-20,skill:1
Factura de electricidad|Llegó el gasto de este mes.|Pagar la factura|money:-80|Pagar y mejorar hábitos|money:-100,skill:1
Mochila rota|Tu mochila necesita arreglo o sustitución.|Comprar otra|money:-70|Repararla|money:-25,skill:1
Ventana dañada|Una ventana necesita atención.|Contratar el arreglo|money:-100|Participar en el arreglo|money:-60,skill:1
Llaves perdidas|Necesitas recuperar el acceso a tu casa.|Pedir ayuda al cerrajero|money:-90|Usar la copia y reponerla|money:-35
Caldera revisada|Es momento del mantenimiento preventivo.|Hacer la revisión|money:-90|Añadir una mejora eficiente|money:-130,wellbeing:1
Lavadora averiada|Una avería interrumpe tu rutina.|Reparar la lavadora|money:-120|Reparar compartiendo herramientas|money:-80,community:1
Gasto de transporte|Tienes varios desplazamientos pendientes.|Comprar los trayectos|money:-65|Elegir abono compartido familiar|money:-45,community:1
Factura de agua|Llegó el consumo de agua.|Pagarla|money:-60|Instalar un pequeño ahorro|money:-85,skill:1
Techo con gotera|Una lluvia revela un problema menor.|Reparación profesional|money:-130|Reparación acompañada|money:-90,skill:1
Ordenador lento|Tu herramienta de trabajo necesita mantenimiento.|Servicio técnico|money:-90|Aprender a mantenerla|money:-50,skill:2
Gafas dañadas|Necesitas reparar una montura.|Cambiar la montura|money:-80|Repararla|money:-40
Cuota del barrio|Hay que cuidar las instalaciones comunes.|Pagar tu parte|money:-60|Pagar y ayudar|money:-40,community:1
Compra imprevista|Necesitas sustituir un utensilio esencial.|Comprar uno nuevo|money:-75|Buscar uno reacondicionado|money:-45,skill:1
`),...cards('study',`
Curso de carpintería|Puedes aprender a construir objetos útiles.|Curso completo|money:-100,skill:3|Taller inicial|money:-30,skill:1
Aprender idiomas|Una academia abre nuevos grupos.|Estudiar un trimestre|money:-120,skill:2,salary:30|Intercambio de conversación|skill:1,community:1
Biblioteca abierta|Hay un ciclo de encuentros sobre ciencia.|Asistir al ciclo|skill:2|Ayudar en la biblioteca|community:2,skill:1
Programar un juego|Un taller enseña a crear tu primer juego.|Hacer el taller|money:-90,skill:3|Probar una sesión|skill:1,experience:1
Beca de formación|Puedes dedicar tiempo a una especialidad.|Aceptar la beca|skill:3|Preparar un proyecto en grupo|skill:1,community:2
Cocina saludable|Una cocinera comparte recetas sencillas.|Aprender las recetas|money:-40,skill:1,wellbeing:2|Organizar una comida conjunta|money:-20,community:2
Hablar en público|Te ofrecen practicar una presentación.|Participar en el curso|money:-60,skill:2,salary:20|Ensayar con amigos|skill:1,community:1
Educación financiera|Un taller explica presupuestos cotidianos.|Completar el taller|money:-40,skill:3|Leer la guía gratuita|skill:1
Fotografía|Puedes aprender a contar historias con imágenes.|Curso práctico|money:-70,skill:2,experience:1|Paseo fotográfico|experience:1,wellbeing:1
Primeros auxilios|Una asociación organiza formación.|Hacer el curso|money:-50,skill:2,community:1|Ayudar a convocar|community:2
Diseño de jardines|Descubres cómo cuidar espacios verdes.|Aprender y practicar|money:-60,skill:2|Cuidar el jardín vecinal|community:2,wellbeing:1
Matemáticas útiles|Un reto plantea problemas de la vida diaria.|Resolver el reto|skill:2|Estudiar con otra persona|skill:1,community:1
Reparación de objetos|Un taller enseña a dar una segunda vida.|Aprender la técnica|money:-45,skill:2|Compartir una herramienta|community:2
Negociación|Puedes practicar acuerdos que beneficien a todos.|Curso guiado|money:-80,skill:2,salary:25|Practicar en grupo|skill:1,community:1
Historia de la ciudad|Un museo abre sus puertas al barrio.|Visitar la exposición|experience:2,skill:1|Guiar a otros visitantes|community:2,skill:1
`),...cards('life',`
Escapada al mar|Tienes la oportunidad de pasar un día junto al agua.|Hacer la escapada|money:-80,experience:2,wellbeing:1|Pasear cerca de casa|wellbeing:1
Fin de semana de montaña|Un grupo propone una ruta accesible.|Apuntarte al viaje|money:-100,experience:3|Preparar una ruta local|money:-20,experience:1,wellbeing:1
Cumpleaños|Quieres celebrar con personas queridas.|Organizar la fiesta|money:-70,community:2,experience:1|Celebrar con un picnic|money:-25,wellbeing:2
Partido de pádel|Hay una jornada deportiva en el barrio.|Participar|money:-35,wellbeing:2,experience:1|Animar a tus amigos|community:1
Concierto al aire libre|Una banda toca en el parque.|Ir al concierto|money:-40,experience:2|Ayudar en la organización|community:2,experience:1
Tiempo para descansar|Tu agenda permite una pausa.|Tomarte el día|wellbeing:3|Hacer una actividad tranquila|wellbeing:1,skill:1
Viaje en tren|Puedes conocer una ciudad cercana.|Comprar el billete|money:-90,experience:3|Explorar tu propio barrio|experience:1
Afición nueva|Una actividad creativa despierta tu interés.|Comprar materiales|money:-50,skill:1,wellbeing:2|Probar con material prestado|experience:1,community:1
Acampada|Un grupo organiza una noche bajo las estrellas.|Unirte al grupo|money:-60,experience:2,community:1|Organizar una cena local|money:-25,community:2
Noche de juegos|Tus amigos proponen una reunión.|Preparar la noche|money:-30,community:2,wellbeing:1|Llevar tu juego favorito|wellbeing:1,experience:1
Ruta en bicicleta|El buen tiempo invita a salir.|Hacer la ruta larga|money:-25,experience:2,wellbeing:1|Dar un paseo breve|wellbeing:1
Aprender música|Te prestan un instrumento para empezar.|Tomar unas clases|money:-75,skill:2,wellbeing:1|Explorar por tu cuenta|experience:1
Festival cultural|La ciudad reúne música, arte y comidas.|Visitar varias actividades|money:-80,experience:3|Elegir una gratuita|experience:1,community:1
Álbum de recuerdos|Quieres reunir momentos importantes.|Crear un álbum|money:-25,wellbeing:2|Compartir una tarde de historias|community:1,experience:1
Encuentro familiar|Hay una ocasión para reunir a la familia.|Organizar el encuentro|money:-60,community:2,wellbeing:1|Hacer una visita cercana|wellbeing:2
`),...cards('social',`
Huerto comunitario|El barrio necesita manos para plantar.|Aportar herramientas|money:-60,community:3|Aportar tiempo|community:1,skill:1
Ayuda con una mudanza|Una familia se instala cerca.|Ayudar en la mudanza|community:2|Prestar materiales|money:-20,community:3
Biblioteca de objetos|Se propone compartir cosas de uso ocasional.|Aportar al fondo|money:-80,community:3,skill:1|Ayudar a organizar|community:2
Banco de tiempo|Los vecinos intercambian conocimientos.|Enseñar una habilidad|community:2,wellbeing:1|Aprender de alguien|skill:2
Comida del barrio|Una mesa compartida reúne a los vecinos.|Llevar comida|money:-40,community:3|Ayudar a montar|community:2
Jardín accesible|Se quiere mejorar un espacio para todos.|Financiar materiales|money:-90,community:4|Ayudar con el diseño|community:1,skill:1
Equipo de voluntariado|Una asociación prepara una actividad.|Participar toda la jornada|community:3|Ayudar una hora|community:1,wellbeing:1
Taller compartido|Un espacio permite trabajar en grupo.|Pagar una pequeña cuota|money:-50,skill:2,community:1|Compartir una herramienta|community:2
Recogida de libros|El colegio reúne libros para su biblioteca.|Donar libros|money:-40,community:3|Clasificar los libros|community:1,skill:1
Vecino nuevo|Alguien quiere conocer el barrio.|Preparar una bienvenida|money:-25,community:3|Enseñarle el entorno|community:2
Proyecto intergeneracional|Mayores y jóvenes comparten experiencias.|Organizar una sesión|money:-50,community:3,experience:1|Asistir y escuchar|skill:1,community:1
Reparación colectiva|Una plaza necesita pequeñas mejoras.|Aportar materiales|money:-70,community:3|Trabajar con el equipo|skill:1,community:2
Intercambio de semillas|Puedes compartir y aprender a cultivar.|Crear una caja común|money:-25,community:2,wellbeing:1|Intercambiar tus semillas|community:1,skill:1
Acompañar a alguien|Una persona necesita compañía para una gestión.|Acompañarla|community:2,wellbeing:1|Ayudar a organizar el viaje|community:1
Fiesta solidaria|El barrio organiza una celebración compartida.|Aportar al evento|money:-75,community:3,experience:1|Colaborar en la preparación|community:2
`),...cards('city',`
Fiesta local|La ciudad celebra dos rondas de actividad: los alquileres suben un 20 %.|Preparar un puesto|money:-40,experience:2|Disfrutar del ambiente|wellbeing:1
Obras en la calle|Durante dos rondas los alquileres bajan un 20 %.|Aprender sobre la mejora|skill:2|Ayudar a informar|community:2
Semana cultural|La ciudad invita a descubrir actividades.|Comprar un abono|money:-50,experience:3|Elegir un acto gratuito|experience:1
Mercado de productores|Llegan productos y proyectos de proximidad.|Participar con una idea|money:70,skill:1|Conocer a los productores|community:1,experience:1
Nuevas rutas de autobús|La ciudad mejora su transporte.|Explorar una ruta|money:-20,experience:2|Ayudar a explicar los cambios|community:2
Día sin coches|Las calles se llenan de paseantes.|Organizar un paseo|community:2,wellbeing:1|Ir en bicicleta|wellbeing:2
Reapertura del parque|Un espacio verde vuelve a estar disponible.|Celebrarlo con vecinos|money:-30,community:2,wellbeing:1|Pasear por el parque|wellbeing:2
Feria del empleo|Varias actividades muestran oportunidades.|Preparar tu presentación|skill:1,salary:30|Descubrir profesiones|skill:2
Campaña de reciclaje|La ciudad busca nuevas ideas para reutilizar.|Crear una propuesta|money:-30,skill:2,community:1|Participar en la recogida|community:2
Nueva biblioteca|Abre un espacio para aprender y encontrarse.|Apuntarte a un taller|skill:2|Ayudar en la apertura|community:2
Ola de calor|Conviene cuidar las rutinas y los espacios.|Preparar sombra y agua|money:-40,wellbeing:2|Ayudar a un vecino|community:2
Lluvia de primavera|La ciudad cambia de ritmo por un día.|Elegir una actividad interior|money:-25,experience:2|Descansar en casa|wellbeing:1
Festival de negocios|Durante dos rondas los alquileres suben un 20 %.|Preparar tu propuesta|money:-50,skill:2|Hacer contactos|community:2
Calle en reparación|Durante dos rondas los alquileres bajan un 20 %.|Conocer los nuevos accesos|skill:1,experience:1|Informar a tus vecinos|community:2
Presupuesto participativo|El barrio puede proponer una pequeña mejora.|Presentar un proyecto|skill:1,community:2|Apoyar una propuesta|community:2
`)];
export const CARD_BY_ID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
export function effectText(e){const labels={money:'CB',skill:'aprendizaje',experience:'experiencias',community:'comunidad',wellbeing:'bienestar',salary:'CB de sueldo por vuelta'};return Object.entries(e).filter(([,v])=>v).map(([k,v])=>(v>0?'+':'')+v+' '+labels[k]).join(' · ')||'Sin coste';}
