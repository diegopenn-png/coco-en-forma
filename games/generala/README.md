# Coco Generala

Juego de dados de Coco en Forma, disponible en `/games/generala/` y con guía pública y vista previa social en `/juego/generala/`.

## Modos y reglas

- Contra Coco (heurística local, sin llamadas a IA), práctica individual, 2–6 personas en un dispositivo y salas privadas online de 2–6 cuentas.
- Cinco dados, hasta tres tiradas por turno, dados reservables y once casillas. Elegir una casilla confirma el resultado; un cero requiere confirmación explícita.
- Números: suma de los dados del valor elegido. Escalera 12345 o 23456: 20; full 3+2: 30; póker de al menos cuatro: 40. Estas tres combinaciones suman 5 si se consiguen en la primera tirada.
- Generala: 50; doble: 100 solo después de una generala anotada de 50. La generala servida gana inmediatamente si se activa esa regla antes de iniciar. Los empates por puntos comparten victoria.
- La partida local y las estadísticas se guardan en este navegador. No se escriben puntos ni posiciones en la clasificación general de Coco.
- En móvil, Dados y Mi planilla son dos vistas de la misma partida. Se abre la planilla tras la tercera tirada; se puede anotar antes con «Elegir dónde anotar».

## Online

`supabase-coco-generala.sql` crea una tabla independiente con RLS: solo participantes autenticados pueden leer sus salas. Las escrituras directas del cliente están revocadas. `supabase/functions/coco-generala` valida la sesión en cada petición y aplica el motor compartido del lado servidor. El servidor genera los dados, calcula los puntos, controla anfitrión, turnos, capacidad, caducidad y versiones para rechazar acciones repetidas o concurrentes.

Las salas se actualizan mediante Realtime y son sondeadas como respaldo. Una cuenta puede retomar sus salas desde otro dispositivo. Los enlaces de invitación llevan un código aleatorio; el listado no expone salas ajenas. Los tiempos agotados se resuelven en el servidor cuando un participante conectado solicita resolver el turno vencido, sin tareas de pago adicionales.

Despliegue del 2 de noviembre de 2026: migración `coco_generala_private_six_player_rooms` y función `coco-generala` en el proyecto existente Coco V2. `verify_jwt=false` permite que el handler compruebe el token con `auth.getUser`, siguiendo el patrón de Coco Ciudad; no significa acceso anónimo.

## PWA y catálogo

La tarjeta se inserta después de Coco Ciudad en ambos catálogos. Se conserva como entrada independiente, sin el atributo de los retos diarios que activa la barrera de acceso y puntuación. Comparte ilustración, tipografía Montserrat, botones de copia y estética con Coco. El Service Worker `coco-en-forma-v160.100.56-generala` incorpora el juego y sus recursos; ofrece el documento correcto también cuando se abre offline la ruta sin barra final.

La ilustración fue generada para este juego a partir de la identidad visual de Coco Ciudad (mascota completa, mesa de dados, violeta y dorado). El título de la tarjeta se compone con la tipografía del repositorio mediante `scripts/build-generala-card.py`; no está pintado en la imagen base.

## Verificación

```sh
node --test qa/generala.test.mjs qa/generala-online.test.mjs qa/generala-integration.test.mjs
npm install --prefix /tmp/coco-generala-qa --ignore-scripts --no-audit --no-fund jsdom@26.1.0
COCO_JSDOM_PATH=/tmp/coco-generala-qa/node_modules/jsdom node qa/generala-ui.test.cjs
COCO_JSDOM_PATH=/tmp/coco-generala-qa/node_modules/jsdom node qa/generala-catalogue.test.cjs
COCO_JSDOM_PATH=/tmp/coco-generala-qa/node_modules/jsdom node --test qa/game-landings.test.mjs
```

Pruebas: las 7.776 combinaciones de dados, partidas completas de 1/2/6 personas, 100 partidas del bot, turnos y puntuaciones, carreras de versión, permisos, capacidad, partida guardada, planilla móvil, copia y catálogo. Revisión visual e interacción en navegador con anchos de 320, 390 y 430 px, sin desbordamiento horizontal.

La prueba live `qa/generala-online-live.py` se ejecutó con siete cuentas sintéticas aisladas: seis participantes admitidos, séptimo excluido, seis turnos completos, ocho tiradas del servidor, catorce estados exactos de Realtime y reanudación de la sexta cuenta. Se verificó rechazo de lecturas ajenas, escrituras directas, turnos indebidos, cuarta tirada, versiones antiguas y puntos/dados enviados por el cliente. Al finalizar se canceló la sala y se bloquearon las siete cuentas; se confirmó que quedaban cero sesiones y cero tokens de refresco. Las credenciales de prueba no forman parte del repositorio.
