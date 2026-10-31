# Equipo interdisciplinario de Coco: preparado, todavía sin activar

`eterna-worker/src/eneagrama-team.js` contiene un orquestador ejecutable con un adaptador de modelo inyectado. **Ningún endpoint lo invoca actualmente y no se ha hecho ninguna llamada real de IA.** Los informes contextuales disponibles se elaboran mediante reglas. Instalar roles o habilidades no equivale a ejecutar diez análisis de modelo por cliente.

## Diez roles y una síntesis

| Rol | Aporte y alcance |
| --- | --- |
| Psicometría | Cobertura, contradicciones y límites de medición; no certifica el test. |
| Eneagrama | Tendencias descriptivas e hipótesis contrastables, sin identidad fija ni causalidad. |
| Coaching organizacional | Acuerdos y conversaciones cuando la persona elige trabajo o liderazgo. |
| Coaching ontológico | Hechos, interpretaciones, necesidades y peticiones. |
| Aprendizaje escolar | Práctica, comprensión y ayuda cuando el ámbito elegido es el colegio. |
| Aprendizaje universitario | Organización y estrategias cuando la persona elige universidad, sin inferirlo por edad. |
| Vínculos | Escucha y acuerdos en el vínculo declarado, sin diagnosticar a terceros. |
| Hábitos | Acciones pequeñas ajustadas a tiempo, recursos y apoyos. |
| Planificación | Pasos posibles y seguimiento durante siete días. |
| Calidad | Revisa los nueve aportes, sus referencias y contradicciones antes de aprobar una síntesis. |

Los primeros nueve reciben los mismos datos y no ven los aportes de otros roles. Se ejecutan con concurrencia máxima de tres. Después se ejecuta calidad y, solo si aprueba, una síntesis: **máximo once invocaciones, sin reintentos en este módulo**. Un ámbito no elegido produce una revisión «no aplicable», sin inventar un trabajo, estudios o vínculo. Son roles de IA; no representan profesionales acreditados ni respaldos de personas o instituciones.

## Contrato

```js
const outcome = await runEnneagramTeam(
  {result, answers, context, age},
  {run, enabled: false, timeoutMs: 18000, signal: request.signal}
);
// {status:'disabled'} | {status:'unavailable'} |
// {status:'ready', report, reviews}
```

`run({role, system, messages, maxTokens, signal})` debe crearse en el servidor, por petición, usando el usuario autenticado y un proveedor con presupuesto aplicado. Nunca debe provenir del cliente ni recibir `env` completo. Debe ejecutar una sola inferencia, deshabilitar herramientas, reintentos y cambios automáticos de proveedor, respetar la cancelación y devolver JSON puro como objeto o cadena. Este módulo no impide que un adaptador mal implementado haga llamadas adicionales: esa obligación debe probarse en la integración.

Las puntuaciones se recalculan desde las respuestas; `result` no se considera fuente fiable. Se envían el tramo de edad y los ítems respondidos, sin alias, correo de cuenta, fecha de nacimiento, fecha de generación ni identificadores internos. El contexto se normaliza y solo admite `focus`, `goal`, `obstacle`, `scene`, `success`, `minutes`. Se omiten campos vacíos. Correos, enlaces, fechas numéricas y algunos teléfonos en texto libre se redactan; **esto no garantiza anonimización**, porque pueden quedar nombres u otros datos identificativos escritos por la persona.

Cada hallazgo y recomendación cita referencias de una lista cerrada: `q:<id>` para respuestas, `score:<id>` para puntuaciones descriptivas y `context:<campo>` para contexto realmente aportado. El contenido de respuestas, contexto y revisiones se delimita como datos, nunca como instrucciones. No se guardan casos, ni se reutilizan resultados entre clientes ni se registran mensajes del modelo en este módulo.

El informe final contiene:

```js
{
  summary, hypothesis, alternative,
  questions: [question1, question2],
  priorities: [
    {title, why, action, observe}, // exactamente tres prioridades
    {title, why, action, observe},
    {title, why, action, observe}
  ],
  sourceNote,
  evidence: {
    summary: [refs], hypothesis: [refs], alternative: [refs],
    questions: [[refs], [refs]],
    priorities: [
      {why: [refs], action: [refs], observe: [refs]},
      {why: [refs], action: [refs], observe: [refs]},
      {why: [refs], action: [refs], observe: [refs]}
    ]
  }
}
```

Las longitudes, claves, tipos, cantidades y referencias se verifican antes de devolver `ready`. `sourceNote` es un texto fijo que explica el carácter orientativo. Se rechazan algunas afirmaciones clínicas explícitas, HTML, claves desconocidas, duplicados exactos, respuestas excesivas y evidencia inexistente. **Esto verifica estructura y trazabilidad; no demuestra que una interpretación esté apoyada por la referencia citada, sea correcta o carezca de sesgo.** Las instrucciones y el revisor de calidad tampoco garantizan ausencia de inyección ni validan psicométricamente el instrumento. Hace falta evaluación humana con casos representativos, incluyendo menores, contradicciones y texto adversarial.

Un fallo, rechazo de calidad, cancelación o respuesta inválida devuelve únicamente `unavailable`: no se entrega un informe parcial ni se finge ejecución completa. El endpoint deberá usar entonces el informe contextual de reglas y comunicar correctamente su origen. El plazo común predeterminado es 18 segundos, configurable hasta 60; terminar la espera no revierte una inferencia ya facturada si el proveedor no permite cancelarla.

## Requisitos pendientes antes de activar

1. **Bandera y autorización.** Añadir `COCO_ENEAGRAMA_TEAM_ENABLED=false` al entorno y mantenerla apagada hasta autorizar expresamente el coste y la publicación. Este módulo exige `enabled === true` y un adaptador; no lee variables del entorno. No publicar desde esta preparación.
2. **Presupuesto por usuario.** La ruta actual de Eneagrama recibe `env` sin `withAiMonthlyBudget`. Enlazar el adaptador al usuario autenticado y al presupuesto mensual existente de 2 €, sin excepción para cuentas máster. Añadir un tope por informe y pruebas concurrentes. La reserva mensual es atómica; no debe duplicarse al reservar también un informe. Las tarifas almacenadas en código y el límite contable no garantizan por sí solos el importe de la factura del proveedor.
3. **Acceso, reserva e idempotencia antes del gasto.** El endpoint actual crea el PDF antes de reclamar el crédito. No insertar inferencias allí: una solicitud sin crédito, dos clics concurrentes o un reintento podrían gastar de nuevo. Definir una reserva de generación atómica vinculada a usuario, ejecución, respuestas, contexto y versión; decidir cómo recuperar el mismo resultado, reintentar un fallo y liberar o consumir un crédito. Cambiar el contexto cambia el análisis: su tratamiento debe ser explícito, sin reutilizar resultados ajenos ni permitir gasto ilimitado.
4. **Consentimiento informado.** Explicar antes de generar qué datos se envían al proveedor y con qué finalidad; recoger la aceptación necesaria y adaptar el recorrido de menores. No asumir que aceptar una compra autoriza un tratamiento de contexto libre que antes no existía.
5. **Transporte y coherencia.** Hoy el endpoint responde PDF y el cliente agota la espera a los 25 segundos. Definir un transporte capaz de entregar el mismo informe validado a pantalla y PDF, con cancelación y estado de generación. Medir latencia antes de elegir un plazo mayor o trabajo asíncrono; no prometer que once llamadas caben en la petición actual.
6. **Privacidad y retención.** Resolver cuánto dura cualquier resultado reservado o idempotente, quién puede recuperarlo y cómo se elimina. Verificar la política real del proveedor. Evitar registrar prompts, respuestas o excepciones con datos personales; mantener separadas métricas de uso y contenido. No incorporar estos informes al historial general de conversaciones sin una decisión explícita.
7. **Proveedor y coste real.** Existe `env.AI` de Cloudflare. Reutilizarlo no elimina el coste. La configuración global permite fallback OpenAI y `structured()` reintenta; no usarla sin un adaptador específico que cumpla este contrato. El módulo pide hasta 650 tokens por revisión inicial, 900 para calidad y 1.800 para síntesis: 8.550 tokens de salida máximos solicitados, además de once entradas y posibles costes de razonamiento según el modelo. Confirmar modelo, precios vigentes, tratamiento de tokens, cancelación y latencia antes de presupuestar; no se verificaron consumos reales ni calidad del modelo mediante estas pruebas.

## Verificación realizada

`node --test eterna-worker/test/eneagrama-team.test.mjs`: catorce pruebas con adaptadores simulados. Comprueban orden y aislamiento de revisiones, once llamadas máximas, bandera apagada, evidencia canónica, minimización de datos, ámbitos no aplicables, JSON estricto, límites, referencias inválidas, fallos, cancelación, plazo común y ausencia de reutilización entre casos. No se llamó a ningún modelo, no hubo gastos y no se cambió producción. Estas pruebas no son una validación psicométrica ni una evaluación clínica o semántica del informe.
