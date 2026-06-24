# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.3.0] - 2026-06-24

### Added
*   **Sleep Timer**: Interactive buttons to schedule session duration (15m, 30m, 45m, 60m) with a real-time countdown display (`MM:SS`).
*   **Smooth Volume Fade Out**: Exponentially decays master volume during the last 60 seconds of the timer.
*   **Auto Volume Recovery**: Resets slider and Web Audio gain to original levels after the timer triggers engine shutdown.
*   **Docs/ Folder**: Added [future_development_ideas.md](file:///n:/Person/Project/024-Tinning/Test001/Docs/future_development_ideas.md) detailing clinical sound therapy expansion concepts (audiograms, symptom trackers, pulsed masking, organic loops).

### Changed
*   **Audio Engine Initialization**: Synced `initAudio()` to immediately load current slider values instead of starting muted.
*   **README.md**: Rewritten to document the new features and folder structure.

---

## [0.2.0] - 2026-06-24

### Added
*   **Local Preset Manager**: Save, load, and delete configurations using `localStorage` persistence.
*   **Full State Serialization**: Saves base wave, frequencies, modulation LFOs, stereo balance, volumes, and Notch Filter status.
*   **Hot-swap Reloading**: Dynamic runtime updates of active Web Audio API nodes when loading presets.
*   **Preset UI**: Neon input bar and customized list scrollbar with SVGs for deleting presets.

---

## [0.1.0] - 2026-06-24

### Added
*   **Initial Release**: Core Tinnitune application built with HTML5, CSS3, and native Web Audio API.
*   **Tinnitus Synthesizer**: Pure tone, narrowband noise, white/pink noise, stereo balance, and tremolo LFO modulation.
*   **Therapy Soundscape Mixer**: Rain, waves, forest wind, and clinical masking noises.
*   **Notched Sound Filter**: Custom notch biquad filter (Q=12.0) to subtract tinnitus frequency from background maskers.
*   **Residual Inhibition Timer**: SVG countdown circle with presets (30s, 60s, 120s).
*   **Phase Inversion Experiment**: Mappeable constructive (0°) and destructive (180°) sine wave physical interference demo.
*   **Spectrum Visualizer**: Real-time FFT analyzer canvas overlaid with DOM time-domain wave.
