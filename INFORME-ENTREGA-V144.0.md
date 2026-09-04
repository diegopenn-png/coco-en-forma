# Coco en Forma v144.0 — Informe de entrega

Fecha de preparación: 15 de agosto de 2026  
Base exclusiva: v143.0  
Estado: **paquete local para pruebas; no publicado ni desplegado**

## Resumen

La v144.0 conserva la identidad de Coco en Forma y añade una capa modular sobre la base v143.0. La copia original v143.0 se mantiene separada, congelada y sin modificaciones. La nueva versión no contiene publicidad, compras, monedas, cofres, recompensas aleatorias ni llamadas a la urgencia.

## Cambios principales

### Juego de Inglés

- Retirado del catálogo principal y del catálogo de acceso.
- Retirado de clasificaciones, límites diarios, rutas, iconos, estilos y lógica interna.
- Retirado del service worker y de su precaché.
- No se borran resultados históricos existentes en la base de datos.
- Coco Corre ocupa su posición visual sin heredar sus puntuaciones.

### Coco Corre — Misión Cerebro

- Runner 2.5D original de tres carriles, con perspectiva, profundidad, parallax y controles táctiles/teclado.
- Coco V2 mantiene cerebro visible, mono azul de mecánico y herramientas; el recurso original no se sobrescribe.
- Tres niveles con duraciones finitas de 132, 162 y 198 segundos.
- Tres tramos cognitivos: atención selectiva, memoria de trabajo y control inhibitorio/flexibilidad.
- Saltar, agacharse, cambiar de carril, pausar y reanudar.
- Las colisiones son suaves y nunca terminan bruscamente la misión.
- Guarda únicamente evolución personal en `coco_runner_history` y respaldo local.
- Límite de una misión diaria.
- No escribe en `partidas`, no llama a `registrar_partida_coco` y no aparece en ninguna clasificación.

### Coco Pádel

La navegación principal tiene exactamente:

1. Nuevo mixing.
2. Campeonatos.
3. Jugadores.

El sistema asigna un identificador interno y un código público correlativo permanente (`CP-0001`, `CP-0002`, etc.). Dos personas pueden compartir nombre y se distinguen por su código. Los códigos desactivados no se reutilizan.

Las estadísticas se calculan siempre desde los resultados guardados; no existen contadores acumulativos irreversibles. Corregir o eliminar un marcador recalcula clasificaciones e historiales sin duplicar puntos. Cada partido conserva el nombre, código y nivel que tenía el jugador en ese momento.

Los campeonatos admiten fechas ilimitadas, puntuación por games o por victoria/empate/derrota, criterios de desempate, edición, archivo, clasificación acumulada y revisión manual de niveles al finalizar. La ficha de jugador permite búsqueda por nombre, código y nivel, además de filtros históricos por campeonato y periodo.

Coco Pádel continúa siendo **ilimitado** y reutiliza la persistencia existente `coco_padel_club_state`, con respaldo local y migración de estados locales anteriores.

### Encuentra las diferencias

- Diez escenarios y tres variantes por escenario: 30 combinaciones por nivel.
- Objetivos de 4, 5 y 6 diferencias para básico, intermedio y avanzado.
- Seis clases de cambio: orientación, color, objeto ausente, tamaño, posición y forma/detalle.
- Luminosidad 1,15, contraste 1,06 y saturación 1,06 aplicados al renderizado.
- La misma definición normalizada crea la modificación visual y la región pulsable.
- Todas las zonas funcionan desde ambas imágenes y cada hallazgo se contabiliza una sola vez.
- Los clics fuera de una diferencia se registran como fallo y nunca como acierto.

### Contenido y antirrepetición

- Catorce juegos o módulos auditados en tres niveles.
- Mínimo garantizado de 20 identificadores estables por juego y nivel.
- Bolsa barajada por usuario, juego y nivel, persistencia remota cuando está disponible y respaldo local.
- Se evita la repetición inmediata al reiniciar una bolsa agotada.
- Se añadieron 29 palabras verificadas, 31 entradas de crucigrama, 36 afirmaciones explicadas y 12 temas de memoria.
- “Ampliar respuesta” sigue siendo exclusivo y opcional de Coco Med.

## Datos y migraciones

`supabase-coco-v144.sql` es una migración aditiva. Solo crea `public.coco_runner_history`, su índice, restricciones y políticas RLS para que cada usuario autenticado lea e inserte únicamente sus resultados. No modifica ni borra `partidas`, perfiles, clasificaciones o datos de Coco Pádel.

`supabase-coco-v144-rollback.sql` elimina exclusivamente la tabla nueva del runner. Su ejecución borra ese historial personal y solo debe usarse si se decide revertir la migración.

## Confirmaciones

- La base v143.0 permanece intacta como copia separada.
- La v144.0 no se ha publicado, desplegado ni sustituido en la aplicación pública.
- Coco Corre no modifica la clasificación general ni tiene clasificación propia.
- Coco Pádel continúa siendo ilimitado.
- El juego de Inglés no aparece en el paquete funcional, rutas ni caché.
- El build de producción y la validación del artefacto finalizan correctamente.
- Los 19 scripts internos pasan validación sintáctica.
- Los recursos declarados por la PWA existen en el paquete; no se detectaron referencias de precaché faltantes.
- La suite funcional incluida termina con 15/15 pruebas superadas.

## Aceptación antes de publicar

La entrega debe probarse en un origen local aislado siguiendo `LEEME-RESPALDO-Y-PRUEBA-V144.0.txt`. No debe subirse a producción hasta que la persona responsable confirme expresamente la aceptación.

