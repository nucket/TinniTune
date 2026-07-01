// ==========================================================================
// TINNITUNE - AUDIO ENGINE AND USER INTERACTION (VANILLA JS)
// ==========================================================================

// Global state variables
let audioCtx = null;
let masterGain = null;
let analyser = null;

// Tinnitus Synthesizer Node References
let tinnitusOsc = null;
let tinnitusNoiseSource = null;
let tinnitusFilter = null; // for narrowband noise
let tinnitusModLfo = null;
let tinnitusModGain = null;
let tinnitusModLfoGain = null;
let tinnitusVolumeNode = null;
let tinnitusPanner = null;
let isTinnitusPlaying = false;

// Masker Node References
let maskerSource = null;
let maskerGain = null;
let activeMaskerType = null; // 'white', 'pink', 'brown' or null

// Soundscape Nodes
let soundscapes = {
    rain: { gain: null, source: null },
    ocean: { gain: null, source: null, lfo: null, lfoGain: null, filter: null },
    wind: { gain: null, source: null, lfo: null, lfoGain: null, filter: null }
};

// Therapy Chain
let therapyNotchFilter = null; // Filter to cut out tinnitus frequency
let isNotchActive = false;

// Local Audio references
let localAudioElement = null;
let localAudioSource = null;

// Sound Buffers (Generated once at audio initialization)
let buffers = {
    white: null,
    pink: null,
    brown: null
};

// Phase Experiment Nodes
let phaseOsc = null;
let phaseGainLeft = null;
let phaseGainRight = null;
let phaseMerger = null;
let isPhaseExpPlaying = false;
let currentPhaseAngle = 0; // 0 or 180

// Residual Inhibition Timer State
let riTimerInterval = null;
let riTimeRemaining = 0;
let riTotalTime = 60; // default 60s
let isRiRunning = false;

// Binaural Beats Node References
let binauralOscLeft = null;
let binauralOscRight = null;
let binauralPanLeft = null;
let binauralPanRight = null;
let binauralVolumeNode = null;
let isBinauralPlaying = false;
let activeBinauralBeat = 10; // default 10Hz (Alpha)

// ASR Modulation State
let activeModulationType = 'tremolo'; // 'tremolo' or 'asr'
let asrIntervalId = null;
let originalTinnitusFreq = null;

// DOM Elements
const btnStartAudio = document.getElementById('btnStartAudio');
const audioStatus = document.getElementById('audioStatus');
const masterVolumeSlider = document.getElementById('masterVolume');
const masterVolumeVal = document.getElementById('masterVolumeVal');

// Matching DOM
const waveTypeButtons = document.querySelectorAll('#waveTypeGrid .btn-select');
const freqCoarseSlider = document.getElementById('freqCoarse');
const freqFineSlider = document.getElementById('freqFine');
const freqVal = document.getElementById('freqVal');
const freqFineVal = document.getElementById('freqFineVal');

const modToggle = document.getElementById('modToggle');
const modRateSlider = document.getElementById('modRate');
const modDepthSlider = document.getElementById('modDepth');
const modRateVal = document.getElementById('modRateVal');
const modDepthVal = document.getElementById('modDepthVal');

const tinnitusBalanceSlider = document.getElementById('tinnitusBalance');
const tinnitusBalanceVal = document.getElementById('tinnitusBalanceVal');
const tinnitusVolumeSlider = document.getElementById('tinnitusVolume');
const tinnitusVolumeVal = document.getElementById('tinnitusVolumeVal');
const btnPlaySynthesizer = document.getElementById('btnPlaySynthesizer');

// Therapy DOM
const notchToggle = document.getElementById('notchToggle');
const notchStatusBadge = document.getElementById('notchStatusBadge');
const notchFreqBadge = document.getElementById('notchFreqBadge');

const volRainSlider = document.getElementById('volRain');
const volOceanSlider = document.getElementById('volOcean');
const volWindSlider = document.getElementById('volWind');
const volRainVal = document.getElementById('volRainVal');
const volOceanVal = document.getElementById('volOceanVal');
const volWindVal = document.getElementById('volWindVal');

const btnMaskWhite = document.getElementById('btnMaskWhite');
const btnMaskPink = document.getElementById('btnMaskPink');
const btnMaskBrown = document.getElementById('btnMaskBrown');
const maskVolumeSlider = document.getElementById('maskVolume');
const maskVolumeVal = document.getElementById('maskVolumeVal');
const btnStopTherapy = document.getElementById('btnStopTherapy');

// Local Music Player DOM
const localAudioFile = document.getElementById('localAudioFile');
const fileNameLabel = document.getElementById('fileNameLabel');
const playerControlsRow = document.getElementById('playerControlsRow');
const btnPlayLocalAudio = document.getElementById('btnPlayLocalAudio');
const localAudioProgress = document.getElementById('localAudioProgress');
const playerCurrentTime = document.getElementById('playerCurrentTime');
const playerTotalTime = document.getElementById('playerTotalTime');

// RI & Phase DOM
const riProgressCircle = document.getElementById('riProgressCircle');
const riTimerVal = document.getElementById('riTimerVal');
const btnStartRI = document.getElementById('btnStartRI');
const riPresetButtons = document.querySelectorAll('.time-presets .btn-preset');

const btnPhaseNormal = document.getElementById('btnPhaseNormal');
const btnPhaseInverted = document.getElementById('btnPhaseInverted');
const waveNormalDiv = document.getElementById('waveNormal');
const waveInvertedDiv = document.getElementById('waveInverted');
const waveRelationText = document.getElementById('waveRelationText');
const phaseEduText = document.getElementById('phaseEduText');

// Binaural Beats DOM
const binauralToggle = document.getElementById('binauralToggle');
const binauralControls = document.getElementById('binauralControls');
const binauralVolumeSlider = document.getElementById('binauralVolume');
const binauralVolumeVal = document.getElementById('binauralVolumeVal');
const btnBinauralDelta = document.getElementById('btnBinauralDelta');
const btnBinauralTheta = document.getElementById('btnBinauralTheta');
const btnBinauralAlpha = document.getElementById('btnBinauralAlpha');
const btnBinauralBeta = document.getElementById('btnBinauralBeta');
const binauralBeatButtons = [btnBinauralDelta, btnBinauralTheta, btnBinauralAlpha, btnBinauralBeta];

// Modulation Mode DOM
const btnModTremolo = document.getElementById('btnModTremolo');
const btnModAsr = document.getElementById('btnModAsr');

// Canvas Visualizer DOM
const canvas = document.getElementById('visualizerCanvas');
const canvasCtx = canvas.getContext('2d');

// Sound synthesis parameters
let activeWaveType = 'sine'; // sine, narrowband, white, pink
let currentTinnitusFrequency = 4000;

// Setup resize for Visualizer Canvas
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================================================
// 1. WEB AUDIO INITIALIZATION & BUFFERS
// ==========================================================================

async function initAudio() {
    if (audioCtx) return;

    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Create Master Gain and Analyser
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(masterVolumeSlider.value, audioCtx.currentTime);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;

    // Connect analyzer to master gain, and master gain to speakers
    analyser.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Create Therapy Notch Filter (placed in the path of Maskers and Soundscapes)
    therapyNotchFilter = audioCtx.createBiquadFilter();
    therapyNotchFilter.type = isNotchActive ? 'notch' : 'allpass';
    therapyNotchFilter.frequency.setValueAtTime(getCombinedFrequency(), audioCtx.currentTime);
    therapyNotchFilter.Q.setValueAtTime(12.0, audioCtx.currentTime); // narrow band cut
    therapyNotchFilter.connect(analyser);

    // Generate static noise buffers to play instantly in loop
    generateNoiseBuffers();

    // Start background soundscapes (initialized to current slider values)
    initSoundscapes();

    // If a masker was active (loaded from preset), start it now
    if (activeMaskerType) {
        const tempType = activeMaskerType;
        activeMaskerType = null; // reset to allow playMaskerNoise to execute
        playMaskerNoise(tempType);
    }

    // Visualizer loop start
    drawVisualizer();

    // Update UI Status
    audioStatus.classList.add('connected');
    audioStatus.querySelector('.status-text').textContent = 'Audio Conectado';
    btnStartAudio.textContent = 'Motor Activo';
    btnStartAudio.disabled = true;
    btnStartAudio.classList.remove('btn-glow');
}

// Generate White, Pink, and Brown Noise buffers
function generateNoiseBuffers() {
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds loop

    // 1. White Noise
    buffers.white = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const whiteData = buffers.white.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        whiteData[i] = Math.random() * 2 - 1;
    }

    // 2. Pink Noise (Voss-McCartney approximation)
    buffers.pink = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const pinkData = buffers.pink.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        pinkData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        pinkData[i] *= 0.11; // normalise to safe range
        b6 = white * 0.115926;
    }

    // 3. Brown Noise (Filtered random walk)
    buffers.brown = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const brownData = buffers.brown.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        brownData[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = brownData[i];
        brownData[i] *= 3.5; // normalise to safe range
    }
}

// Get the actual computed frequency (Coarse slider + Fine sintonization)
function getCombinedFrequency() {
    const coarse = parseFloat(freqCoarseSlider.value);
    const fine = parseFloat(freqFineSlider.value);
    // Bind output range
    return Math.max(20, Math.min(20000, coarse + fine));
}

// Ensure audio context is running (fixes browser resume policies)
async function ensureAudioCtx() {
    if (!audioCtx) {
        await initAudio();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
}

// ==========================================================================
// 2. TINNITUS SYNTHESIZER MODULE
// ==========================================================================

function startTinnitusSynthesizer() {
    if (isTinnitusPlaying) return;
    
    // Safety check
    if (isPhaseExpPlaying) {
        stopPhaseExperiment();
    }

    const freq = getCombinedFrequency();
    const vol = parseFloat(tinnitusVolumeSlider.value);
    const pan = parseFloat(tinnitusBalanceSlider.value);

    // Create Synthesizer Gain
    tinnitusVolumeNode = audioCtx.createGain();
    tinnitusVolumeNode.gain.setValueAtTime(vol, audioCtx.currentTime);

    // Create Modulator (Tremolo) Gain
    tinnitusModGain = audioCtx.createGain();
    tinnitusModGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

    // Create Panner
    if (audioCtx.createStereoPanner) {
        tinnitusPanner = audioCtx.createStereoPanner();
        tinnitusPanner.pan.setValueAtTime(pan, audioCtx.currentTime);
    } else {
        // Fallback panner
        tinnitusPanner = audioCtx.createPanner();
        tinnitusPanner.panningModel = 'HRTF';
        tinnitusPanner.setPosition(pan, 0, 1 - Math.abs(pan));
    }

    // Set up Sound Source based on active selection
    if (activeWaveType === 'sine') {
        // Pure Tone (Sine Oscillator)
        tinnitusOsc = audioCtx.createOscillator();
        tinnitusOsc.type = 'sine';
        tinnitusOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        tinnitusOsc.connect(tinnitusModGain);
        tinnitusOsc.start();
    } else if (activeWaveType === 'narrowband') {
        // Narrowband Noise (White noise filtered with tight bandpass)
        tinnitusNoiseSource = audioCtx.createBufferSource();
        tinnitusNoiseSource.buffer = buffers.white;
        tinnitusNoiseSource.loop = true;

        tinnitusFilter = audioCtx.createBiquadFilter();
        tinnitusFilter.type = 'bandpass';
        tinnitusFilter.frequency.setValueAtTime(freq, audioCtx.currentTime);
        // High Q (35.0) isolates a very narrow band of frequency resembling high whistle
        tinnitusFilter.Q.setValueAtTime(35.0, audioCtx.currentTime);

        tinnitusNoiseSource.connect(tinnitusFilter);
        tinnitusFilter.connect(tinnitusModGain);
        tinnitusNoiseSource.start();
    } else {
        // Broadband Noise (White or Pink)
        tinnitusNoiseSource = audioCtx.createBufferSource();
        tinnitusNoiseSource.buffer = activeWaveType === 'white' ? buffers.white : buffers.pink;
        tinnitusNoiseSource.loop = true;

        tinnitusNoiseSource.connect(tinnitusModGain);
        tinnitusNoiseSource.start();
    }

    // Connect Tremolo LFO if enabled
    if (modToggle.checked) {
        setupTremolo();
    }

    // Chain: Source -> Mod Gain -> Volume -> Stereo Panner -> Output Analyzer
    tinnitusModGain.connect(tinnitusVolumeNode);
    tinnitusVolumeNode.connect(tinnitusPanner);
    tinnitusPanner.connect(analyser);

    isTinnitusPlaying = true;
    btnPlaySynthesizer.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        Detener Sintetizador
    `;
    btnPlaySynthesizer.classList.add('active-playing');
}

function stopTinnitusSynthesizer(fadeOut = false) {
    if (!isTinnitusPlaying) return;

    const stopNodes = () => {
        try {
            if (tinnitusOsc) {
                tinnitusOsc.stop();
                tinnitusOsc.disconnect();
                tinnitusOsc = null;
            }
            if (tinnitusNoiseSource) {
                tinnitusNoiseSource.stop();
                tinnitusNoiseSource.disconnect();
                tinnitusNoiseSource = null;
            }
            if (tinnitusFilter) {
                tinnitusFilter.disconnect();
                tinnitusFilter = null;
            }
            if (tinnitusModLfo) {
                tinnitusModLfo.stop();
                tinnitusModLfo.disconnect();
                tinnitusModLfo = null;
            }
            if (asrIntervalId) {
                clearInterval(asrIntervalId);
                asrIntervalId = null;
            }
            if (tinnitusModGain) {
                tinnitusModGain.disconnect();
                tinnitusModGain = null;
            }
            if (tinnitusModLfoGain) {
                tinnitusModLfoGain.disconnect();
                tinnitusModLfoGain = null;
            }
            if (tinnitusPanner) {
                tinnitusPanner.disconnect();
                tinnitusPanner = null;
            }
            if (tinnitusVolumeNode) {
                tinnitusVolumeNode.disconnect();
                tinnitusVolumeNode = null;
            }
        } catch (e) {
            console.warn('Error stopping nodes:', e);
        }
        isTinnitusPlaying = false;
        btnPlaySynthesizer.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>
            Escuchar Sintonizador
        `;
        btnPlaySynthesizer.classList.remove('active-playing');
    };

    if (fadeOut && tinnitusVolumeNode) {
        // Smooth fade out to protect hearing
        tinnitusVolumeNode.gain.setValueAtTime(tinnitusVolumeNode.gain.value, audioCtx.currentTime);
        tinnitusVolumeNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        setTimeout(stopNodes, 1300);
    } else {
        stopNodes();
    }
}

// Configures and connects the trémolo LFO modulator or ASR scheduler
function setupTremolo() {
    if (!audioCtx || !tinnitusModGain) return;

    // Disconnect old LFO/timers if they exist
    if (tinnitusModLfo) {
        try { tinnitusModLfo.stop(); } catch(e){}
        tinnitusModLfo.disconnect();
        tinnitusModLfo = null;
    }
    if (tinnitusModLfoGain) {
        tinnitusModLfoGain.disconnect();
        tinnitusModLfoGain = null;
    }
    if (asrIntervalId) {
        clearInterval(asrIntervalId);
        asrIntervalId = null;
    }

    const rate = parseFloat(modRateSlider.value);
    const depth = parseFloat(modDepthSlider.value) / 100.0; // 0.0 to 1.0

    if (activeModulationType === 'tremolo') {
        // Restore standard frequency of active nodes in case they were modified by ASR
        updateSynthesizerParams();

        // Mod LFO Node (Sine wave LFO)
        tinnitusModLfo = audioCtx.createOscillator();
        tinnitusModLfo.type = 'sine';
        tinnitusModLfo.frequency.setValueAtTime(rate, audioCtx.currentTime);

        // LFO Gain determines the amplitude of volume swings
        tinnitusModLfoGain = audioCtx.createGain();
        tinnitusModLfoGain.gain.setValueAtTime(depth * 0.5, audioCtx.currentTime);

        // Offset the main modulator gain value to remain balanced
        tinnitusModGain.gain.setValueAtTime(1.0 - (depth * 0.5), audioCtx.currentTime);

        // Connections
        tinnitusModLfo.connect(tinnitusModLfoGain);
        tinnitusModLfoGain.connect(tinnitusModGain.gain); // Modulate target parameter

        tinnitusModLfo.start();
    } else if (activeModulationType === 'asr') {
        // ASR mode: Rhythmic / pseudo-random reset
        tinnitusModGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        
        // Interval function to dynamically alter frequency and volume
        const runAsrTick = () => {
            if (!isTinnitusPlaying) {
                if (asrIntervalId) {
                    clearInterval(asrIntervalId);
                    asrIntervalId = null;
                }
                return;
            }

            const baseFreq = getCombinedFrequency();
            // Maximum deviation is 8% at depth 1.0 (100%)
            const maxDev = baseFreq * 0.08 * depth;
            const randomDev = (Math.random() * 2 - 1) * maxDev;
            const targetFreq = Math.max(20, Math.min(20000, baseFreq + randomDev));

            // Frequency change
            if (tinnitusOsc) {
                tinnitusOsc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
            }
            if (tinnitusFilter) {
                tinnitusFilter.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
            }

            // Volume burst (amplitude modulation)
            // 40% chance of dip in volume to create burst structure
            const targetGain = Math.random() > 0.4 ? 1.0 : Math.max(0.001, 1.0 - depth);
            tinnitusModGain.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + (0.15 / rate));
        };

        // Run immediately
        runAsrTick();
        
        // Set up scheduler
        asrIntervalId = setInterval(runAsrTick, 1000 / rate);
    }
}

// Update active synthesiser parameters dynamically
function updateSynthesizerParams() {
    const freq = getCombinedFrequency();
    
    // Update Frequency of Active Oscillator or Filter
    if (isTinnitusPlaying) {
        if (tinnitusOsc) {
            tinnitusOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        }
        if (tinnitusFilter) {
            tinnitusFilter.frequency.setValueAtTime(freq, audioCtx.currentTime);
        }
    }

    // Update Notch filter target if active
    if (therapyNotchFilter) {
        therapyNotchFilter.frequency.setValueAtTime(freq, audioCtx.currentTime);
        notchFreqBadge.textContent = `Cut: ${Math.round(freq)} Hz`;
    }
}

// ==========================================================================
// 3. ENMASCARAMIENTO & SOUNDSCAPES MODULE (NOTCHED THERAPY)
// ==========================================================================

function initSoundscapes() {
    // Generate nature soundscapes using audio filters and LFOs
    
    // 1. OCEAN WAVES SYNTHESIS
    // Pink noise source -> Lowpass Filter modulated by LFO (creates tide movement)
    soundscapes.ocean.gain = audioCtx.createGain();
    soundscapes.ocean.gain.gain.setValueAtTime(parseFloat(volOceanSlider.value) * 0.5, audioCtx.currentTime);

    soundscapes.ocean.source = audioCtx.createBufferSource();
    soundscapes.ocean.source.buffer = buffers.pink;
    soundscapes.ocean.source.loop = true;

    soundscapes.ocean.filter = audioCtx.createBiquadFilter();
    soundscapes.ocean.filter.type = 'lowpass';
    soundscapes.ocean.filter.frequency.setValueAtTime(400, audioCtx.currentTime);
    soundscapes.ocean.filter.Q.setValueAtTime(1.0, audioCtx.currentTime);

    // LFO to simulate waves (cycle speed: ~8 seconds or 0.12 Hz)
    soundscapes.ocean.lfo = audioCtx.createOscillator();
    soundscapes.ocean.lfo.type = 'sine';
    soundscapes.ocean.lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);

    soundscapes.ocean.lfoGain = audioCtx.createGain();
    soundscapes.ocean.lfoGain.gain.setValueAtTime(250, audioCtx.currentTime); // modulate LP filter by +-250Hz

    // Connect LFO modulator to filter cutoff frequency
    soundscapes.ocean.lfo.connect(soundscapes.ocean.lfoGain);
    soundscapes.ocean.lfoGain.connect(soundscapes.ocean.filter.frequency);

    // Signal path
    soundscapes.ocean.source.connect(soundscapes.ocean.filter);
    soundscapes.ocean.filter.connect(soundscapes.ocean.gain);
    // Connect to Notched Filter
    soundscapes.ocean.gain.connect(therapyNotchFilter);

    // Start waves
    soundscapes.ocean.lfo.start();
    soundscapes.ocean.source.start();

    // 2. RAIN SYNTHESIS
    // Brown noise (rumble) combined with high-pass pink noise (patter)
    soundscapes.rain.gain = audioCtx.createGain();
    soundscapes.rain.gain.gain.setValueAtTime(parseFloat(volRainSlider.value) * 0.5, audioCtx.currentTime);

    soundscapes.rain.source = audioCtx.createBufferSource();
    soundscapes.rain.source.buffer = buffers.brown;
    soundscapes.rain.source.loop = true;

    const rainFilter = audioCtx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(800, audioCtx.currentTime);

    soundscapes.rain.source.connect(rainFilter);
    rainFilter.connect(soundscapes.rain.gain);
    soundscapes.rain.gain.connect(therapyNotchFilter);
    soundscapes.rain.source.start();

    // 3. FOREST WIND SYNTHESIS
    // Pink noise -> bandpass filter modulated by LFO (gusts)
    soundscapes.wind.gain = audioCtx.createGain();
    soundscapes.wind.gain.gain.setValueAtTime(parseFloat(volWindSlider.value) * 0.5, audioCtx.currentTime);

    soundscapes.wind.source = audioCtx.createBufferSource();
    soundscapes.wind.source.buffer = buffers.pink;
    soundscapes.wind.source.loop = true;

    soundscapes.wind.filter = audioCtx.createBiquadFilter();
    soundscapes.wind.filter.type = 'bandpass';
    soundscapes.wind.filter.frequency.setValueAtTime(300, audioCtx.currentTime);
    soundscapes.wind.filter.Q.setValueAtTime(2.5, audioCtx.currentTime);

    soundscapes.wind.lfo = audioCtx.createOscillator();
    soundscapes.wind.lfo.type = 'sine';
    soundscapes.wind.lfo.frequency.setValueAtTime(0.08, audioCtx.currentTime); // very slow gusts

    soundscapes.wind.lfoGain = audioCtx.createGain();
    soundscapes.wind.lfoGain.gain.setValueAtTime(150, audioCtx.currentTime);

    soundscapes.wind.lfo.connect(soundscapes.wind.lfoGain);
    soundscapes.wind.lfoGain.connect(soundscapes.wind.filter.frequency);

    soundscapes.wind.source.connect(soundscapes.wind.filter);
    soundscapes.wind.filter.connect(soundscapes.wind.gain);
    soundscapes.wind.gain.connect(therapyNotchFilter);

    soundscapes.wind.lfo.start();
    soundscapes.wind.source.start();

    // 4. CLINICAL MASKERS INITIALIZATION
    maskerGain = audioCtx.createGain();
    maskerGain.gain.setValueAtTime(parseFloat(maskVolumeSlider.value), audioCtx.currentTime);
    maskerGain.connect(therapyNotchFilter);
}

// Toggle clinically generated masking noise
function playMaskerNoise(type) {
    if (!audioCtx) return;

    // If clicking already playing active type, stop it
    if (activeMaskerType === type) {
        stopMaskerNoise();
        return;
    }

    // Stop current source if running
    if (maskerSource) {
        try { maskerSource.stop(); } catch(e){}
        maskerSource.disconnect();
        maskerSource = null;
    }

    // Create loop source
    maskerSource = audioCtx.createBufferSource();
    if (type === 'white') maskerSource.buffer = buffers.white;
    else if (type === 'pink') maskerSource.buffer = buffers.pink;
    else if (type === 'brown') maskerSource.buffer = buffers.brown;
    
    maskerSource.loop = true;
    maskerSource.connect(maskerGain);
    maskerSource.start();

    activeMaskerType = type;

    // Update UI Buttons
    btnMaskWhite.classList.toggle('active', type === 'white');
    btnMaskPink.classList.toggle('active', type === 'pink');
    btnMaskBrown.classList.toggle('active', type === 'brown');

    // Fade in volume to match slider if it was set
    const vol = parseFloat(maskVolumeSlider.value);
    maskerGain.gain.setValueAtTime(maskerGain.gain.value, audioCtx.currentTime);
    maskerGain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.3);
}

function stopMaskerNoise() {
    if (!maskerGain) return;
    
    maskerGain.gain.setValueAtTime(maskerGain.gain.value, audioCtx.currentTime);
    maskerGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.5);

    setTimeout(() => {
        if (maskerSource && activeMaskerType === null) {
            try { maskerSource.stop(); } catch(e){}
            maskerSource.disconnect();
            maskerSource = null;
        }
    }, 600);

    activeMaskerType = null;
    btnMaskWhite.classList.remove('active');
    btnMaskPink.classList.remove('active');
    btnMaskBrown.classList.remove('active');
}

// Set Notch Filter Mode
function updateNotchFilterState() {
    if (!therapyNotchFilter) return;

    if (isNotchActive) {
        therapyNotchFilter.type = 'notch';
        notchStatusBadge.textContent = 'Filter Active';
        notchStatusBadge.classList.add('active');
        notchFreqBadge.classList.add('active');
        notchFreqBadge.textContent = `Cut: ${Math.round(getCombinedFrequency())} Hz`;
    } else {
        therapyNotchFilter.type = 'allpass'; // Bypass
        notchStatusBadge.textContent = 'Filter Inactive';
        notchStatusBadge.classList.remove('active');
        notchFreqBadge.classList.remove('active');
    }
}

// Silence all therapeutic masking soundscapes
function stopAllTherapy() {
    // Fade out ambient sounds
    const fadeOutSlider = (slider, valElement, gainNode) => {
        slider.value = 0;
        valElement.textContent = '0%';
        if (gainNode) {
            gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
        }
    };

    fadeOutSlider(volRainSlider, volRainVal, soundscapes.rain.gain);
    fadeOutSlider(volOceanSlider, volOceanVal, soundscapes.ocean.gain);
    fadeOutSlider(volWindSlider, volWindVal, soundscapes.wind.gain);
    
    // Stop clinical masker noise
    stopMaskerNoise();
    maskVolumeSlider.value = 0;
    maskVolumeVal.textContent = '0%';

    // Stop Binaural Beats if active
    if (binauralToggle.checked) {
        binauralToggle.checked = false;
        binauralControls.style.display = 'none';
        stopBinauralBeats();
    }

    // Pause Local Audio if it exists and is playing
    pauseLocalAudio();
}

// ==========================================================================
// 4. RESIDUAL INHIBITION MODULE (TIMER CONTROL)
// ==========================================================================

function startResidualInhibition() {
    if (isRiRunning) {
        stopResidualInhibition();
        return;
    }

    ensureAudioCtx().then(() => {
        isRiRunning = true;
        btnStartRI.textContent = 'Stop RI Therapy';
        btnStartRI.classList.add('active');

        // Turn off soundscapes/maskers during testing to focus on tone
        stopAllTherapy();

        // Start matching tone
        // Lock UI parameters or ensure match synthesizer is playing
        if (!isTinnitusPlaying) {
            startTinnitusSynthesizer();
        }

        // Set matching volume slightly higher or match it
        const originalVol = parseFloat(tinnitusVolumeSlider.value);
        tinnitusVolumeNode.gain.setValueAtTime(originalVol, audioCtx.currentTime);

        // Timer initialization
        riTimeRemaining = riTotalTime;
        updateRiProgress();

        riTimerInterval = setInterval(() => {
            riTimeRemaining--;
            updateRiProgress();

            if (riTimeRemaining <= 0) {
                // Done!
                stopResidualInhibition(true);
                alert('Residual Inhibition session completed.\n\nPay attention to your ears: has the ringing silenced or decreased? (This effect usually lasts between 30s and 2m).');
            }
        }, 1000);
    });
}

function stopResidualInhibition(finished = false) {
    if (!isRiRunning) return;

    clearInterval(riTimerInterval);
    riTimerInterval = null;
    isRiRunning = false;
    btnStartRI.textContent = 'Start RI Therapy';
    btnStartRI.classList.remove('active');

    // Reset progress circle
    setProgress(100);
    riTimerVal.textContent = riTotalTime + 's';

    // Stop synthesizer tone (smoothly fade out if completed)
    stopTinnitusSynthesizer(finished);
}

function updateRiProgress() {
    riTimerVal.textContent = riTimeRemaining + 's';
    const pct = (riTimeRemaining / riTotalTime) * 100;
    setProgress(pct);
}

// Progress Ring Controller
function setProgress(percent) {
    // Circumference of our progress ring is 326.7 (calculated from r=52)
    const circumference = 326.7;
    const offset = circumference - (percent / 100 * circumference);
    riProgressCircle.style.strokeDashoffset = offset;
}

// ==========================================================================
// 5. PHASE INVERSION EXPERIMENT MODULE (PHYSICAL ANC DEMO)
// ==========================================================================

function startPhaseExperiment() {
    if (!audioCtx) return;

    if (isTinnitusPlaying) {
        stopTinnitusSynthesizer();
    }

    const freq = getCombinedFrequency();
    const vol = parseFloat(tinnitusVolumeSlider.value);

    // Create single Oscillator
    phaseOsc = audioCtx.createOscillator();
    phaseOsc.type = 'sine';
    phaseOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Split signal: Left vs Right Gains
    phaseGainLeft = audioCtx.createGain();
    phaseGainRight = audioCtx.createGain();

    // Volume level
    phaseGainLeft.gain.setValueAtTime(vol, audioCtx.currentTime);
    
    // Right channel phase control (either in phase: 1.0 or inverted: -1.0)
    const rightGainVal = currentPhaseAngle === 180 ? -vol : vol;
    phaseGainRight.gain.setValueAtTime(rightGainVal, audioCtx.currentTime);

    // Stereo Merger Node
    phaseMerger = audioCtx.createChannelMerger(2);

    // Connect Split Signal
    phaseOsc.connect(phaseGainLeft);
    phaseOsc.connect(phaseGainRight);

    phaseGainLeft.connect(phaseMerger, 0, 0); // connect to Left channel input
    phaseGainRight.connect(phaseMerger, 0, 1); // connect to Right channel input

    // Connect to Master Output Analyser
    phaseMerger.connect(analyser);

    // Start tone
    phaseOsc.start();
    isPhaseExpPlaying = true;
}

function stopPhaseExperiment() {
    if (!isPhaseExpPlaying) return;

    try {
        if (phaseOsc) {
            phaseOsc.stop();
            phaseOsc.disconnect();
            phaseOsc = null;
        }
        if (phaseGainLeft) {
            phaseGainLeft.disconnect();
            phaseGainLeft = null;
        }
        if (phaseGainRight) {
            phaseGainRight.disconnect();
            phaseGainRight = null;
        }
        if (phaseMerger) {
            phaseMerger.disconnect();
            phaseMerger = null;
        }
    } catch(e){}
    
    isPhaseExpPlaying = false;
}

function updatePhaseAngle(angle) {
    currentPhaseAngle = angle;
    
    if (angle === 180) {
        btnPhaseNormal.classList.remove('active');
        btnPhaseInverted.classList.add('active');
        waveInvertedDiv.style.animationDirection = 'reverse';
        waveRelationText.textContent = 'Waves collide out of phase (Destructive Interference)';
        waveRelationText.style.color = 'var(--color-cyan)';
        
        phaseEduText.innerHTML = `
            <strong>Out of Phase (180°):</strong> The right wave is completely inverted. If you use 
            <strong>external speakers</strong>, you will notice the sound level drops significantly as you move or tilt, 
            since physical air vibrations cancel out. If you use <strong>headphones</strong>, there is no mixing in the air, 
            so you will perceive a spatial vacuum effect. Since your tinnitus is subjective (neurological), it will not cancel it.
        `;

        // Update active audio node directly
        if (isPhaseExpPlaying && phaseGainRight) {
            const vol = parseFloat(tinnitusVolumeSlider.value);
            phaseGainRight.gain.setValueAtTime(-vol, audioCtx.currentTime);
        }
    } else {
        btnPhaseNormal.classList.add('active');
        btnPhaseInverted.classList.remove('active');
        waveInvertedDiv.style.animationDirection = 'normal';
        waveRelationText.textContent = 'Waves sum up (Constructive Interference)';
        waveRelationText.style.color = 'var(--color-text-muted)';
        
        phaseEduText.innerHTML = `
            <strong>In Phase (0°):</strong> Both speakers vibrate coordinately in the same direction. 
            The waves sum up acoustically, doubling the physical air pressure in the ear canal. 
            The sound will be perceived as centered and clear, right midway between both ears.
        `;

        // Update active audio node directly
        if (isPhaseExpPlaying && phaseGainRight) {
            const vol = parseFloat(tinnitusVolumeSlider.value);
            phaseGainRight.gain.setValueAtTime(vol, audioCtx.currentTime);
        }
    }
}

// ==========================================================================
// 6. REAL-TIME CANVAS VISUALIZER
// ==========================================================================

function drawVisualizer() {
    if (!audioCtx) return;

    requestAnimationFrame(drawVisualizer);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgba(4, 7, 13, 0.4)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // Draw frequency bars with gradient
        const percent = barHeight / 255;
        const red = Math.round(162 - (156 * percent));
        const green = Math.round(28 + (170 * percent));
        const blue = Math.round(243 - (16 * percent));

        canvasCtx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        
        // Dynamic round-topped bars
        const h = percent * (canvas.height - 15);
        canvasCtx.beginPath();
        if (canvasCtx.roundRect) {
            canvasCtx.roundRect(x, canvas.height - h, barWidth - 1, h, [3, 3, 0, 0]);
        } else {
            canvasCtx.rect(x, canvas.height - h, barWidth - 1, h);
        }
        canvasCtx.fill();

        x += barWidth;
    }

    // Add a glowing digital line representation on top
    analyser.getByteTimeDomainData(dataArray);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgba(6, 198, 227, 0.5)';
    canvasCtx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let xDomain = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (canvas.height / 2);

        if (i === 0) {
            canvasCtx.moveTo(xDomain, y);
        } else {
            canvasCtx.lineTo(xDomain, y);
        }

        xDomain += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

// ==========================================================================
// 7. EVENT BINDING & INTERFACE HANDLERS
// ==========================================================================

// Global Interaction Trigger
btnStartAudio.addEventListener('click', () => {
    ensureAudioCtx();
});

// Master Volume Handler
masterVolumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    masterVolumeVal.textContent = Math.round(val * 100) + '%';
    if (masterGain) {
        masterGain.gain.setValueAtTime(val, audioCtx.currentTime);
    }
});

// Synthesizer Wave Selection
waveTypeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const button = e.currentTarget;
        waveTypeButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');

        activeWaveType = button.getAttribute('data-type');

        // If playing, reset synthesis nodes on the fly to change sound source
        if (isTinnitusPlaying) {
            stopTinnitusSynthesizer();
            startTinnitusSynthesizer();
        }
    });
});

// Frequency controls (Logarithmic Coarse)
freqCoarseSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    
    // Display human readable format
    if (val >= 1000) {
        freqVal.textContent = (val / 1000).toFixed(2) + ' kHz';
    } else {
        freqVal.textContent = val + ' Hz';
    }

    updateSynthesizerParams();
});

// Fine Frequency tuning
freqFineSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    freqFineVal.textContent = (val > 0 ? '+' : '') + val + ' Hz';
    
    updateSynthesizerParams();
});

// Modulation Toggle
modToggle.addEventListener('change', (e) => {
    if (isTinnitusPlaying) {
        if (e.target.checked) {
            setupTremolo();
        } else {
            // Disconnect mod LFO and set gain back to default
            if (tinnitusModLfo) {
                tinnitusModLfo.stop();
                tinnitusModLfo.disconnect();
                tinnitusModLfo = null;
            }
            if (tinnitusModGain) {
                tinnitusModGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
            }
        }
    }
});

modRateSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    modRateVal.textContent = val.toFixed(1) + ' Hz';
    if (isTinnitusPlaying && modToggle.checked) {
        setupTremolo();
    }
});

modDepthSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    modDepthVal.textContent = val + '%';
    if (isTinnitusPlaying && modToggle.checked) {
        setupTremolo();
    }
});

// Balance Panner Slider
tinnitusBalanceSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    
    // Text output
    if (val === -1) tinnitusBalanceVal.textContent = 'Left Ear Only';
    else if (val === 1) tinnitusBalanceVal.textContent = 'Right Ear Only';
    else if (val === 0) tinnitusBalanceVal.textContent = 'Center';
    else if (val < 0) tinnitusBalanceVal.textContent = `Left (${Math.round(Math.abs(val)*100)}%)`;
    else tinnitusBalanceVal.textContent = `Right (${Math.round(val*100)}%)`;

    if (isTinnitusPlaying && tinnitusPanner) {
        if (tinnitusPanner.pan) {
            tinnitusPanner.pan.setValueAtTime(val, audioCtx.currentTime);
        } else {
            tinnitusPanner.setPosition(val, 0, 1 - Math.abs(val));
        }
    }
});

// Synthesizer Volume slider
tinnitusVolumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    tinnitusVolumeVal.textContent = Math.round(val * 100) + '%';
    
    if (isTinnitusPlaying && tinnitusVolumeNode) {
        tinnitusVolumeNode.gain.setValueAtTime(val, audioCtx.currentTime);
    }
    
    if (isPhaseExpPlaying) {
        // Update phase volumes as well
        if (phaseGainLeft) phaseGainLeft.gain.setValueAtTime(val, audioCtx.currentTime);
        if (phaseGainRight) {
            const rightVal = currentPhaseAngle === 180 ? -val : val;
            phaseGainRight.gain.setValueAtTime(rightVal, audioCtx.currentTime);
        }
    }
});

// Play button trigger for matching synth
btnPlaySynthesizer.addEventListener('click', () => {
    ensureAudioCtx().then(() => {
        if (isTinnitusPlaying) {
            stopTinnitusSynthesizer(true);
        } else {
            startTinnitusSynthesizer();
        }
    });
});

// NOTCH FILTER TOGGLE
notchToggle.addEventListener('change', (e) => {
    isNotchActive = e.target.checked;
    updateNotchFilterState();
});

// SOUNDSCAPE MIXERS HANDLERS
const handleAmbientChange = (slider, display, gainNode) => {
    slider.addEventListener('input', (e) => {
        ensureAudioCtx().then(() => {
            const val = parseFloat(e.target.value);
            display.textContent = Math.round(val * 100) + '%';
            if (gainNode) {
                // smooth transition to avoid clicks
                gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(val * 0.5, audioCtx.currentTime + 0.1); // scaling down slightly
            }
        });
    });
};

handleAmbientChange(volRainSlider, volRainVal, soundscapes.rain.gain);
handleAmbientChange(volOceanSlider, volOceanVal, soundscapes.ocean.gain);
handleAmbientChange(volWindSlider, volWindVal, soundscapes.wind.gain);

// Masking clinical generators
btnMaskWhite.addEventListener('click', () => playMaskerNoise('white'));
btnMaskPink.addEventListener('click', () => playMaskerNoise('pink'));
btnMaskBrown.addEventListener('click', () => playMaskerNoise('brown'));

maskVolumeSlider.addEventListener('input', (e) => {
    ensureAudioCtx().then(() => {
        const val = parseFloat(e.target.value);
        maskVolumeVal.textContent = Math.round(val * 100) + '%';
        if (maskerGain && activeMaskerType) {
            maskerGain.gain.setValueAtTime(maskerGain.gain.value, audioCtx.currentTime);
            maskerGain.gain.linearRampToValueAtTime(val, audioCtx.currentTime + 0.15);
        }
    });
});

btnStopTherapy.addEventListener('click', () => {
    stopAllTherapy();
});

// RESIDUAL INHIBITION HANDLERS
riPresetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (isRiRunning) return; // ignore during run
        
        riPresetButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        riTotalTime = parseInt(e.currentTarget.getAttribute('data-time'));
        riTimerVal.textContent = riTotalTime + 's';
    });
});

btnStartRI.addEventListener('click', () => {
    startResidualInhibition();
});

// PHASE EXPERIMENT HANDLERS
btnPhaseNormal.addEventListener('click', () => {
    ensureAudioCtx().then(() => {
        updatePhaseAngle(0);
        if (!isPhaseExpPlaying) {
            startPhaseExperiment();
        }
    });
});

btnPhaseInverted.addEventListener('click', () => {
    ensureAudioCtx().then(() => {
        updatePhaseAngle(180);
        if (!isPhaseExpPlaying) {
            startPhaseExperiment();
        }
    });
});

// ==========================================================================
// BINAURAL BEATS MODULE
// ==========================================================================
function startBinauralBeats() {
    if (isBinauralPlaying) return;
    if (!audioCtx) return;

    const carrier = 200; // Base carrier frequency 200Hz
    const beat = activeBinauralBeat;
    const vol = parseFloat(binauralVolumeSlider.value);

    // Create Gain Node
    binauralVolumeNode = audioCtx.createGain();
    binauralVolumeNode.gain.setValueAtTime(vol, audioCtx.currentTime);

    // Left Channel: Carrier Frequency
    binauralOscLeft = audioCtx.createOscillator();
    binauralOscLeft.type = 'sine';
    binauralOscLeft.frequency.setValueAtTime(carrier, audioCtx.currentTime);

    binauralPanLeft = audioCtx.createStereoPanner();
    binauralPanLeft.pan.setValueAtTime(-1.0, audioCtx.currentTime);

    // Right Channel: Carrier + Beat Frequency
    binauralOscRight = audioCtx.createOscillator();
    binauralOscRight.type = 'sine';
    binauralOscRight.frequency.setValueAtTime(carrier + beat, audioCtx.currentTime);

    binauralPanRight = audioCtx.createStereoPanner();
    binauralPanRight.pan.setValueAtTime(1.0, audioCtx.currentTime);

    // Connections
    binauralOscLeft.connect(binauralPanLeft);
    binauralPanLeft.connect(binauralVolumeNode);

    binauralOscRight.connect(binauralPanRight);
    binauralPanRight.connect(binauralVolumeNode);

    // Route to master output (analyser)
    binauralVolumeNode.connect(analyser);

    // Start oscillators
    binauralOscLeft.start();
    binauralOscRight.start();

    isBinauralPlaying = true;
}

function stopBinauralBeats() {
    if (!isBinauralPlaying) return;

    try {
        if (binauralOscLeft) {
            binauralOscLeft.stop();
            binauralOscLeft.disconnect();
            binauralOscLeft = null;
        }
        if (binauralOscRight) {
            binauralOscRight.stop();
            binauralOscRight.disconnect();
            binauralOscRight = null;
        }
        if (binauralPanLeft) {
            binauralPanLeft.disconnect();
            binauralPanLeft = null;
        }
        if (binauralPanRight) {
            binauralPanRight.disconnect();
            binauralPanRight = null;
        }
        if (binauralVolumeNode) {
            binauralVolumeNode.disconnect();
            binauralVolumeNode = null;
        }
    } catch (e) {
        console.warn('Error stopping binaural beats nodes:', e);
    }

    isBinauralPlaying = false;
}

function updateBinauralBeatFrequency() {
    if (isBinauralPlaying && binauralOscRight) {
        const carrier = 200;
        binauralOscRight.frequency.setValueAtTime(carrier + activeBinauralBeat, audioCtx.currentTime);
    }
}

function updateBinauralVolume() {
    const vol = parseFloat(binauralVolumeSlider.value);
    binauralVolumeVal.textContent = Math.round(vol * 100) + '%';
    if (isBinauralPlaying && binauralVolumeNode) {
        binauralVolumeNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    }
}

// BINAURAL BEATS EVENT HANDLERS
binauralToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        ensureAudioCtx().then(() => {
            binauralControls.style.display = 'flex';
            startBinauralBeats();
        });
    } else {
        binauralControls.style.display = 'none';
        stopBinauralBeats();
    }
});

binauralVolumeSlider.addEventListener('input', () => {
    updateBinauralVolume();
});

binauralBeatButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        binauralBeatButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeBinauralBeat = parseInt(e.currentTarget.getAttribute('data-beat'));
        updateBinauralBeatFrequency();
    });
});

// MODULATION TYPE EVENT HANDLERS
btnModTremolo.addEventListener('click', () => {
    if (activeModulationType === 'tremolo') return;
    btnModTremolo.classList.add('active');
    btnModAsr.classList.remove('remove'); // safety
    btnModAsr.classList.remove('active');
    activeModulationType = 'tremolo';
    document.getElementById('modRateLabel').textContent = 'Rate (Oscillation frequency)';
    document.getElementById('modDepthLabel').textContent = 'Depth (Severity of pulsation)';
    if (isTinnitusPlaying && modToggle.checked) {
        setupTremolo();
    }
});

btnModAsr.addEventListener('click', () => {
    if (activeModulationType === 'asr') return;
    btnModAsr.classList.add('active');
    btnModTremolo.classList.remove('active');
    activeModulationType = 'asr';
    document.getElementById('modRateLabel').textContent = 'Reset Pace (Fluctuation speed)';
    document.getElementById('modDepthLabel').textContent = 'Drift Range (Severity of drift)';
    if (isTinnitusPlaying && modToggle.checked) {
        setupTremolo();
    }
});

// ==========================================================================
// LOCAL MUSIC PLAYER MODULE
// ==========================================================================
function initLocalAudio(file) {
    if (!audioCtx) return;

    if (!localAudioElement) {
        // Create audio element programmatically
        localAudioElement = new Audio();
        localAudioElement.loop = true;

        // Wrap it in a Web Audio media element source node
        localAudioSource = audioCtx.createMediaElementSource(localAudioElement);
        // Connect to the Notch Filter chain
        localAudioSource.connect(therapyNotchFilter);

        // Bind playback events
        localAudioElement.addEventListener('timeupdate', () => {
            if (!localAudioElement || isNaN(localAudioElement.duration)) return;
            const progress = (localAudioElement.currentTime / localAudioElement.duration) * 100;
            localAudioProgress.value = progress;
            playerCurrentTime.textContent = formatTime(localAudioElement.currentTime);
        });

        localAudioElement.addEventListener('loadedmetadata', () => {
            playerTotalTime.textContent = formatTime(localAudioElement.duration);
            localAudioProgress.value = 0;
        });

        localAudioElement.addEventListener('play', () => {
            btnPlayLocalAudio.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            btnPlayLocalAudio.classList.add('active');
        });

        localAudioElement.addEventListener('pause', () => {
            btnPlayLocalAudio.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>`;
            btnPlayLocalAudio.classList.remove('active');
        });
    }

    // Set source to loaded file URL
    const fileUrl = URL.createObjectURL(file);
    localAudioElement.src = fileUrl;
    localAudioElement.load();
    
    // Reset controls UI
    fileNameLabel.textContent = file.name;
    playerControlsRow.style.display = 'flex';
    playerCurrentTime.textContent = '0:00';
    playerTotalTime.textContent = '0:00';
    localAudioProgress.value = 0;
}

function toggleLocalAudioPlay() {
    if (!localAudioElement) return;

    if (localAudioElement.paused) {
        localAudioElement.play().catch(e => console.error("Error playing local audio:", e));
    } else {
        localAudioElement.pause();
    }
}

function pauseLocalAudio() {
    if (localAudioElement && !localAudioElement.paused) {
        localAudioElement.pause();
        btnPlayLocalAudio.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>`;
        btnPlayLocalAudio.classList.remove('active');
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// LOCAL MUSIC PLAYER EVENT HANDLERS
localAudioFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        ensureAudioCtx().then(() => {
            initLocalAudio(file);
        });
    }
});

btnPlayLocalAudio.addEventListener('click', () => {
    ensureAudioCtx().then(() => {
        toggleLocalAudioPlay();
    });
});

localAudioProgress.addEventListener('input', (e) => {
    if (!localAudioElement || isNaN(localAudioElement.duration)) return;
    const pct = parseFloat(e.target.value) / 100;
    localAudioElement.currentTime = pct * localAudioElement.duration;
});

// ==========================================================================
// 8. PRESET MANAGER SYSTEM
// ==========================================================================

// DOM Elements for Presets
const presetNameInput = document.getElementById('presetName');
const btnSavePreset = document.getElementById('btnSavePreset');
const presetsListContainer = document.getElementById('presetsList');

// Key for LocalStorage
const PRESETS_STORAGE_KEY = 'tinnitune_presets';

// Helper to get presets from LocalStorage
function getPresets() {
    try {
        const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading presets:', e);
        return [];
    }
}

// Helper to save presets to LocalStorage
function savePresetsToStorage(presets) {
    try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
        console.error('Error saving presets:', e);
    }
}

// Render presets list in the UI
function renderPresets() {
    presetsListContainer.innerHTML = '';
    const presets = getPresets();

    if (presets.length === 0) {
        presetsListContainer.innerHTML = '<span class="no-presets">No saved settings</span>';
        return;
    }

    presets.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.setAttribute('data-id', preset.id);

        // Format frequency display
        const freq = parseInt(preset.freqCoarse) + parseInt(preset.freqFine);
        const freqText = freq >= 1000 ? (freq / 1000).toFixed(2) + ' kHz' : freq + ' Hz';

        // Wave type translation
        let waveTypeText = 'Tone';
        if (preset.waveType === 'narrowband') waveTypeText = 'Narrowband';
        else if (preset.waveType === 'white') waveTypeText = 'White Noise';
        else if (preset.waveType === 'pink') waveTypeText = 'Pink Noise';

        item.innerHTML = `
            <div class="preset-info">
                <span class="preset-name">${escapeHtml(preset.name)}</span>
                <span class="preset-meta">${freqText} (${waveTypeText})</span>
            </div>
            <button class="btn-delete-preset" title="Eliminar ajuste">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;

        // Click on preset to load
        item.addEventListener('click', (e) => {
            // If click was on delete button, do not load
            if (e.target.closest('.btn-delete-preset')) return;
            loadPreset(preset.id);
        });

        // Click delete button
        item.querySelector('.btn-delete-preset').addEventListener('click', (e) => {
            e.stopPropagation();
            deletePreset(preset.id);
        });

        presetsListContainer.appendChild(item);
    });
}

// Escape HTML utility to prevent XSS
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// Save current settings as a new preset
function saveCurrentPreset() {
    const name = presetNameInput.value.trim();
    if (!name) {
        alert('Please enter a name for the preset.');
        return;
    }

    const newPreset = {
        id: Date.now(),
        name: name,
        waveType: activeWaveType,
        freqCoarse: freqCoarseSlider.value,
        freqFine: freqFineSlider.value,
        modEnabled: modToggle.checked,
        modRate: modRateSlider.value,
        modDepth: modDepthSlider.value,
        balance: tinnitusBalanceSlider.value,
        volume: tinnitusVolumeSlider.value,
        volRain: volRainSlider.value,
        volOcean: volOceanSlider.value,
        volWind: volWindSlider.value,
        maskVolume: maskVolumeSlider.value,
        activeMaskerType: activeMaskerType,
        isNotchActive: isNotchActive,
        activeModulationType: activeModulationType,
        binauralEnabled: binauralToggle.checked,
        binauralVolume: binauralVolumeSlider.value,
        activeBinauralBeat: activeBinauralBeat
    };

    const presets = getPresets();
    presets.push(newPreset);
    savePresetsToStorage(presets);

    presetNameInput.value = '';
    renderPresets();
}

// Load a preset
function loadPreset(id) {
    const presets = getPresets();
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    // Update variables
    activeWaveType = preset.waveType;
    isNotchActive = preset.isNotchActive;
    activeMaskerType = preset.activeMaskerType;
    activeModulationType = preset.activeModulationType || 'tremolo';

    // Update UI elements values
    freqCoarseSlider.value = preset.freqCoarse;
    freqFineSlider.value = preset.freqFine;
    modToggle.checked = preset.modEnabled;
    modRateSlider.value = preset.modRate;
    modDepthSlider.value = preset.modDepth;
    tinnitusBalanceSlider.value = preset.balance;
    tinnitusVolumeSlider.value = preset.volume;
    volRainSlider.value = preset.volRain;
    volOceanSlider.value = preset.volOcean;
    volWindSlider.value = preset.volWind;
    maskVolumeSlider.value = preset.maskVolume;
    notchToggle.checked = preset.isNotchActive;
    
    // Modulation Type UI
    btnModTremolo.classList.toggle('active', activeModulationType === 'tremolo');
    btnModAsr.classList.toggle('active', activeModulationType === 'asr');
    document.getElementById('modRateLabel').textContent = activeModulationType === 'tremolo' ? 'Rate (Oscillation frequency)' : 'Reset Pace (Fluctuation speed)';
    document.getElementById('modDepthLabel').textContent = activeModulationType === 'tremolo' ? 'Depth (Severity of pulsation)' : 'Drift Range (Severity of drift)';

    // Binaural Beats UI
    const bEnabled = preset.binauralEnabled || false;
    binauralToggle.checked = bEnabled;
    binauralVolumeSlider.value = preset.binauralVolume !== undefined ? preset.binauralVolume : 0.4;
    binauralVolumeVal.textContent = Math.round(parseFloat(binauralVolumeSlider.value) * 100) + '%';
    activeBinauralBeat = preset.activeBinauralBeat || 10;
    
    binauralControls.style.display = bEnabled ? 'flex' : 'none';
    binauralBeatButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.getAttribute('data-beat')) === activeBinauralBeat);
    });

    // Update active wave button UI
    waveTypeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-type') === preset.waveType);
    });

    // Update masker buttons UI
    btnMaskWhite.classList.toggle('active', preset.activeMaskerType === 'white');
    btnMaskPink.classList.toggle('active', preset.activeMaskerType === 'pink');
    btnMaskBrown.classList.toggle('active', preset.activeMaskerType === 'brown');

    // Update display values text
    const coarseVal = parseInt(preset.freqCoarse);
    freqVal.textContent = coarseVal >= 1000 ? (coarseVal / 1000).toFixed(2) + ' kHz' : coarseVal + ' Hz';
    freqFineVal.textContent = (parseInt(preset.freqFine) > 0 ? '+' : '') + preset.freqFine + ' Hz';
    modRateVal.textContent = parseFloat(preset.modRate).toFixed(1) + ' Hz';
    modDepthVal.textContent = preset.modDepth + '%';
    
    const balVal = parseFloat(preset.balance);
    if (balVal === -1) tinnitusBalanceVal.textContent = 'Left Ear Only';
    else if (balVal === 1) tinnitusBalanceVal.textContent = 'Right Ear Only';
    else if (balVal === 0) tinnitusBalanceVal.textContent = 'Center';
    else if (balVal < 0) tinnitusBalanceVal.textContent = `Left (${Math.round(Math.abs(balVal)*100)}%)`;
    else tinnitusBalanceVal.textContent = `Right (${Math.round(balVal*100)}%)`;
    
    tinnitusVolumeVal.textContent = Math.round(preset.volume * 100) + '%';
    volRainVal.textContent = Math.round(preset.volRain * 100) + '%';
    volOceanVal.textContent = Math.round(preset.volOcean * 100) + '%';
    volWindVal.textContent = Math.round(preset.volWind * 100) + '%';
    maskVolumeVal.textContent = Math.round(preset.maskVolume * 100) + '%';

    // Update notch badges
    updateNotchFilterState();

    // If audio is running, apply adjustments to active nodes
    if (audioCtx) {
        // Update notch frequency
        updateSynthesizerParams();

        // Update tremolo
        if (isTinnitusPlaying) {
            if (preset.modEnabled) {
                setupTremolo();
            } else {
                if (tinnitusModLfo) {
                    tinnitusModLfo.stop();
                    tinnitusModLfo.disconnect();
                    tinnitusModLfo = null;
                }
                if (tinnitusModGain) {
                    tinnitusModGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
                }
            }
        }

        // Update volume & balance
        if (isTinnitusPlaying && tinnitusVolumeNode) {
            tinnitusVolumeNode.gain.setValueAtTime(preset.volume, audioCtx.currentTime);
        }
        if (isTinnitusPlaying && tinnitusPanner) {
            if (tinnitusPanner.pan) {
                tinnitusPanner.pan.setValueAtTime(preset.balance, audioCtx.currentTime);
            } else {
                tinnitusPanner.setPosition(preset.balance, 0, 1 - Math.abs(preset.balance));
            }
        }

        // If the synthesizer type changed and it is playing, restart it
        if (isTinnitusPlaying) {
            stopTinnitusSynthesizer();
            startTinnitusSynthesizer();
        }

        // Update ambient gains
        if (soundscapes.rain.gain) {
            soundscapes.rain.gain.gain.setValueAtTime(soundscapes.rain.gain.gain.value, audioCtx.currentTime);
            soundscapes.rain.gain.gain.linearRampToValueAtTime(preset.volRain * 0.5, audioCtx.currentTime + 0.1);
        }
        if (soundscapes.ocean.gain) {
            soundscapes.ocean.gain.gain.setValueAtTime(soundscapes.ocean.gain.gain.value, audioCtx.currentTime);
            soundscapes.ocean.gain.gain.linearRampToValueAtTime(preset.volOcean * 0.5, audioCtx.currentTime + 0.1);
        }
        if (soundscapes.wind.gain) {
            soundscapes.wind.gain.gain.setValueAtTime(soundscapes.wind.gain.gain.value, audioCtx.currentTime);
            soundscapes.wind.gain.gain.linearRampToValueAtTime(preset.volWind * 0.5, audioCtx.currentTime + 0.1);
        }

        // Update active clinical masker
        if (preset.activeMaskerType) {
            const type = preset.activeMaskerType;
            activeMaskerType = null; // force swap
            playMaskerNoise(type);
            
            if (maskerGain) {
                maskerGain.gain.setValueAtTime(maskerGain.gain.value, audioCtx.currentTime);
                maskerGain.gain.linearRampToValueAtTime(preset.maskVolume, audioCtx.currentTime + 0.15);
            }
        } else {
            stopMaskerNoise();
        }

        // Apply Binaural Beats state dynamically
        if (bEnabled) {
            stopBinauralBeats();
            startBinauralBeats();
        } else {
            stopBinauralBeats();
        }
    }
}

// Delete a preset
function deletePreset(id) {
    let presets = getPresets();
    presets = presets.filter(p => p.id !== id);
    savePresetsToStorage(presets);
    renderPresets();
}

// Bind events for Presets
btnSavePreset.addEventListener('click', saveCurrentPreset);
presetNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveCurrentPreset();
    }
});

// Render initial presets on load
renderPresets();

// ==========================================================================
// 9. SLEEP TIMER SYSTEM (FADE OUT)
// ==========================================================================
let sleepTimerId = null;
let sleepFadeIntervalId = null;
let sleepTimeRemaining = 0;
let originalMasterVolume = 0.5;
let isFadingOut = false;

const sleepButtons = document.querySelectorAll('.btn-grid-5 button');

function startSleepTimer(minutes) {
    stopSleepTimerLogic();
    
    if (minutes === 0) {
        updateSleepTimerUI(0);
        return;
    }
    
    ensureAudioCtx().then(() => {
        originalMasterVolume = parseFloat(masterVolumeSlider.value);
        sleepTimeRemaining = minutes * 60;
        isFadingOut = false;
        
        updateSleepTimerUI(minutes);
        
        sleepTimerId = setInterval(() => {
            sleepTimeRemaining--;
            
            if (sleepTimeRemaining <= 0) {
                stopSleepTimerLogic(true);
                return;
            }
            
            // Format time display
            const mins = Math.floor(sleepTimeRemaining / 60);
            const secs = sleepTimeRemaining % 60;
            document.getElementById('sleepTimerDisplay').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            // Start fade out in the last 60 seconds
            if (sleepTimeRemaining <= 60 && !isFadingOut) {
                isFadingOut = true;
                startSleepFadeOut(sleepTimeRemaining);
            }
        }, 1000);
    });
}

function startSleepFadeOut(duration) {
    let fadeStep = 0;
    const totalSteps = duration;
    const startVol = parseFloat(masterVolumeSlider.value);
    
    sleepFadeIntervalId = setInterval(() => {
        fadeStep++;
        const progress = fadeStep / totalSteps;
        const currentVol = startVol * (1 - progress);
        
        masterVolumeSlider.value = currentVol;
        masterVolumeVal.textContent = Math.round(currentVol * 100) + '%';
        if (masterGain) {
            masterGain.gain.setValueAtTime(currentVol, audioCtx.currentTime);
        }
        
        if (fadeStep >= totalSteps) {
            clearInterval(sleepFadeIntervalId);
            sleepFadeIntervalId = null;
        }
    }, 1000);
}

function stopSleepTimerLogic(finished = false) {
    if (sleepTimerId) {
        clearInterval(sleepTimerId);
        sleepTimerId = null;
    }
    if (sleepFadeIntervalId) {
        clearInterval(sleepFadeIntervalId);
        sleepFadeIntervalId = null;
    }
    
    if (finished) {
        stopTinnitusSynthesizer(false);
        stopAllTherapy();
        stopPhaseExperiment();
        
        // Stop Binaural Beats
        if (binauralToggle.checked) {
            binauralToggle.checked = false;
            binauralControls.style.display = 'none';
            stopBinauralBeats();
        }

        // Pause local music player
        pauseLocalAudio();
        
        masterVolumeSlider.value = originalMasterVolume;
        masterVolumeVal.textContent = Math.round(originalMasterVolume * 100) + '%';
        if (masterGain) {
            masterGain.gain.setValueAtTime(originalMasterVolume, audioCtx.currentTime);
        }
    } else if (isFadingOut) {
        masterVolumeSlider.value = originalMasterVolume;
        masterVolumeVal.textContent = Math.round(originalMasterVolume * 100) + '%';
        if (masterGain) {
            masterGain.gain.setValueAtTime(originalMasterVolume, audioCtx.currentTime);
        }
    }
    
    isFadingOut = false;
    document.getElementById('sleepTimerDisplay').textContent = 'Disabled';
    
    sleepButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnSleepOff').classList.add('active');
}

function updateSleepTimerUI(minutes) {
    sleepButtons.forEach(btn => btn.classList.remove('active'));
    
    if (minutes === 0) {
        document.getElementById('btnSleepOff').classList.add('active');
        document.getElementById('sleepTimerDisplay').textContent = 'Disabled';
    } else {
        const activeBtn = Array.from(sleepButtons).find(btn => parseInt(btn.getAttribute('data-minutes')) === minutes);
        if (activeBtn) activeBtn.classList.add('active');
        
        const mins = Math.floor(sleepTimeRemaining / 60);
        const secs = sleepTimeRemaining % 60;
        document.getElementById('sleepTimerDisplay').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Bind Sleep Timer events
sleepButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mins = parseInt(e.currentTarget.getAttribute('data-minutes'));
        startSleepTimer(mins);
    });
});
