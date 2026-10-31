import {REALITY} from './reality.mjs';
export const EXPENSES = [
  {
    "id": "rent",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Alquiler o hipoteca",
    "weight": 35,
    "text": "El alquiler paga el uso de una vivienda. La cuota de hipoteca devuelve parte del préstamo y sus intereses.",
    "example": "Una familia puede pagar alquiler y otra una hipoteca.",
    "remember": "Se elige la situación de la familia; no hace falta pagar ambos."
  },
  {
    "id": "electricity",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Electricidad",
    "weight": 5,
    "text": "Paga la energía de las luces y los aparatos eléctricos, además de los conceptos fijos de la factura.",
    "example": "Apagar una luz que no necesitas ayuda a reducir consumo.",
    "remember": "Una parte de la factura puede ser fija aunque consumas poco."
  },
  {
    "id": "water",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Agua",
    "weight": 2,
    "text": "Paga el suministro de agua y, según la factura, servicios como saneamiento.",
    "example": "Usamos agua al ducharnos o lavar los platos.",
    "remember": "Una fuga puede aumentar el consumo."
  },
  {
    "id": "gas",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Gas y calefacción",
    "weight": 3,
    "text": "Paga la energía para calentar la casa, el agua o cocinar, según la instalación.",
    "example": "En invierno puede gastarse más en calefacción.",
    "remember": "Si todo es eléctrico, evita contar la misma energía dos veces."
  },
  {
    "id": "community",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Gastos de comunidad",
    "weight": 4,
    "text": "Son aportaciones para mantener los espacios y servicios compartidos del edificio.",
    "example": "Limpieza de la escalera, ascensor y luz del portal.",
    "remember": "La comunidad también puede acordar aportaciones extraordinarias."
  },
  {
    "id": "home_insurance",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Seguro del hogar",
    "weight": 2,
    "text": "Es un contrato que cubre determinados daños o responsabilidades de la vivienda según sus condiciones.",
    "example": "Una fuga puede estar cubierta si el contrato incluye ese daño.",
    "remember": "No cubre todo: hay límites, exclusiones y a veces franquicia."
  },
  {
    "id": "communications",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Internet y telefonía",
    "weight": 3,
    "text": "Paga la conexión a internet y las líneas de teléfono de la familia.",
    "example": "La cuota del wifi de casa y del móvil.",
    "remember": "Revisa servicios extra y tarifas que ya no necesitas."
  },
  {
    "id": "home_maintenance",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Mantenimiento de la casa",
    "weight": 3,
    "text": "Es dinero reservado para reparar o sustituir cosas de la vivienda.",
    "example": "Arreglar una persiana o cambiar una lavadora.",
    "remember": "No ocurre todos los meses; puedes guardar una parte cada mes."
  },
  {
    "id": "home_taxes",
    "legacy": "house",
    "group": "Vivienda",
    "name": "Impuestos y tasas de vivienda",
    "weight": 3,
    "text": "Son pagos vinculados a la vivienda o a servicios locales, según el lugar y quién deba pagarlos.",
    "example": "Un impuesto sobre la propiedad o una tasa de residuos.",
    "remember": "La familia revisa qué le corresponde. Un pago anual puede dividirse entre doce para planificar."
  },
  {
    "id": "fuel",
    "legacy": "car",
    "group": "Transporte",
    "name": "Combustible o recarga",
    "weight": 8,
    "text": "Paga la gasolina, el diésel o la electricidad que usa el vehículo para desplazarse.",
    "example": "Ir al trabajo en coche consume combustible o carga de batería.",
    "remember": "Si la recarga ya está en la factura eléctrica, no la cuentes dos veces."
  },
  {
    "id": "car_insurance",
    "legacy": "car",
    "group": "Transporte",
    "name": "Seguro del coche",
    "weight": 3,
    "text": "Paga la cobertura contratada para determinados daños o responsabilidades relacionados con el vehículo.",
    "example": "La póliza puede cubrir daños a terceros y otras coberturas.",
    "remember": "El alcance depende del contrato y del país."
  },
  {
    "id": "car_maintenance",
    "legacy": "car",
    "group": "Transporte",
    "name": "Mantenimiento e inspección del coche",
    "weight": 3,
    "text": "Incluye revisiones, reparaciones, neumáticos e inspecciones que correspondan.",
    "example": "Guardar cada mes para una revisión anual.",
    "remember": "Tener coche cuesta dinero incluso cuando no se usa."
  },
  {
    "id": "car_taxes",
    "legacy": "car",
    "group": "Transporte",
    "name": "Impuestos del vehículo",
    "weight": 1,
    "text": "Son tributos relacionados con el vehículo, según las normas del lugar.",
    "example": "Reservar cada mes una parte de un impuesto anual.",
    "remember": "Los importes y obligaciones dependen del vehículo y del lugar."
  },
  {
    "id": "transport",
    "legacy": "car",
    "group": "Transporte",
    "name": "Transporte, aparcamiento y peajes",
    "weight": 3,
    "text": "Incluye autobús, tren, aparcamiento y uso de carreteras de peaje.",
    "example": "Un abono de transporte para ir al colegio o al trabajo.",
    "remember": "Compara el coste completo de distintas formas de moverte."
  },
  {
    "id": "car_loan",
    "legacy": "car",
    "group": "Transporte",
    "name": "Cuota del coche",
    "weight": 2,
    "text": "Si el vehículo está financiado, esta cuota devuelve el préstamo y paga sus intereses.",
    "example": "Pagar una cuota cada mes hasta terminar la financiación.",
    "remember": "Si el coche ya está pagado, esta partida puede ser cero."
  },
  {
    "id": "food",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Alimentación y supermercado",
    "weight": 6,
    "text": "Incluye comida, productos de limpieza e higiene para la familia.",
    "example": "Planificar la compra semanal y aprovechar lo que queda.",
    "remember": "No es lo mismo una compra necesaria que un capricho."
  },
  {
    "id": "school",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Colegio y comedor",
    "weight": 2,
    "text": "Incluye las cuotas educativas que correspondan, comedor y otros servicios escolares.",
    "example": "Una familia puede pagar comedor aunque no pague matrícula.",
    "remember": "Los gastos cambian según el centro, el lugar y las ayudas."
  },
  {
    "id": "school_material",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Material escolar y actividades",
    "weight": 1,
    "text": "Incluye libros, material, uniformes si se usan y actividades extraescolares.",
    "example": "Guardar durante el año para los libros del siguiente curso.",
    "remember": "Distingue lo necesario de las actividades que se eligen."
  },
  {
    "id": "health_insurance",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Salud privada o prepaga",
    "weight": 1,
    "text": "Es una cuota por un seguro o servicio privado de salud, según el sistema de cada país y el contrato.",
    "example": "Una familia decide si incluye una cobertura privada en su presupuesto.",
    "remember": "Es opcional en este juego. No significa que todas las familias la necesiten o la tengan."
  },
  {
    "id": "health",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Medicinas, dentista y gafas",
    "weight": 1,
    "text": "Son gastos de salud que la familia paga directamente cuando corresponden.",
    "example": "Comprar unas gafas o pagar una consulta no cubierta.",
    "remember": "Los seguros pueden tener copagos o servicios excluidos."
  },
  {
    "id": "clothing",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Ropa y calzado",
    "weight": 1,
    "text": "Paga la ropa y los zapatos que necesita la familia.",
    "example": "Cambiar unos zapatos que ya se han quedado pequeños.",
    "remember": "Se puede ahorrar varios meses para una compra puntual."
  },
  {
    "id": "leisure",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Ocio, deporte y vacaciones",
    "weight": 1,
    "text": "Es dinero planificado para disfrutar: deporte, salidas, viajes y tiempo libre.",
    "example": "Reservar cada mes una cantidad para unas vacaciones.",
    "remember": "Se ajusta después de cubrir los gastos esenciales."
  },
  {
    "id": "subscriptions",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Suscripciones",
    "weight": 0.5,
    "text": "Son pagos periódicos por servicios como una plataforma de entretenimiento o una aplicación.",
    "example": "Una suscripción que se cobra cada mes aunque no la uses.",
    "remember": "Revisa las renovaciones y cancela lo que ya no quieres."
  },
  {
    "id": "care",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Cuidados y mascotas",
    "weight": 0.5,
    "text": "Incluye cuidados de personas dependientes, apoyo doméstico o gastos de mascotas cuando existen.",
    "example": "Alimento y veterinario de una mascota o ayuda para un familiar.",
    "remember": "Cada hogar es diferente: usa cero cuando no corresponda."
  },
  {
    "id": "other_debt",
    "legacy": "other",
    "group": "Familia y bienestar",
    "name": "Otros préstamos y compromisos",
    "weight": 1,
    "text": "Son cuotas de deudas u obligaciones familiares que no están ya en otra partida.",
    "example": "La cuota de un préstamo para un electrodoméstico.",
    "remember": "Evita duplicar aquí la hipoteca o la financiación del coche."
  }
];
export const expenseName=id=>EXPENSES.find(x=>x.id===id)?.name||({house:'Casa · recibo anterior',car:'Coche · recibo anterior',other:'Familia · recibo anterior'}[id]||id);
// Preserve every cent of existing aggregate budgets. Existing bills remain immutable snapshots.
export function detailedExpenses(expenses){
 const result={};
 for(const group of ['house','car','other']){
  const items=EXPENSES.filter(x=>x.legacy===group),total=expenses[group]||0,weight=items.reduce((v,x)=>v+x.weight,0);let allocated=0;
  items.forEach((x,i)=>{const amount=i===items.length-1?total-allocated:Math.floor(total*x.weight/weight);allocated+=amount;result[x.id]=expenses[x.id]??amount});
 }
 return result;
}
export const HOUSEHOLD_LESSONS=[
 {term:'Cómo se distribuyen los gastos de una casa',group:'Economía de casa',text:'Primero anota los ingresos. Después separa vivienda, transporte y familia. Incluye pagos fijos, gastos que varían y una parte para pagos anuales. Lo que queda puede ir a una reserva, al ahorro de una meta o a inversiones que entiendas.',example:'Con un sueldo neto de ejemplo de 1.600 €, resta los gastos del presupuesto. Lo que queda puede ir a tus metas. La reserva es un colchón de saldo: no se vuelve a restar cada mes si sigue intacta.',remember:'El perfil de primer empleo combina referencias publicadas y estimaciones identificadas. El dinero es virtual; cada familia tiene necesidades distintas.'},
 {term:'Gastos fijos, variables y anuales',group:'Economía de casa',text:'Los fijos se repiten con cierta estabilidad, como el alquiler. Los variables dependen del consumo, como la electricidad. Los anuales llegan una o pocas veces al año, como algunos seguros.',example:'Un seguro a terceros de referencia de 503,01 € al año equivale a unos 41,92 € al mes (Kelisto, segundo trimestre de 2026).',remember:'En el juego todos se representan como cuotas mensuales equivalentes para que sea fácil aprender. En la vida real el calendario de pago puede ser distinto.'},
 ...EXPENSES.map(x=>({term:x.name,group:'Economía de casa',text:x.text,example:REALITY.expenses[x.id].eur.toLocaleString('es-ES')+' €/mes en el perfil de primer empleo. '+REALITY.expenses[x.id].basis,remember:x.remember+' Tipo de cifra: '+REALITY.expenses[x.id].kind+'. Revisión: '+REALITY.reviewed+'.',source:REALITY.sources[REALITY.expenses[x.id].source]}))
];
