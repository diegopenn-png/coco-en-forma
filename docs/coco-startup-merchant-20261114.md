# Coco: arranque y datos estructurados — 14 noviembre 2026

Base: `44f921d9d3a5a72eeae2c4452447faf06fea55d1`, repositorio canónico
`diegopenn-png/coco-en-forma`, publicación web por GitHub Pages.

Encargo: revisar el aviso no crítico de fichas de comerciantes de Search Console
y la demora de carga de Coco, manteniendo contenido, aspecto, pagos y progreso.

## Cambios preparados

- HTML inicial: 5.019.029 → 838.577 bytes (−83,3 %). Compresión gzip local:
  1.641.874 → 223.188 bytes (−86,4 %). Son tamaños del documento, no una medida
  del tiempo de carga en el iPhone ni del total de recursos.
- Las 4.500 preguntas originales de Coco Med se extraen sin cambios a
  `assets/data/coco-med-cda16aea8bb4.json`. Se descargan al abrir Coco Med,
  conservan las ampliaciones existentes, se reutilizan en la sesión y admiten
  tiempo máximo de espera y reintento. El banco no se precarga al instalar la PWA;
  su primera apertura requiere conexión, al igual que su perfil en la nube.
- Dos PNG antes incrustados en HTML se conservan byte a byte como archivos
  independientes en `assets/legacy-home`, con carga diferida. No se generan ni
  rediseñan imágenes, logotipos o miniaturas.
- La lectura inicial de ajustes y sesión ocurre en paralelo después de procesar
  la recuperación de cuenta, con los mismos límites de espera y permisos.
- La instalación de caché conserva los recursos CORE, elimina duplicados,
  prioriza index.html y limita a cuatro las descargas simultáneas. Versión:
  `coco-en-forma-v160.100.65-startup-light`.
- La galería 3D es una colección de 23 productos, no una ficha de un producto
  único. Se conserva `CollectionPage` + `ItemList`, con nombres, descripciones,
  imágenes y enlaces; se elimina el marcado `Product/Offer` anidado de la
  categoría. Catálogo, precios, bolsa y compra no se modifican.
- Regalos mantiene su ficha `Product/Offer`, importe de 120 EUR y añade la marca
  visible «Flores y tarta». No se inventa GTIN, stock, porte ni política comercial.

La elección de marcado para categorías sigue las directrices de Google:
https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
(solo fichas de producto individual o sus variantes son aptas para esas
experiencias comerciales).

## Verificación local

48 comprobaciones aprobadas: sintaxis de los scripts del inicio, contenido
íntegro del banco, carga diferida/reapertura/reintento/cierre de Coco Med,
concurrencia de la caché, acceso sin sesión, recuperación ante red bloqueada,
menú, retorno desde tienda, puntuación, usuario máster, PWA y presentación de
Eterna. Los cambios de versión en los contratos comprueban la nueva caché.

Se usan cuentas ficticias y consultas simuladas. No se ejecutaron pagos,
conversaciones de IA, envíos de correo ni escrituras de datos de clientes.

## Pendientes y límites

- Publicación y comprobación de los archivos y recorridos públicos: pendientes
  al redactar este punto de recuperación; registrar abajo la evidencia final.
- En Regalos siguen sin definirse públicamente tarifas/plazos/zonas de envío,
  condiciones concretas de devolución y disponibilidad para una fecha. La
  consulta previa existente no permite rellenar honestamente esos campos de
  Google. Los avisos opcionales pueden permanecer hasta concretar condiciones.
- Search Console no tiene sesión abierta en el navegador disponible. No se ha
  solicitado validación ni certificado la desaparición de avisos o indexación.
- PWA instalada en el iPhone y entrada con cuenta real no comprobadas.

## Continuación

Publicar mediante PR, esperar comprobaciones, verificar GitHub Pages y
comparar producción con los archivos del commit. Revisar en navegador público
inicio, juegos y regreso desde tienda. No confundir publicación con validación
de Google ni crear políticas comerciales para borrar advertencias.

## Autorización de publicación

La revisión automática rechazó `git push -u origin
fix/coco-startup-merchant-20261114`: exige autorización expresa para publicar
estos cambios. No se ha usado otro canal para eludir el rechazo. Se comprobó
mediante la API de GitHub que el repositorio es público (`private: false`),
aunque el motivo del rechazo lo calificaba como privado.
Diego respondió «Te autorizo» el 14 de noviembre de 2026 a la solicitud expresa
de publicar estos cambios en el repositorio público de Coco y en la web/PWA.
Continuar la publicación autorizada y verificar el resultado en producción.


## Parpadeo inicial: corrección adicional

Diego comunicó que Coco alternaba pantallas antes de estabilizarse. La revisión
mostró que el arranque clásico inserta el acceso o menú mientras todavía se
cargan scripts; premium sustituye los retos, Eterna mueve el acceso al diseño
final y otros módulos añaden identidad, tarjetas e instalación en turnos
posteriores. Se observó la secuencia de estados en el navegador público. La
reducción de bytes anterior no sincronizaba esta presentación.

Se coordina ahora la primera presentación con la resolución inicial de sesión,
DOMContentLoaded, el catálogo, las fuentes (espera acotada) y la estabilidad de
las tarjetas. Se muestra el icono oficial y «Preparando Coco…» hasta tener una
pantalla utilizable. El contenido conserva su geometría mientras se prepara;
no se usa display:none ni visibility:hidden que alterarían la detección del
acceso. Los controles ocultos son inertes y se excluyen de accesibilidad.

El coordinador se retira una sola vez, incluso en recuperación y errores de red;
no vuelve a ocultar juegos ni navegación posterior. Si un recurso queda bloqueado,
se libera la interfaz existente como máximo a los 12 segundos. Esa salida de
seguridad puede mostrar un estado aún incompleto, pero evita una pantalla de
carga permanente. Los juegos completos siguen cargándose al abrirlos.

Pruebas añadidas: estados antiguos intermedios, sesión de retorno, entradas y
fuentes tardías, aviso de instalación, recuperación/reintento, módulo bloqueado,
funcionamiento sin JavaScript y señal de arranque en las pruebas de recuperación.
La matriz visual de CI exige retirada normal del indicador, sin recurrir al
límite de seguridad. Versión de caché: `160.100.66-stable-first-paint`.

Publicación y evidencia final de esta corrección: consultar la PR de la rama
`fix/coco-stable-first-paint-20261114`; al redactar este punto siguen pendientes.
