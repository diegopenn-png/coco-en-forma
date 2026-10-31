// EUR amounts, independently of the historical CB API (1 CB = 10 EUR).
export const REALITY = {
 id:'es-graduate-shared-2026-10', reviewed:'22 de octubre de 2026', country:'España',
 title:'Primer empleo · piso compartido', salary:1600, grossAnnual:24000, reserve:200, initial:100,
 context:'Una persona recién graduada, sin hijos, comparte vivienda y tiene un coche ya pagado. Las cifras son referencias españolas; no representan una ciudad concreta.',
 salaryNote:'24.000 € brutos anuales y 1.600 € netos al mes en 12 pagas son supuestos del ejercicio. El neto real depende de retenciones y circunstancias personales. No se presenta como salario medio oficial de 2026.',
 sources:{
 salary:{name:'Ministerio de Ciencia · SIIU 2025/26',date:'Cohorte 2018–2019; primer año tras graduarse (2020)',url:'https://www.ciencia.gob.es/dam/jcr:747444d8-7089-4b15-97e1-0fc27874e6a7/DatosCifras_SUE2025_2026.pdf',text:'Base media anual de cotización: 22.868 €, para graduados asalariados a jornada completa, tabla 12.7.1. Es una aproximación al bruto, no al sueldo neto ni un dato de 2026.'},
 rent:{name:'idealista · alquiler de larga estancia',date:'Anuncios de junio de 2026; publicado 22/09/2026',url:'https://www.idealista.com/sala-de-prensa/notas-de-prensa/2026/09/22/267837-alquilar-solo-en-espana-sale-caro-de-los-425-euros-de-una-habitacion-a-los',text:'Media de precios anunciados en España: habitación 425 €/mes; apartamento de un dormitorio 984 €/mes. Son ofertas, no rentas de todos los contratos existentes.'},
 car:{name:'Kelisto · índice del seguro de coche',date:'Segundo trimestre de 2026',url:'https://www.kelisto.es/seguros-coche/consejos-y-analisis/indice-seguros-coche-kelisto',text:'Terceros: 503,01 €/año; equivalencia redondeada 41,92 €/mes. Basado en unas 23.000 tarificaciones mensuales, no en todas las pólizas contratadas. Un conductor joven puede pagar bastante más.'},
 telecom:{name:'CNMC · Panel de Hogares',date:'Cuarto trimestre de 2025; publicado 19/06/2026',url:'https://cnmc.es/prensa/panel-hogares-teleco-20260619',text:'Paquete de telefonía fija y móvil y banda ancha fija y móvil: 38,30 €/mes por hogar. Los 20 € personales del ejercicio son un reparto estimado, no esa media.'},
 food:{name:'INE · Presupuestos Familiares',date:'Año 2025; publicado 25/06/2026',url:'https://www.ine.es/dyngs/Prensa/EPF2025.htm',text:'Alimentos y bebidas no alcohólicas: 5.626 €/año por hogar. No es gasto de una sola persona. Presupuestamos 230 €/mes para comida y compra básica personal como estimación.'}
 },
 expenses:{
 rent:{eur:425,kind:'Media publicada',source:'rent',basis:'Una habitación en piso compartido. Vivir solo en un apartamento de un dormitorio: referencia 984 €/mes, 559 € más antes de suministros.'},
 electricity:{eur:25,kind:'Estimación',basis:'Tu parte de una factura compartida de 50 €/mes entre dos personas. Varía con consumo, tarifa y estación.'},
 water:{eur:12,kind:'Estimación',basis:'Tu parte de una factura compartida de 24 €/mes entre dos. Incluye una previsión de cuotas fijas.'},
 gas:{eur:15,kind:'Estimación',basis:'180 €/año por persona para gas y calefacción, repartidos entre 12 meses. No duplicar calefacción eléctrica.'},
 community:{eur:0,kind:'No corresponde',basis:'En este contrato ficticio lo asume el propietario. Si toca pagarlo, ejemplo orientativo: 70 €/mes por vivienda, no media nacional.'},
 home_insurance:{eur:10,kind:'Estimación',basis:'120 €/año para un seguro de inquilino. Coberturas, capital asegurado y vivienda cambian el precio.'},
 communications:{eur:20,kind:'Estimación',source:'telecom',basis:'Móvil y participación en internet compartido. Referencia CNMC: paquete de hogar 38,30 €/mes, cuarto trimestre de 2025.'},
 home_maintenance:{eur:15,kind:'Estimación',basis:'180 €/año para pequeñas reparaciones y reposiciones. En el juego se paga una cuota equivalente mensual.'},
 home_taxes:{eur:0,kind:'No corresponde',basis:'En este ejercicio las tasas y el IBI van a cargo del propietario. Ejemplo si corresponde: 420 €/año = 35 €/mes; no es una media.'},
 fuel:{eur:64,kind:'Estimación',basis:'800 km/mes × 5 litros/100 km × 1,60 €/litro = 64 €. Distancia, consumo y precio son supuestos editables, no cotización actual.'},
 car_insurance:{eur:41.92,kind:'Media prorrateada',source:'car',basis:'Seguro a terceros: 503,01 €/año ÷ 12 ≈ 41,92 €/mes. Referencia de cotizaciones de Kelisto, segundo trimestre de 2026. La edad y el historial cambian la prima.'},
 car_maintenance:{eur:40,kind:'Estimación',basis:'480 €/año para taller, neumáticos e ITV, distribuidos por meses. Un coche antiguo puede necesitar más.'},
 car_taxes:{eur:10,kind:'Estimación',basis:'120 €/año de impuesto municipal del vehículo. Ejemplo: la tarifa real depende del municipio y del coche.'},
 transport:{eur:20,kind:'Estimación',basis:'Trayectos ocasionales en transporte público o aparcamiento. No presupone un abono concreto.'},
 car_loan:{eur:0,kind:'No corresponde',basis:'El coche ya está pagado. Si se financia, ejemplo: 180 €/mes; habría que añadir entrada, intereses y plazo según contrato.'},
 food:{eur:230,kind:'Estimación',source:'food',basis:'Comida y compra básica para una persona. Son unos 53 € por semana. La media del INE es por hogar, no por joven independiente.'},
 school:{eur:0,kind:'No corresponde',basis:'Esta persona no tiene hijos. Ejemplo familiar: 150 €/mes para comedor y actividades, según centro y uso; la enseñanza privada se presupuestaría aparte. No es una media.'},
 school_material:{eur:0,kind:'No corresponde',basis:'Sin hijos en edad escolar. Ejemplo si los hubiera: 300 €/curso ÷ 12 = 25 €/mes de material, cifra ilustrativa.'},
 health_insurance:{eur:0,kind:'Opcional no contratado',basis:'Sin seguro sanitario privado en este perfil. Ejemplo para añadirlo: 60 €/mes; no es una media ni oferta y depende de edad, coberturas y copagos.'},
 health:{eur:20,kind:'Estimación',basis:'240 €/año para farmacia, dentista o gafas. No representa el coste del sistema sanitario público.'},
 clothing:{eur:30,kind:'Estimación',basis:'360 €/año para ropa y calzado, repartidos por meses.'},
 leisure:{eur:80,kind:'Estimación',basis:'Salidas, deporte y comidas fuera: un límite personal de unos 18,50 € por semana.'},
 subscriptions:{eur:15,kind:'Estimación',basis:'Servicios digitales de pago con un límite conjunto de 15 €/mes.'},
 care:{eur:0,kind:'No corresponde',basis:'Sin personas dependientes ni mascotas en este perfil. Ejemplo de mascota: 40 €/mes más una reserva veterinaria; no es una media.'},
 other_debt:{eur:0,kind:'No corresponde',basis:'Sin otros préstamos. Si los hay, se añade la cuota del contrato sin duplicar la hipoteca o el coche.'}
 }
};
export const realExpensesCB=()=>Object.fromEntries(Object.entries(REALITY.expenses).map(([id,x])=>[id,x.eur/10]));
export const REALITY_LESSONS=[
 {term:'Mi primer sueldo: bruto y neto',group:'Economía de casa',text:'Bruto es el sueldo antes de cotizaciones y retenciones. Neto es lo que llega a la cuenta. El presupuesto del mes se organiza con el neto.',example:REALITY.salaryNote,remember:REALITY.sources.salary.text,source:REALITY.sources.salary},
 {term:'Un presupuesto con precios reales',group:'Economía de casa',text:REALITY.context,example:'La habitación usa una media de anuncios; el seguro, una media de cotizaciones. Los consumos personales son estimaciones explicadas. Un importe a cero significa que ese gasto no corresponde a este perfil.',remember:'Compara siempre la fecha, el lugar y el tipo de hogar. En el juego el dinero es virtual. Revisión: '+REALITY.reviewed+'.'},
 {term:'Compartir piso o vivir solo',group:'Economía de casa',text:'La vivienda cambia mucho el dinero que queda para otras cosas. Compartir permite repartir algunos costes; vivir solo exige pagarlos completos.',example:'425 € por una habitación frente a 984 € por un apartamento de un dormitorio: 559 € más de alquiler mensual. Además cambiarían los suministros.',remember:REALITY.sources.rent.text,source:REALITY.sources.rent}
];

// UI accepts euros; keep the established engine API in CB to preserve old accounts.
export function fromEuroAction(input){
 const a=structuredClone(input),convert=(obj,keys)=>{for(const key of keys)if(obj[key]!==undefined)obj[key]=Number(obj[key])/10};
 if(a.type==='setup'){convert(a.config,['salary','initial','reserve','goalAmount','reward','house','car','other']);for(const id of Object.keys(a.config.expenses||{}))a.config.expenses[id]=Number(a.config.expenses[id])/10;}
 if(a.type==='budget'){convert(a,['reserve']);for(const id of Object.keys(a.expenses||{}))a.expenses[id]=Number(a.expenses[id])/10;}
 if(a.config&&['challenge','challenge_save','challenge_update'].includes(a.type))convert(a.config,['goalAmount']);
 if(['employer','buy','deposit','save','unsave'].includes(a.type))convert(a,['amount']);
 return a;
}
