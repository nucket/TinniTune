# Ideas de Desarrollo Futuro — Tinnitune

Este documento recopila propuestas y conceptos de mejora de software para expandir las capacidades clínicas y terapéuticas de **Tinnitune** en fases posteriores de desarrollo.

---

## 📋 Listado de Propuestas

### 1. Ecualizador Adaptativo basado en Audiometría (Hearing Test)
*   **Concepto**: Muchos usuarios con tinnitus tienen pérdida de audición en rangos de frecuencia específicos (usualmente agudos). La aplicación puede compensar esta pérdida adaptando la música o el ruido de fondo.
*   **Implementación**:
    *   Diseñar una interfaz de prueba de audición interactiva (audiograma) donde la app emita tonos puros a frecuencias específicas (250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz) en el oído izquierdo y derecho por separado.
    *   El usuario reduce o aumenta el volumen hasta el umbral en que apenas escucha el tono.
    *   Guardar la curva de audibilidad resultante en `localStorage`.
    *   Crear una cadena de nodos `BiquadFilterNode` de tipo *peaking* o *shelving* en Web Audio API para amplificar o atenuar de forma dinámica las frecuencias críticas en los sonidos ambientales (Lluvia, Olas, Viento) según el perfil del usuario.
*   **Beneficio Clínico**: Restaura el equilibrio del espectro de sonido natural que percibe el cerebro, reduciendo la necesidad de subir el volumen general de la app.

### 2. Registro Diario y Monitoreo de Síntomas (Tinnitus Tracker / Diary)
*   **Concepto**: Permitir que los usuarios realicen un seguimiento de su condición a lo largo del tiempo para identificar patrones o mejoras subjetivas asociadas al uso de la terapia sonora.
*   **Implementación**:
    *   Añadir un formulario sencillo diario para registrar la molestia y el volumen percibido del tinnitus (escala de 1 a 10), horas y calidad del sueño, y nivel de estrés diario.
    *   Registrar automáticamente qué presets o tipos de sonido se escucharon ese día y durante cuánto tiempo.
    *   Almacenar el historial de forma local.
    *   Crear un panel gráfico usando un elemento `<canvas>` interactivo nativo (o una librería ligera) que dibuje la evolución de los síntomas semana a semana o mes a mes.
*   **Beneficio Clínico**: Facilita la observación de progresos (habituación) y proporciona un registro objetivo útil para visitas al audiólogo u otorrinolaringólogo.

### 3. Enmascaramiento por Intervalos (Pulsed / Interval Masking)
*   **Concepto**: El cerebro tiende a ignorar (habituarse a) ruidos de fondo continuos y constantes. Estimulaciones sonoras intermitentes obligan al cerebro a procesar la diferencia, acelerando la relajación frente al tinnitus.
*   **Implementación**:
    *   Añadir un modo de "Ruido Pulsante" para los sonidos ambientales o el enmascarador clínico.
    *   El usuario configura la duración del ciclo (ej. 10 segundos de sonido suave y 5 segundos de silencio absoluto, o desvanecimientos cíclicos tipo respiración).
    *   Implementar esto usando un `GainNode` automatizado con LFOs de formas de onda no senoidales o mediante rampas de ganancia programadas en Web Audio API (`gainNode.gain.setValueCurveAtTime`).
*   **Beneficio Clínico**: Rompe la habituación monótona del estímulo de enmascaramiento y ayuda a desviar la atención consciente del zumbido interno de forma más activa.

### 4. Integración de Bucles de Audio Orgánicos (High-Quality Loops)
*   **Concepto**: Si bien el viento, la lluvia y las olas sintetizadas con ruido son interactivas y consumen cero ancho de banda, la riqueza espectral de sonidos orgánicos reales grabados en estéreo resulta más relajante y natural para el oído humano.
*   **Implementación**:
    *   Incorporar archivos de audio comprimidos en bucle (archivos `.mp3` u `.ogg` optimizados de corta duración) alojados en el servidor (ej. "Noche de verano con grillos", "Hoguera crepitante", "Canto de pájaros de bosque").
    *   Cargar las pistas usando `MediaElementAudioSourceNode` o `AudioBufferSourceNode` en Web Audio API para conectarlas directamente a la cadena del filtro Notch.
    *   Mantener el mezclador responsivo permitiendo combinar estos sonidos orgánicos con la síntesis actual.
*   **Beneficio Clínico**: Aumenta el nivel de inmersión y relajación acústica, mejorando la adherencia diaria del usuario al tratamiento acústico.
