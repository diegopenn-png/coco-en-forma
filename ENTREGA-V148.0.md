# Coco en Forma v148.0 — entrega de prueba

## Resultado

La v148.0 incorpora un modo de pruebas ilimitadas para la cuenta autenticada cuyo correo es exactamente `diegopenn@icloud.com`.

- Esa cuenta puede iniciar y repetir todos los juegos sin límite diario.
- Todas las demás cuentas mantienen el límite de una partida por juego y día.
- Coco Pádel continúa siendo ilimitado para todos, como herramienta de organización.
- No se ha publicado, desplegado ni sustituido la aplicación pública.
- La v147.0 original permanece intacta como respaldo en `coco-v148/base-v1470`.

## Protección de la clasificación

El modo ilimitado sirve para probar los juegos, no para alterar las clasificaciones:

- El primer resultado válido de cada juego y día se guarda normalmente.
- Las repeticiones posteriores se completan como partidas de prueba y no duplican puntos.
- En Coco Med, la primera actividad válida del día actualiza el progreso; las repeticiones no vuelven a sumar exámenes, aciertos ni clasificación.
- Una partida abandonada continúa sin puntuar.
- La interfaz informa cuándo una repetición es un resultado de prueba.

## Cobertura

La excepción se aplica en una única política diaria compartida por:

- Juegos clásicos: Une los números, Cálculo veloz, Descifra la palabra, Series lógicas, Memoria, Sudoku y Sopa de letras.
- Juegos profesionales: Crucigrama, Reto tiempo, Verdadero o falso, Fútbol y los demás retos activos conectados al servicio común.
- Coco Corre — Misión Cerebro.
- Encuentra las diferencias.
- Coco Med.
- Las tarjetas, accesos rápidos, modales, cierres de partida y restauración de la PWA.

## Implementación

- La cuenta se reconoce por el correo de la sesión autenticada, normalizado sin distinguir mayúsculas y minúsculas.
- También se exige que el identificador consultado coincida con el usuario autenticado activo.
- La lista autorizada contiene una sola cuenta.
- Los demás usuarios siguen usando la misma verificación local y en Supabase de una partida por juego y día.
- No fue necesaria ninguna migración de base de datos.
- El service worker usa la caché `coco-en-forma-v148.0.0-r1` para impedir que la PWA conserve código anterior.

## Validación

- 22/22 pruebas funcionales superadas.
- 5/5 pruebas específicas de la cuenta ilimitada superadas en navegador.
- 14/14 pruebas completas de navegador y regresión superadas.
- Sintaxis correcta en los módulos JavaScript y en los 19 scripts integrados de `index.html`.
- Manifiestos JSON válidos.
- Sin errores JavaScript, peticiones 404 ni rutas locales ausentes en las pruebas.

Consulta `PRUEBAS-V148.0.md` para el detalle y `LEEME-RESPALDO-Y-PRUEBA-V148.0.txt` para probarla sin tocar la aplicación pública.
