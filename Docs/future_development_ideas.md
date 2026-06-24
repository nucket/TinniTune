# Future Development Ideas — Tinnitune

This document compiles proposals and software concepts to expand Tinnitune's clinical and therapeutic capabilities in future development phases.

---

## 📋 List of Proposals

### 1. Adaptive Equalizer based on Audiometry (Hearing Test)
*   **Concept**: Many users with tinnitus have hearing loss in specific frequency ranges (usually high-pitch). The application can compensate for this loss by adapting music or background noise.
*   **Implementation**:
    *   Design a quick, interactive hearing test interface (audiogram) where the app plays pure tones at specific frequencies (250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz) in the left and right ears independently.
    *   The user reduces or increases the volume until they reach the threshold where they can barely hear the tone.
    *   Save the resulting threshold curve in `localStorage`.
    *   Create a chain of `BiquadFilterNode` peaking or shelving filters in Web Audio API to dynamically boost or attenuate critical frequencies in ambient sounds (Rain, Waves, Wind) based on the user's audiometric profile.
*   **Clinical Benefit**: Restores the balance of the natural sound spectrum perceived by the brain, reducing the need to increase the application's overall master volume.

### 2. Daily Symptom Tracking (Tinnitus Tracker / Diary)
*   **Concept**: Allow users to log their condition daily to identify patterns, triggers, or subjective improvements associated with sound therapy.
*   **Implementation**:
    *   Add a simple daily form to record perceived tinnitus severity and loudness (scale 1 to 10), sleep hours/quality, and daily stress levels.
    *   Automatically record which presets or sound types were played and for how long.
    *   Store the history locally in `localStorage`.
    *   Create an interactive chart using a canvas element (or a lightweight library) to visualize symptom trends week-over-week or month-over-month.
*   **Clinical Benefit**: Facilitates monitoring habituation progress and provides objective records useful for consultations with audiologists or ENT specialists.

### 3. Interval / Pulsed Masking (Pulsed Sound Therapy)
*   **Concept**: The brain tends to ignore continuous, constant background noise. Intermittent sound stimulation forces the brain to process the contrast between sound and silence, speeding up relaxation.
*   **Implementation**:
    *   Add a "Pulsed Noise" mode for ambient sounds or clinical maskers.
    *   The user configures cycle durations (e.g., 10 seconds of soft sound followed by 5 seconds of silence, or cyclic breathing-like fade transitions).
    *   Implement this using automated `GainNode` adjustments via Web Audio API gain curves (`gainNode.gain.setValueCurveAtTime`).
*   **Clinical Benefit**: Breaks the monotony of continuous masking stimuli and helps active conscious distraction from the internal ringing.

### 4. Organic Audio Loops Integration
*   **Concept**: While mathematically synthesized rain and waves are lightweight and interactive, the spectral richness of real organic sounds recorded in stereo is often more relaxing and natural to the human ear.
*   **Implementation**:
    *   Incorporate compressed audio loops (.mp3 or .ogg) hosted on the server (e.g., "Summer night with crickets", "Creaking campfire", "Forest birds singing").
    *   Load the tracks using `MediaElementAudioSourceNode` or `AudioBufferSourceNode` in Web Audio API and route them through the Notch Filter.
    *   Keep the mixer responsive by combining these organic sounds with synthesized ones.
*   **Clinical Benefit**: Increases the level of immersion and acoustic relaxation, improving the user's daily adherence to sound therapy.
