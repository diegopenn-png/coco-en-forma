# Referencias y firma · versión 2026-10-31-coaching-3

- Firma de presentación solicitada por el propietario: Diego Pennise / Coach Organizacional & Ontológico / Universidad de San Andrés. «Univ» fue aclarado como la misma universidad.
- Aportes de UdeSA, ICF, Kofman, Robbins, Newfield, Beck, Frankl y Rolón documentados en `explora/metodo.html#coaching` y `.github/coco-eneagrama/FUENTES-COACHING.md`. Se especifican materiales consultados y alcance; no se afirma respaldo institucional, lectura íntegra ni atención clínica.
- Informe automático de siete páginas con firma al cierre; texto explícito sobre generación automática y ausencia de revisión individual. Pie editorial breve; límites conservados en método.
- Práctica con hechos/interpretaciones, emoción/cuerpo/valores, acuerdos y resultado observable. Plan semanal orientado por propósito y obstáculos. Se conservan la puntuación y las adaptaciones de menores.
- Validación local: 1163 pruebas del Worker, 12 del motor/informe, UI y revisión visual del PDF. Se comprueba firma en web/PDF y espacio para notas/procedencia de longitud máxima.
- Publicación de esta versión: pendiente de comprobación de los workflows del commit.

---

# Actualización editorial · 31 de octubre de 2026

Versión del informe: `2026-10-31-coaching-2`. Sustituye el formato de 13 páginas descrito en el registro histórico inferior.

- Siete páginas: mapa, lectura personal, ejemplo con creencia/alternativa, ocho áreas sin duplicarlas por tendencia, experimento semanal y referencia breve.
- Modelo compartido web/PDF. Síntesis de dos perspectivas cuando la segunda media es única; los empates no asignan consejos a ámbitos arbitrarios.
- Ejemplos marcados como ilustrativos; no se infieren respuestas individuales ni biografía. Infancia y adolescencia tienen consignas distintas y no reciben tipo dominante.
- Agente editorial reutilizable separado del motor determinista de descarga. No se añaden llamadas de IA ni pagos por generación.
- Pruebas locales: puntuación y PDF, todos los focos individuales, empates, edades 6/11/12/17/18/99, reflexiones largas, UI, navegación y compartir. Muestras públicas ficticias; informes personales fuera del repositorio.
- La publicación se ha verificado mediante CI y el campo `eneagrama_report_version` de salud; evidencia registrada a continuación.

## Publicación verificada · 31 de octubre de 2026

La actualización se publicó tras la autorización del usuario. Commit funcional: `d35952352f47d25c8b82fc0f9d7948da9dcf1de9`.

- [Despliegue y verificación del generador](https://github.com/diegopenn-png/coco-en-forma/actions/runs/41190938230): correcto. Worker `609de7c8-25d8-468e-8ce0-e89db88f322a` al 100%; salud de producción con versión de informe `2026-10-31-coaching-2`, autenticación y Stripe configurados.
- [Publicación web](https://github.com/diegopenn-png/coco-en-forma/actions/runs/41190937716), [cuestionario y PDF](https://github.com/diegopenn-png/coco-en-forma/actions/runs/41190938248) y [web/PWA](https://github.com/diegopenn-png/coco-en-forma/actions/runs/41190938131): correctos.
- CI: 1163 pruebas del Worker y 10 pruebas de motor e informe aprobadas, sin fallos.
- Navegador de producción: la entrada de https://cocoenforma.com/explora/ muestra «MUESTRA FICTICIA · 7 PÁGINAS», recomendaciones en ocho áreas y plan de siete días.
- No se efectuó una compra ni se probó un nuevo recorrido autenticado real durante esta publicación. La validación de descarga y autorización combina las pruebas automatizadas y las comprobaciones del despliegue.

---

# Coco Eneagrama · verificación del 31 de octubre de 2026

## Resultado y alcance

Versión funcional: `c0973bd6613863465bc2baef9be0d108d218bc26`.
Producción: https://cocoenforma.com/explora/ y Worker `coco-eterna-v159`.
PWA: `coco-en-forma-v160.100.40-coaching-navigation`.

- Acceso máster gratuito mediante un derecho de cuenta gestionado por el servidor. Conserva el rol de jugador del perfil; no se concede mediante correo, metadatos o respuestas enviados por el cliente. La cuenta solicitada se resolvió contra Auth de forma privada.
- Precio de clientes sin cambios: un pago de 15 EUR por evaluación con informe. No se realizó ningún pago durante esta revisión.
- Guías originales de reflexión para las nueve tendencias, ocho áreas de vida y plan de siete días. Lenguaje y ejemplos para infancia (6–11), adolescencia (12–17) y adultos (18–99). Los menores no reciben un tipo dominante. Las adaptaciones no constituyen baremos ni validación.
- PDF real de 13 páginas; las notas pueden actualizar el mismo informe sin gastar otra evaluación. La interpretación de adultos compara hasta tres tendencias próximas; los perfiles amplios no fuerzan una elección.
- Volver y Menú principal en las cuatro páginas de Eneagrama. Volver desde el informe permite revisar una copia de las respuestas y regresar al mismo PDF. Controles fijos durante la lectura y protección frente a salir con respuestas pendientes.

## Evidencia observada

- Base de datos de producción: la cuenta solicitada devuelve `master: true` y `claim_report: {ok:true,master:true}` sin generar una orden de pago. Cuenta inexistente: falso. El rol authenticated no puede escribir los derechos máster ni ejecutar el RPC privado.
- Pruebas de Worker: 1163 aprobadas. Pruebas específicas de pagos, edades, comparación, omisiones, navegación, preservación de respuestas, revisión del informe y PDF aprobadas. Los ensayos de UI y autorización HTTP usan sesiones simuladas; no se inició sesión como el usuario en el navegador de revisión.
- Navegador: entrada pública, formulario de acceso, Volver y Menú principal comprobados en el sitio publicado. Guía compartida del informe revisada en contenedores de 390 y 440 px: sin desbordamiento horizontal y navegación visible al desplazarse. Adaptación adolescente e infantil revisada mediante muestras ficticias identificadas.
- Navegación de otros juegos: contenedores de Arcade, Pádel, Runner, Diferencias, Coco Med y juegos nativos comprobados con sus callbacks; cuatro pruebas existentes de Coco Bank aprobadas. Los recorridos completos autenticados de todos los juegos no se representan como probados manualmente.
- PDF de ejemplo publicado: HTTP 200, `application/pdf`, 321226 bytes, 13 páginas y SHA-256 idéntico al archivo del repositorio. PDF renderizado y revisado; casos infantiles, adolescentes, adultos, empates y notas largas incluidos en comprobaciones de maquetación.
- GitHub Actions en la versión funcional: Pages 41178430727, cuestionario/PDF/UI 41178430859, web/PWA 41178431205 y despliegue Worker 41178430969, todos correctos. El fallo anterior del cierre de JSDOM se corrigió desconectando los observadores del ensayo; la repetición pasó.

## Continuidad

Sin bloqueos de publicación. No se han eludido presupuestos de IA: este informe se genera de forma determinista. Si una sesión mantiene la pantalla anterior, recargar permite adoptar la versión de PWA publicada. Cualquier incidencia de acceso posterior debe comprobar primero la cuenta autenticada y el RPC de derechos, sin promover globalmente un perfil infantil ni cobrar al máster.
