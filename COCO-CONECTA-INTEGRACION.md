# Conecta colores · integración v160122

Integrado en el catálogo nativo web/PWA, acceso compartible, clasificación por juego y general, puntuación balanced-v1, perfil cognitivo e informe familiar, racha diaria, identidad visual y misiones del catálogo.

Cada partida diaria consta de tres tableros según dificultad. Se registra una partida por usuario/juego/día con el RPC existente. Factor 1.02, máximo 110 puntos; las pistas y los intentos inválidos reducen el rendimiento. El iframe no recibe credenciales y el anfitrión valida origen, ventana emisora y estado activo antes de registrar el resultado.

La migración supabase-coco-conecta-v160122.sql conserva la normalización histórica del ranking y la firma del RPC anterior. El catálogo usa activo_desde para no exigir el nuevo juego en rachas históricas. La nueva lectura del ranking es SECURITY DEFINER intencional, accesible solo a authenticated y filtrada por auth.uid(), con search_path vacío; la vista subyacente sigue privada.

Validación: 8 pruebas de puntuación equilibrada; 12 misiones / 36 tableros con el motor real en VM; pista y avance con un toque; rechazo de mensajes ajenos y duplicados; sintaxis JS; diff sin errores; revisión visual del tablero. Prueba transaccional revertida en Supabase: guardado de 110 puntos, ambos rankings, rechazo de duplicados y puntuación inválida. No quedan cuentas ni partidas de prueba. La sesión autenticada real del usuario no se utilizó en estas pruebas.

Despliegue: aplicar migración y publicar archivos en main. Service worker coco-en-forma-v160.100.22-conecta. Acceso /?juego=conecta y /juego/conecta/.
