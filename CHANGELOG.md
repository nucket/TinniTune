# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [SemVer (Direccionamiento de Versiones Semánticas)](https://semver.org/lang/es/).

---

## [0.3.0] - 2026-06-24

### Añadido
*   **Temporizador de Apagado (Sleep Timer)**: Botones interactivos para programar el fin de la sesión (15, 30, 45 o 60 minutos) con un indicador en tiempo real (`MM:SS`) del tiempo restante.
*   **Desvanecimiento Gradual (Fade Out)**: Atenuación suave y progresiva del volumen general de audio de la aplicación durante los últimos 60 segundos del temporizador.
*   **Auto-Restauración de Nivel**: El volumen de la UI y del motor de audio se restablecen a su estado inicial de forma segura después de apagar el sonido al expirar el tiempo.
*   **Carpeta `Docs/`**: Creación del directorio y adición del documento [ideas_desarrollo_futuro.md](file:///n:/Person/Project/024-Tinning/Test001/Docs/ideas_desarrollo_futuro.md) para registrar los conceptos y propuestas de mejora clínica del tinnitus (audiogramas, diario de seguimiento, masking por intervalos y bucles de audio orgánicos).

### Cambiado
*   **Comportamiento de Inicio del Motor**: Se sincronizó el motor de audio (`initAudio()`) para que, al encenderlo, lea y aplique de inmediato los niveles de volumen configurados en los sliders ambientales de la UI, en lugar de iniciar silenciado por defecto.
*   Documentación del archivo [README.md](file:///n:/Person/Project/024-Tinning/Test001/README.md) para reflejar las nuevas características y la estructura de directorios.

---

## [0.2.0] - 2026-06-24

### Añadido
*   **Gestor de Presets en Sesión**: Módulo de guardado y carga de configuraciones mediante persistencia local en el navegador (`localStorage`).
*   **Guardado Completo de Ajustes**: Serialización del tipo de onda, frecuencias de tinnitus (coarse y fine), estado y valores de modulación (trémolo LFO), balance y volumen estéreo, volúmenes de los soundscapes y tipo de ruido de enmascaramiento activo junto con el filtro Notch.
*   **Carga Caliente en Ejecución**: Implementación de actualización en tiempo real de nodos Web Audio API en caso de cargar un preset con el sintetizador encendido, recalculando frecuencias y ganancias fluidamente.
*   **Interfaz de Presets**: Barra de entrada de texto neon y listado interactivo con scrollbar personalizado e iconos SVG para la eliminación de presets.

---

## [0.1.0] - 2026-06-24

### Añadido
*   **Lanzamiento Inicial**: Estructura base de la aplicación de terapia de sonido **Tinnitune** en HTML5, CSS3 y JavaScript nativo.
*   **Sintetizador de Tinnitus**: Generador de tono puro (sine), ruido de banda estrecha (narrowband) y ruidos clínicos de banda ancha (blanco y rosa) con control de paneo estéreo y LFO (Trémolo) para modulación de pulsos.
*   **Mezclador Terapéutico**: Generador dinámico de paisajes sonoros de relajación (Lluvia, Viento y Olas de Océano) y ruidos clínicos de enmascaramiento (Blanco, Rosa, Marrón).
*   **Filtro Notch de Audio**: Filtro biquad de tipo *notch* (muesca estrecha, Q=12.0) integrado para sustraer la frecuencia de tinnitus del usuario de todos los ruidos de enmascaramiento ambiental.
*   **Terapia de Inhibición Residual (RI)**: Temporizador visual circular con presets (30s, 60s, 120s) para reproducir el estímulo sintonizado.
*   **Experimento de Fase**: Mapeador de interferencia acústica de fase normal (0°) y contrafase (180°) para verificar la cancelación física de ondas sinusoidales.
*   **Visualizador en Tiempo Real**: Canvas integrado con renderizador de barras de espectro (FFT) y osciloscopio de dominio temporal superpuesto.
