# Coco Eneagrama · contexto personal y equipo interdisciplinario

31 de octubre de 2026. Versión preparada `2026-10-31-context-4`, pendiente de publicación mediante PR #110. No se ha modificado producción ni se han ejecutado inferencias de pago.

## Comportamiento preparado

- Seis preguntas personales opcionales: ámbito, objetivo, dificultad, situación, cambio deseado y tiempo. No alteran los 54 ítems ni las puntuaciones.
- Colegio y universidad son elecciones explícitas; no se deducen de la edad. Menores sin roles adultos ni eneatipo dominante.
- Cinco páginas con contexto: mapa, diagnóstico de situación, tres prioridades, plan de siete días y método/firma. Siete páginas con guía general si se omite el contexto.
- Lectura por reglas declaradas. El texto libre se conserva literalmente y se escapa en la web; no se presenta como interpretación libre de IA.
- Muestra pública de estudios inventada, sin datos de clientes. Cinco páginas renderizadas e inspeccionadas: texto legible, firma y contenidos sin recortes.
- El mismo cuestionario conserva su huella al actualizar contexto/notas; no se duplica consumo. Contexto, alias y notas no se persisten en el recibo de uso.
- Nueva versión de caché `v160.100.44-personal-context`, con ambos módulos de contexto y expectativa de smoke sincronizada. El marcador de publicación y el workflow del Worker preparan la versión 4; el PR sigue sin fusionar.

## Verificación

- Pruebas del motor, coaching y contexto aprobadas; 440 combinaciones de PDF contextual con campos al máximo y edades 6, 17, 18 y 99, además de las regresiones anteriores.
- Regresión añadida para evitar destacar la primera tendencia en un empate.
- UI completa: contexto opcional, compatibilidad de opciones por edad/ámbito, conservación al volver, peticiones JSON, actualización de reflexión y borrado. Navegación y compartir aprobados.
- Backend de pago: ocho pruebas aprobadas, incluido contexto sin alterar puntuación, privacidad del recibo y huella estable para nueva descarga.
- Suite general del Worker: 1.176 de 1.177 pruebas pasaron inicialmente; la única discrepancia era la expectativa literal de caché. Se actualizó junto con el release y las once pruebas del contrato de cliente pasaron. El nuevo caso del backend también pasó después.
- Orquestación de agentes: catorce pruebas aprobadas con proveedor simulado. Máximo once llamadas, referencias existentes, cancelación, rechazo de JSON inválido, ausencia de resultados parciales o reutilización entre clientes.
- Navegador: formulario y portada sin desbordamiento horizontal en anchos de contenido de 375 y 305 píxeles. Muestra interactiva de estudios comprobada en vista completa. Una página temporal de QA omitía el campo de fecha esperado por el montaje; se corrigió la página de prueba. No era un fallo de la pantalla real del cuestionario, cubierta por su prueba de integración.

## Estado de los diez agentes

El módulo ejecutable existe, pero ningún endpoint lo invoca. No hay diez inferencias automáticas por cliente ni un estudio de validación psicométrica. La integración necesita presupuesto, reserva de crédito anterior al gasto, idempotencia, consentimiento y transporte común de resultados. Requisitos concretos en `.github/coco-eneagrama/EQUIPO-IA.md`.
