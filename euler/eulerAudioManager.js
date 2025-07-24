var EulerAudioManager = pc.createScript('eulerAudioManager');

// Add script attributes for editor configuration
EulerAudioManager.attributes.add('enableAudio', { type: 'boolean', default: true, title: 'Enable Audio' });

// Initialize code called once per entity
EulerAudioManager.prototype.initialize = function() {
    console.log("Euler Audio Manager initialized");
    
    // Check if we should run (only when euler mode is active)
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const currentMode = appManager.script.AppManager.currentMode;
        if (currentMode !== 'euler') {
            console.log("Euler Audio Manager disabled - not in euler mode");
            return;
        }
    }
    
    // Audio state
    this.isAudioStarted = false;
    this.isAudioEnabled = this.enableAudio;
    
    // Audio parameters
    this.masterVolume = 0.5;
    this.rootNote = 60; // C4
    this.rootFreq = 261.63; // C4 frequency
    this.currentScale = 'Major';
    this.microtuning = '12-TET';
    this.networkModulatesRoot = false;
    this.lastRootChange = 0;
    this.networkRootInterval = null;
    
    // Network state from simulation
    this.networkState = {
        triangleDensity: 0,
        averageArea: 0,
        networkComplexity: 0,
        spatialDistribution: 0,
        particleVelocity: 0,
        connectionDensity: 0,
        spatialCoherence: 0
    };
    
    // Synthesizers (will be created when audio starts)
    this.synthesizers = {
        fm: null,
        am: null,
        membrane: null,
        duo: null
    };
    
    // Audio effects
    this.effects = {
        autoFilter: null,
        phaser: null,
        chorus: null,
        delay: null,
        reverb: null
    };
    
    // Master gain
    this.masterGain = null;
    
    // Scales definition
    this.scales = {
        'Major': [0, 2, 4, 5, 7, 9, 11],
        'Minor': [0, 2, 3, 5, 7, 8, 10],
        'Dorian': [0, 2, 3, 5, 7, 9, 10],
        'Phrygian': [0, 1, 3, 5, 7, 8, 10],
        'Lydian': [0, 2, 4, 6, 7, 9, 11],
        'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
        'Locrian': [0, 1, 3, 5, 6, 8, 10]
    };
    
    // Check if Tone.js is available
    if (typeof Tone === 'undefined') {
        console.warn("Tone.js not found. Audio functionality will be limited.");
        this.isAudioEnabled = false;
        return;
    }
    
    console.log("Audio Manager setup complete");
};

// Start audio system
EulerAudioManager.prototype.startAudio = function() {
    if (!this.isAudioEnabled || this.isAudioStarted) {
        console.log("Audio already started or disabled");
        return Promise.resolve();
    }
    
    if (typeof Tone === 'undefined') {
        console.error("Tone.js not available");
        return Promise.reject("Tone.js not available");
    }
    
    // Start Tone.js audio context
    return Tone.start().then(() => {
        console.log("Tone.js audio context started");
        this.setupAudioChain();
        this.isAudioStarted = true;
        console.log("Audio system fully started");
        return true;
    }).catch(error => {
        console.error("Failed to start Tone.js:", error);
        throw error;
    });
};

// Stop audio system
EulerAudioManager.prototype.stopAudio = function() {
    if (!this.isAudioStarted) {
        console.log("Audio not started");
        return;
    }
    
    try {
        // Stop all synthesizers
        Object.values(this.synthesizers).forEach(synth => {
            if (synth) {
                synth.triggerRelease();
            }
        });
        
        // Stop Tone.js
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
        }
        
        this.isAudioStarted = false;
        console.log("Audio stopped");
    } catch (error) {
        console.error("Error stopping audio:", error);
    }
};

// Setup audio chain
EulerAudioManager.prototype.setupAudioChain = function() {
    if (typeof Tone === 'undefined') return;
    
    try {
        // Create master gain
        this.masterGain = new Tone.Gain(this.masterVolume).toDestination();
        
        // Create effects chain like original
        this.effects.autoFilter = new Tone.AutoFilter({
            frequency: "4n",
            baseFrequency: 300,
            octaves: 2
        }).start();
        
        this.effects.phaser = new Tone.Phaser({
            frequency: 0.5,
            octaves: 3,
            stages: 10,
            Q: 10,
            baseFrequency: 350
        });
        
        this.effects.chorus = new Tone.Chorus({
            frequency: 4,
            delayTime: 2.5,
            depth: 0.5
        }).start();
        
        this.effects.delay = new Tone.FeedbackDelay("8n", 0.2);
        
        this.effects.reverb = new Tone.Reverb({
            decay: 1.5,
            preDelay: 0.01,
            wet: 0.3
        });
        
        // Add analyser for waveform visualization
        this.analyser = new Tone.Analyser('waveform', 256);
        
        // Full effects chain like original
        const effectsChain = [
            this.effects.autoFilter,
            this.effects.phaser,
            this.effects.chorus,
            this.effects.delay,
            this.effects.reverb,
            this.analyser,
            this.masterGain
        ];
        
        // Create synthesizers
        this.synthesizers.fm = new Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 10,
            detune: 0,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.01,
                decay: 0.01,
                sustain: 1,
                release: 0.5
            },
            modulation: { type: "square" },
            modulationEnvelope: {
                attack: 0.5,
                decay: 0.01,
                sustain: 1,
                release: 0.5
            },
            volume: -6
        }).chain(...effectsChain);
        
        this.synthesizers.am = new Tone.AMSynth({
            harmonicity: 2,
            detune: 0,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.01,
                decay: 0.01,
                sustain: 1,
                release: 0.5
            },
            modulation: { type: "square" },
            modulationEnvelope: {
                attack: 0.5,
                decay: 0.01,
                sustain: 1,
                release: 0.5
            },
            volume: -6
        }).chain(...effectsChain);
        
        this.synthesizers.membrane = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4,
                attackCurve: "exponential"
            },
            volume: -6
        }).chain(...effectsChain);
        
        this.synthesizers.duo = new Tone.DuoSynth({
            vibratoAmount: 0.5,
            vibratoRate: 5,
            harmonicity: 1.5,
            voice0: {
                volume: -10,
                portamento: 0,
                oscillator: { type: "sine" },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                }
            },
            voice1: {
                volume: -10,
                portamento: 0,
                oscillator: { type: "sine" },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                }
            },
            volume: -6
        }).chain(...effectsChain);
        
        console.log("Audio chain setup complete");
        
        // Start transport and trigger synths
        Tone.Transport.start();
        
        // Start all synthesizers with root note
        const rootNote = Tone.Frequency(this.rootNote, "midi").toNote();
        this.synthesizers.fm.triggerAttack(rootNote);
        this.synthesizers.am.triggerAttack(rootNote);
        this.synthesizers.membrane.triggerAttack(rootNote);
        this.synthesizers.duo.triggerAttack(rootNote);
        
        console.log("All synthesizers started with root note:", rootNote);
        
    } catch (error) {
        console.error("Error setting up audio chain:", error);
    }
};

// Update from network state
EulerAudioManager.prototype.updateFromNetwork = function(networkState) {
    if (!this.isAudioStarted || !networkState) return;
    
    // Store network state
    this.networkState = networkState;
    
    // Map network metrics to audio parameters
    this.updateAudioParameters();
    
    // Update blend visualization if UI controller exists
    this.updateBlendVisualization();
};

// Update audio parameters based on network state
EulerAudioManager.prototype.updateAudioParameters = function() {
    if (!this.isAudioStarted || typeof Tone === 'undefined') return;
    
    try {
        const state = this.networkState;
        const baseFreq = this.rootFreq || 261.63;
        
        // Vectorial mapping like original: use 4 network metrics as weights
        const v1 = Math.max(0, Math.min(1, state.triangleDensity));
        const v2 = Math.max(0, Math.min(1, state.averageArea / 1000));
        const v3 = Math.max(0, Math.min(1, state.networkComplexity));
        const v4 = Math.max(0, Math.min(1, state.spatialDistribution));
        
        // Update synthesizer volumes (blend) - like original
        if (this.synthesizers.fm) {
            this.synthesizers.fm.volume.value = -12 + v1 * 6;
        }
        if (this.synthesizers.am) {
            this.synthesizers.am.volume.value = -20 + v2 * 12;
        }
        if (this.synthesizers.membrane) {
            this.synthesizers.membrane.volume.value = -18 + v3 * 10;
        }
        if (this.synthesizers.duo) {
            this.synthesizers.duo.volume.value = -22 + v4 * 14;
        }
        
        // Modulate synth parameters like original
        if (this.synthesizers.fm) {
            this.synthesizers.fm.set({
                detune: this.mapNetworkComplexityToDetune(state.networkComplexity),
                harmonicity: 3.01 + v1 * 2,
                modulationIndex: 10 + state.particleVelocity * 5
            });
        }
        
        if (this.synthesizers.am) {
            this.synthesizers.am.set({
                harmonicity: 2.5 + v2 * 2
            });
        }
        
        if (this.synthesizers.membrane) {
            this.synthesizers.membrane.set({
                pitchDecay: 0.05 + v3 * 0.2
            });
        }
        
        if (this.synthesizers.duo) {
            this.synthesizers.duo.set({
                harmonicity: 1.5 + v4 * 2,
                vibratoAmount: 0.5 + v4 * 0.5
            });
        }
        
        // Map to effects like original
        if (this.effects.autoFilter) {
            const filterFreq = this.mapSpatialDistributionToFilter(state.spatialDistribution);
            const filterOctaves = 2 + state.networkComplexity * 3;
            this.effects.autoFilter.baseFrequency.value = Math.max(20, Math.min(20000, filterFreq));
            this.effects.autoFilter.octaves.value = Math.max(0, Math.min(8, filterOctaves));
        }
        
        if (this.effects.phaser) {
            const phaserRate = 0.1 + state.networkComplexity * 2;
            this.effects.phaser.frequency.value = Math.max(0.01, Math.min(10, phaserRate));
        }
        
        if (this.effects.chorus) {
            const chorusDepth = state.spatialDistribution * 0.8;
            this.effects.chorus.depth = Math.max(0, Math.min(1, chorusDepth));
        }
        
        if (this.effects.delay) {
            const delayTime = this.mapParticleVelocityToDelay(state.particleVelocity);
            const delayFeedback = this.mapConnectionDensityToFeedback(state.connectionDensity);
            this.effects.delay.delayTime.value = Math.max(0, Math.min(2, delayTime));
            this.effects.delay.feedback.value = Math.max(0, Math.min(0.8, delayFeedback));
        }
        
        if (this.effects.reverb) {
            const reverbWet = this.mapNetworkComplexityToReverb(state.networkComplexity);
            this.effects.reverb.wet.value = Math.max(0, Math.min(0.8, reverbWet));
        }
        
        // Shift root note based on network complexity like original
        const now = performance.now();
        if (state.networkComplexity > 0.3 && now - this.lastRootChange > 8000) {
            this.shiftRoot();
            this.lastRootChange = now;
        }
        
    } catch (error) {
        console.error("Error updating audio parameters:", error);
    }
};

// Mapping functions like original
EulerAudioManager.prototype.mapNetworkComplexityToDetune = function(complexity) {
    return complexity * 50;
};

EulerAudioManager.prototype.mapParticleVelocityToDelay = function(velocity) {
    return 0.1 + velocity * 0.4;
};

EulerAudioManager.prototype.mapConnectionDensityToFeedback = function(density) {
    return 0.2 + density * 0.3;
};

EulerAudioManager.prototype.mapNetworkComplexityToReverb = function(complexity) {
    return 0.3 + complexity * 0.4;
};

EulerAudioManager.prototype.mapSpatialDistributionToFilter = function(spatialDist) {
    return 300 + Math.pow(spatialDist, 2) * 1500;
};

// Trigger notes based on network state
EulerAudioManager.prototype.triggerNetworkNotes = function() {
    if (!this.isAudioStarted) return;
    
    const state = this.networkState;
    const scale = this.scales[this.currentScale] || this.scales['Major'];
    
    // Calculate base frequency from root note
    let rootFreq = this.rootNote;
    if (this.networkModulatesRoot) {
        rootFreq += Math.floor(state.spatialCoherence * 12); // Modulate up to an octave
    }
    
    // Trigger notes based on different network metrics
    const synthKeys = Object.keys(this.synthesizers);
    synthKeys.forEach((key, index) => {
        const synth = this.synthesizers[key];
        if (!synth) return;
        
        const metric = Object.values(state)[index % Object.values(state).length];
        if (metric > 0.1) { // Threshold for triggering
            const scaleIndex = Math.floor(metric * scale.length) % scale.length;
            const noteOffset = scale[scaleIndex];
            const frequency = Tone.Frequency(rootFreq + noteOffset, "midi").toFrequency();
            
            // Trigger note with short duration
            synth.triggerAttackRelease(frequency, "8n");
        }
    });
};

// Set master volume
EulerAudioManager.prototype.setVolume = function(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
        this.masterGain.gain.value = this.masterVolume;
    }
};

// Set root note
EulerAudioManager.prototype.setRootNote = function(midiNote) {
    this.rootNote = Math.max(24, Math.min(83, midiNote));
};

// Set musical scale
EulerAudioManager.prototype.setScale = function(scaleName) {
    if (this.scales[scaleName]) {
        this.currentScale = scaleName;
    }
};

// Set microtuning
EulerAudioManager.prototype.setMicrotuning = function(tuning) {
    this.microtuning = tuning;
    // Implementation would depend on specific microtuning requirements
};

// Set network root modulation
EulerAudioManager.prototype.setNetworkRoot = function(enabled) {
    this.networkModulatesRoot = enabled;
    
    if (enabled) {
        if (!this.networkRootInterval) {
            this.networkRootInterval = setInterval(() => {
                this.modulateRootFromNetwork();
            }, 2000); // Every 2 seconds like original
        }
    } else {
        if (this.networkRootInterval) {
            clearInterval(this.networkRootInterval);
            this.networkRootInterval = null;
        }
    }
};

// Set root note and octave (like original)
EulerAudioManager.prototype.setRootNoteAndOctave = function(note, octave) {
    try {
        const noteMap = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3,
            'E': 4, 'F': 5, 'F#': 6, 'G': 7,
            'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        
        let midi = noteMap[note] + (octave + 1) * 12;
        let freq = Tone.Frequency(midi, 'midi').toFrequency();
        
        // Apply microtuning like in original
        if (this.microtuning === '19-TET') {
            freq = 440 * Math.pow(2, (midi - 69) / 19);
        } else if (this.microtuning === '24-TET') {
            freq = 440 * Math.pow(2, (midi - 69) / 24);
        } else if (this.microtuning === 'Just Intonation') {
            const justRatios = [1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8];
            const scaleIndex = noteMap[note] % 12;
            freq = 261.63 * justRatios[scaleIndex] * Math.pow(2, octave - 4);
        }
        
        if (isFinite(freq) && !isNaN(freq)) {
            this.rootNote = midi;
            this.rootFreq = freq;
            
            // Update all synthesizers if audio is started
            if (this.isAudioStarted) {
                Object.values(this.synthesizers).forEach(synth => {
                    if (synth && synth.frequency) {
                        synth.frequency.linearRampToValueAtTime(freq, Tone.now() + 0.5);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error setting root note:", error);
    }
};

// Modulate root from network (like original)
EulerAudioManager.prototype.modulateRootFromNetwork = function() {
    if (!this.networkState || !this.networkModulatesRoot) return;
    
    const complexity = Math.max(0, Math.min(1, this.networkState.networkComplexity || 0));
    const scaleDegrees = this.scales[this.currentScale] || this.scales['Major'];
    const idx = Math.floor(complexity * (scaleDegrees.length - 1));
    const degree = scaleDegrees[idx];
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = noteNames[degree % 12];
    const octave = 4;
    
    this.setRootNoteAndOctave(note, octave);
};

// Shift root using Tonnetz space like original
EulerAudioManager.prototype.shiftRoot = function() {
    // Random walk in Tonnetz space
    const i = Math.floor(Math.random() * 3) - 1;
    const j = Math.floor(Math.random() * 3) - 1;
    const k = Math.floor(Math.random() * 3) - 1;
    const newRoot = this.getTonnetzPitch(this.rootNote, i, j, k);
    
    if (typeof newRoot === 'number' && !isNaN(newRoot)) {
        const newNote = Tone.Frequency(newRoot, "midi").toNote();
        
        // Update all synthesizers to new root
        if (this.synthesizers.fm) {
            this.synthesizers.fm.frequency.linearRampToValueAtTime(
                Tone.Frequency(newRoot, "midi").toFrequency(), 
                Tone.now() + 0.5
            );
        }
        if (this.synthesizers.am) {
            this.synthesizers.am.frequency.linearRampToValueAtTime(
                Tone.Frequency(newRoot, "midi").toFrequency(), 
                Tone.now() + 0.5
            );
        }
        if (this.synthesizers.membrane) {
            this.synthesizers.membrane.frequency.linearRampToValueAtTime(
                Tone.Frequency(newRoot, "midi").toFrequency(), 
                Tone.now() + 0.5
            );
        }
        if (this.synthesizers.duo) {
            this.synthesizers.duo.frequency.linearRampToValueAtTime(
                Tone.Frequency(newRoot, "midi").toFrequency(), 
                Tone.now() + 0.5
            );
        }
        
        this.rootNote = newRoot;
        this.rootFreq = Tone.Frequency(newRoot, "midi").toFrequency();
    }
};

// Tonnetz helper functions like original
EulerAudioManager.prototype.getTonnetzPitch = function(rootMidi, i, j, k) {
    // Defensive: ensure all are numbers
    if (typeof rootMidi !== 'number' || isNaN(rootMidi)) rootMidi = 60;
    if (typeof i !== 'number' || isNaN(i)) i = 0;
    if (typeof j !== 'number' || isNaN(j)) j = 0;
    if (typeof k !== 'number' || isNaN(k)) k = 0;
    // Convert Tonnetz coordinates to pitch
    return rootMidi + (i * 4 + j * 3 + k * 5);
};

// Clean up when script is destroyed
EulerAudioManager.prototype.destroy = function() {
    this.stopAudio();
    
    // Clean up synthesizers
    Object.values(this.synthesizers).forEach(synth => {
        if (synth) {
            synth.dispose();
        }
    });
    
    // Clean up effects
    Object.values(this.effects).forEach(effect => {
        if (effect) {
            effect.dispose();
        }
    });
    
    if (this.masterGain) {
        this.masterGain.dispose();
    }
};

// Update blend visualization
EulerAudioManager.prototype.updateBlendVisualization = function() {
    // Find UI controller
    const uiEntity = this.app.root.findByName('EulerContainer');
    if (uiEntity && uiEntity.script.eulerUIController) {
        const uiController = uiEntity.script.eulerUIController;
        
        // Map network state to synthesizer blend values
        const v1 = this.networkState.triangleDensity || 0.5;      // FM
        const v2 = this.networkState.averageArea || 0.5;          // AM  
        const v3 = this.networkState.networkComplexity || 0.5;    // MEM
        const v4 = this.networkState.spatialDistribution || 0.5;  // DUO
        
        // Update blend visualization
        if (uiController.updateBlendViz) {
            uiController.updateBlendViz(v1, v2, v3, v4);
        }
    }
}; 