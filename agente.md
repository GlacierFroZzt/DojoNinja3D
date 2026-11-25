# Memoria Técnica del Proyecto (agente.md)

## Decisiones Arquitectónicas y Estructura
- **Renderizado 3D**: Three.js integrado en [index.html](file:///d:/gcw52/gcw52/index.html).
- **Generación de Recursos / Texturas**: Scripts en Node.js como [crear_texturas.js](file:///d:/gcw52/gcw52/crear_texturas.js) que generan imágenes PNG directamente con patrones procedurales.
- **Creación del Suelo del Escenario**:
  - Geometría: `THREE.PlaneGeometry(20, 140)`.
  - Material: `THREE.MeshStandardMaterial` con textura procedural `dojo_floor.png` configurada con `RepeatWrapping` y repetición `(6, 40)`.
  - Orientación y posición: Rotación en X de `-Math.PI / 2`, posición en `(0, 0, -35)`, habilitando `receiveShadow = true`.

## Sistema de HUD y Puntuación
- **HUD Simplificado y Limpio**: Barra compacta superior con indicador de 3 vidas (barras de vida) a la izquierda y contador monoespaciado de puntaje (`PUNTOS: 0`) a la derecha.
- **Sistema de Vidas y Hitboxes**:
  - **Hitbox 3D**: Verificación volumétrica contra el jugador local ($|\Delta x| < 1.1$, $|\Delta y| < 1.4$, $|\Delta z| < 0.7$). Tiene en cuenta la altura de salto del ninja para saltar por encima de los shurikens rasantes o pasar por debajo de los altos.
  - **3 Vidas**: Al ser impactado pierde 1 vida, la pantalla destella en rojo brevemente y se activa 1 segundo de invulnerabilidad con parpadeo visual.
  - **Game Over**: Al perder las 3 vidas aparece una pantalla de Game Over con resumen del puntaje y botón de reintento directo.
- **Mecánica de Puntuación**:
  - **Esquive normal**: `+10 pts` al esquivar con éxito.
  - **Esquive cercano (Near Miss)**: `+50 pts` si el shuriken pasó a una distancia horizontal $\le 1.8$ unidades, con texto corto *"CERCA +50"*.
  - **Parry Perfecto con Katana**: `+150 pts` al cortar el shuriken justo antes del impacto frontal usando `F`, `E`, `J` o `Clic Izquierdo`, con texto corto *"PARRY +150"*.

## Ajustes de Dinámica y Escenario
- **Escenario más angosto**: Ancho del dojo reducido de 20 a 10 unidades (`anchoPista = 10`), con límites laterales del jugador en $[-4.2, 4.2]$ y carriles concentrados en `[-4, -2.5, -1, 0, 1, 2.5, 4]`.
- **Grosor del Shuriken**: Duplicado en el eje Z (`scale.set(1.2, 1.2, 2.4)`) para mayor presencia tridimensional y visibilidad en pantalla.
- **Velocidad y Oleada de Shurikens**:
  - Tasa de spawn de **550 ms** con probabilidad del 45% de oleada doble en carriles distintos.
  - Velocidad a **36 unidades/s**.
  - Pool de shurikens de 40 entidades.
- **Replicación y Simulación en Vivo**:
  - Si un jugador abre el menú de pausa, el mundo, el cronómetro y los shurikens continúan avanzando en tiempo real para todos, evitando desincronizaciones entre pantallas.
  - Los stats (`puntos` y `vidas`) se sincronizan por socket (`playerStatsUpdate` / `playerStatsChanged`).
- **Sistema de Salas y Límite de 1 Minuto**:
  - **Crear Sala**: Genera un código único alfanumérico de 4 caracteres (ej. `ABCD`).
  - **Lobby de Espera Interactivo**:
    - Al crear o unirse a una sala privada, no entran directo a la pista, sino a una pantalla de **Lobby de Espera**.
    - Muestra el código de la sala en grande para compartir, la lista de ninjas conectados en tiempo real con indicador y quién es el anfitrión.
    - El **Anfitrión** tiene el botón verde exclusivo `¡Iniciar Partida!` para lanzar la partida simultáneamente para todos los que estén en el lobby. Los invitados ven un estado de espera hasta que el anfitrión comience.
  - **Unirse a Sala**: Modal interactivo para escribir el código y conectarse con amigos en el lobby.
  - **Temporizador de 60 Segundos**: Controlado por el servidor de forma equitativa. Al llegar a cero se dispara `matchEnded` con la pantalla de ranking final.
