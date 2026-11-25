# Documentación del Proyecto: Juego 3D Three.js

Proyecto desarrollado con **Three.js**, **Node.js (Express)** y **Socket.io** siguiendo una estructura didáctica, limpia y fácil de entender.

---

## 📋 Cumplimiento de la Rúbrica de Evaluación

| Requisito | A Evaluar | Puntos | Estado | Dónde se encuentra |
| :--- | :--- | :---: | :---: | :--- |
| **REQ 1** | Ejercicios realizados en clase (Mínimo 4) | **30** | **Cumple (100%)** | Uso de primitivas básicas (`PlaneGeometry`, `BoxGeometry`, `SphereGeometry`), `SpotLight`, `AmbientLight`, `PerspectiveCamera` y bucle `requestAnimationFrame`. |
| **REQ 2** | Pantalla de menú inicial, configuraciones, puntuaciones y menú de pausa | **8** | **Cumple (100%)** | Los 4 menús implementados con HTML/CSS claro: `#menu-inicio`, `#menu-config`, `#menu-puntuaciones`, y `#menu-pausa`. |
| **REQ 3** | Detección y uso de colisiones, al menos iluminación ambiental e iluminación focal | **4** | **Cumple (100%)** | Colisiones con `THREE.Box3().intersectsBox()`. Iluminación ambiental con `THREE.AmbientLight` e iluminación focal con `THREE.SpotLight` que enfoca al jugador. |
| **REQ 4** | Al menos 2 niveles de dificultad sin ser el tiempo una variante entre estos | **10** | **Cumple (100%)** | Nivel **Fácil** y **Difícil**. El tiempo dura exactamente **30 segundos** en ambos. Varía la velocidad de los obstáculos y la cantidad de vidas. |
| **REQ 5** | Al menos 3 escenarios totalmente distintos | **10** | **Cumple (100%)** | 1. **Pradera de Día** (Cielo azul, pasto verde, luz blanca).<br>2. **Ciudad de Noche** (Cielo oscuro, asfalto gris, luz nocturna azulada).<br>3. **Volcán de Lava** (Cielo rojizo, suelo de lava naranja, luz cálida). |
| **REQ 6** | Al menos 2 modos de juego distintos | **10** | **Cumple (100%)** | 1. **Modo Esquivar**: Los cubos rojos quitan vidas y otorgan puntos al esquivarlos.<br>2. **Modo Monedas**: Las esferas doradas suman puntos al recogerlas. |
| **REQ 7** | Desarrollar y consumir un servicio web, uso de servicios sociales | **4** | **Cumple (100%)** | **Servicio Web REST**: `GET /api/puntuaciones` y `POST /api/puntuaciones` consumido mediante `fetch()`.<br>**Servicios Sociales**: Botones para compartir puntaje en **WhatsApp** y **Twitter/X**. |

---

## 🚀 Cómo Ejecutar el Proyecto

1. Abrir terminal en la carpeta del proyecto:
   ```bash
   cd gcw52
   ```
2. Iniciar el servidor:
   ```bash
   node servidor.js
   ```
3. Abrir en el navegador:
   `http://localhost:3000`
