class ProfessionalMetronome {
            constructor() {
                this.isPlaying = false;
                this.bpm = 120;
                this.currentBeat = 0;
                this.beatsPerMeasure = 4;
                this.subdivision = 'quarter';
                this.accentPattern = [true, false, false, false];
                this.volume = 0.7;
                this.sound = 'classic';
                this.audioContext = null;
                this.nextNoteTime = 0.0;
                this.scheduleAheadTime = 25.0;
                this.lookAhead = 25.0;
                this.timerInterval = null;
                this.tapTimes = [];

                this.initializeAudio();
                this.initializeTimer();
                this.setupEventListeners();
                this.updateBeatIndicator();
                this.updateAccentPattern();
                // Initialize UI reflectors
                this.setTempo(this.bpm);
            }

            initializeAudio() {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            initializeTimer() {
                // Use setInterval instead of Worker for better compatibility
                this.timerInterval = null;
            }

            createSound(frequency = 800, duration = 0.1, type = 'sine', pan = 0, detuneCents = 0, time) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const panner = this.audioContext.createStereoPanner ? this.audioContext.createStereoPanner() : null;

                oscillator.connect(gainNode);
                if (panner) {
                    gainNode.connect(panner);
                    panner.connect(this.audioContext.destination);
                    panner.pan.setValueAtTime(pan, time);
                } else {
                    gainNode.connect(this.audioContext.destination);
                }

                oscillator.frequency.setValueAtTime(frequency, time);
                oscillator.type = type;
                if (oscillator.detune) {
                    oscillator.detune.setValueAtTime(detuneCents, time);
                }

                // Click envelope for clear transient, quick decay
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(this.volume, time + 0.005);
                gainNode.gain.exponentialRampToValueAtTime(0.0008, time + duration);

                oscillator.start(time);
                oscillator.stop(time + duration);
            }

            playSound(isAccent = false, time) {
                // Curated metronome timbres (psychoacoustically snappy, dopamine-friendly yet not fatiguing)
                const soundSettings = {
                    classic:   { freq: isAccent ? 1200 : 900, duration: 0.045, type: 'square' },
                    wood:      { freq: isAccent ? 550 : 350,  duration: 0.06,  type: 'triangle' },
                    digital:   { freq: isAccent ? 1400 : 950, duration: 0.04,  type: 'square' },
                    rimshot:   { freq: isAccent ? 420 : 280,  duration: 0.035, type: 'sawtooth' },
                    clave:     { freq: isAccent ? 800 : 600,  duration: 0.07,  type: 'triangle' },
                    hihat:     { freq: isAccent ? 9000: 8000, duration: 0.02,  type: 'square' },
                    shaker:    { freq: isAccent ? 6000: 5000, duration: 0.05,  type: 'triangle' },
                    stick:     { freq: isAccent ? 1000: 700,  duration: 0.05,  type: 'square' },
                    tick:      { freq: isAccent ? 1800: 1300, duration: 0.03,  type: 'square' },
                    snap:      { freq: isAccent ? 2200: 1600, duration: 0.045, type: 'square' }
                };

                const settings = soundSettings[this.sound] || soundSettings.classic;
                // Subtle stereo and micro-detune for non-fatiguing variation
                const pan = isAccent ? 0 : (Math.random() < 0.5 ? -0.12 : 0.12);
                const detune = isAccent ? 0 : (Math.random() * 6 - 3); // ±3 cents
                this.createSound(settings.freq, settings.duration, settings.type, pan, detune, time);
            }

            scheduler() {
                while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime / 1000.0) {
                    this.scheduleNote(this.nextNoteTime);
                    this.nextNote();
                }
            }

            scheduleNote(time) {
                const scheduledBeat = this.currentBeat;
                const isAccent = this.accentPattern[scheduledBeat % this.accentPattern.length];

                // Schedule the sound with high precision.
                this.playSound(isAccent, time);

                // Schedule the visual update to be as close as possible to the sound.
                const delayMs = Math.max(0, (time - this.audioContext.currentTime) * 1000);
                setTimeout(() => {
                    if (!this.isPlaying) return;
                    this.updateVisualFeedbackPrecise(scheduledBeat);
                }, delayMs);
            }

            nextNote() {
                const secondsPerBeat = 60.0 / this.bpm;
                let step = 1;
                switch(this.subdivision) {
                    case 'eighth': step = 0.5; break;
                    case 'triplet': step = 1/3; break;
                    case 'sixteenth': step = 0.25; break;
                }
                this.nextNoteTime += secondsPerBeat * step;

                // This logic ensures the beat counter increments correctly for subdivisions.
                if (Math.abs((this.currentBeat + step) % 1) < 1e-9) {
                     this.currentBeat = Math.round(this.currentBeat + step);
                } else {
                     this.currentBeat += step;
                }
            }

            updateVisualFeedbackPrecise(targetBeat) {
                const beatDots = document.querySelectorAll('.beat-dot');
                const activeIndex = Math.floor(targetBeat % this.beatsPerMeasure);
                beatDots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === activeIndex);
                    dot.classList.toggle('accent', !!this.accentPattern[index]);
                    if (index === activeIndex) {
                        dot.classList.add('pulse');
                        setTimeout(() => dot.classList.remove('pulse'), 180);
                    }
                });

                const tempoDisplay = document.querySelector('.tempo-display');
                if (tempoDisplay) {
                    const ripple = document.createElement('div');
                    ripple.className = 'bpm-ripple';
                    tempoDisplay.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 700);
                    const card = document.querySelector('.metronome-section');
                    card.classList.add('beat-flash');
                    setTimeout(() => card.classList.remove('beat-flash'), 120);
                }

                const pendulum = document.getElementById('pendulum');
                const angle = targetBeat % 2 >= 1 ? -20 : 20;
                const msPerBeat = 60000 / this.bpm;
                const half = msPerBeat / 2;
                pendulum.style.transition = `transform ${Math.max(40, half - 10)}ms cubic-bezier(.2,.9,.3,1)`;
                pendulum.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            }

            start() {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }

                this.isPlaying = true;
                this.currentBeat = 0;
                this.nextNoteTime = this.audioContext.currentTime + 0.1; // Start scheduling slightly ahead

                this.scheduleLoop();

                document.getElementById('playStopBtn').textContent = 'STOP';
                document.getElementById('playStopBtn').classList.add('playing');
            }

            scheduleLoop() {
                if (!this.isPlaying) return;

                this.scheduler();

                requestAnimationFrame(() => this.scheduleLoop());
            }

            stop() {
                this.isPlaying = false;

                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }

                document.getElementById('playStopBtn').textContent = 'START';
                document.getElementById('playStopBtn').classList.remove('playing');

                // Reset visual indicators
                document.querySelectorAll('.beat-dot').forEach(dot => {
                    dot.classList.remove('active', 'accent');
                });

                document.getElementById('pendulum').style.transform = 'translateX(-50%) rotate(0deg)';
            }

            setTempo(newTempo) {
                this.bpm = Math.max(40, Math.min(500, newTempo));
                document.getElementById('bpmDisplay').textContent = this.bpm;
                document.getElementById('tempoSlider').value = this.bpm;
                const tempoInput = document.getElementById('tempoInput');
                if (tempoInput) tempoInput.value = this.bpm;
                // Disable −/+ at bounds
                const down = document.getElementById('tempoDown');
                const up = document.getElementById('tempoUp');
                if (down) down.disabled = this.bpm <= 40;
                if (up) up.disabled = this.bpm >= 500;
            }

            setTimeSignature(signature) {
                const [beats, noteValue] = signature.split('/').map(Number);
                this.beatsPerMeasure = beats;
                this.updateBeatIndicator();
                this.updateAccentPattern();
            }

            updateBeatIndicator() {
                const indicator = document.getElementById('beatIndicator');
                indicator.innerHTML = '';

                for (let i = 0; i < this.beatsPerMeasure; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'beat-dot';
                    indicator.appendChild(dot);
                }
            }

            updateAccentPattern() {
                if (!this.accentMode) this.accentMode = 'single';
                this.accentPattern = new Array(this.beatsPerMeasure).fill(false);
                // Modes: single (1 strong), double (1 strong, mid weak), triple (1 strong, 2 weak)
                if (this.accentMode === 'single') {
                    this.accentPattern[0] = true;
                } else if (this.accentMode === 'double') {
                    this.accentPattern[0] = true;
                    this.accentPattern[Math.floor(this.beatsPerMeasure/2)] = true;
                } else if (this.accentMode === 'triple') {
                    this.accentPattern[0] = true;
                    this.accentPattern[Math.floor(this.beatsPerMeasure/3)] = true;
                    this.accentPattern[Math.floor(2*this.beatsPerMeasure/3)] = true;
                }

                const patternDiv = document.getElementById('accentPattern');
                patternDiv.innerHTML = '';

                for (let i = 0; i < this.beatsPerMeasure; i++) {
                    const beat = document.createElement('div');
                    beat.className = 'accent-beat';
                    beat.textContent = i + 1;
                    if (this.accentPattern[i]) {
                        beat.classList.add('accent');
                    }

                    beat.addEventListener('click', () => {
                        this.accentPattern[i] = !this.accentPattern[i];
                        beat.classList.toggle('accent');
                    });

                    patternDiv.appendChild(beat);
                }
            }

            setupEventListeners() {
                // Tempo slider
                document.getElementById('tempoSlider').addEventListener('input', (e) => {
                    this.setTempo(parseInt(e.target.value));
                });
                const tempoInput = document.getElementById('tempoInput');
                if (tempoInput) {
                    tempoInput.addEventListener('input', (e) => {
                        const v = parseInt(e.target.value || 0);
                        if (!isNaN(v)) this.setTempo(v);
                    });
                }

                // Time signature
                document.getElementById('timeSignature').addEventListener('change', (e) => {
                    this.setTimeSignature(e.target.value);
                });

                // Subdivisions
                document.querySelectorAll('.subdivision-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.subdivision-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.subdivision = e.target.dataset.subdivision;
                    });
                });

                // Sound selection
                document.getElementById('soundSelect').addEventListener('change', (e) => {
                    this.sound = e.target.value;
                });

                // Volume control
                document.getElementById('volumeSlider').addEventListener('input', (e) => {
                    this.volume = e.target.value / 100;
                });

                // Polyrhythm controls
                document.getElementById('polyLeft').addEventListener('input', (e) => {
                    this.setupPolyrhythm();
                });

                document.getElementById('polyRight').addEventListener('input', (e) => {
                    this.setupPolyrhythm();
                });
            }

            setupPolyrhythm() {
                const left = parseInt(document.getElementById('polyLeft').value) || 3;
                const right = parseInt(document.getElementById('polyRight').value) || 4;

                // Calculate LCM for polyrhythm pattern
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                const lcm = (a, b) => (a * b) / gcd(a, b);

                const patternLength = lcm(left, right);
                this.polyrhythmPattern = [];

                for (let i = 0; i < patternLength; i++) {
                    const leftHit = i % (patternLength / left) === 0;
                    const rightHit = i % (patternLength / right) === 0;
                    this.polyrhythmPattern.push({ left: leftHit, right: rightHit });
                }
            }

            tapTempo() {
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }

                const now = performance.now();
                this.tapTimes.push(now);

                // Keep only last 5 taps for moving median
                if (this.tapTimes.length > 5) {
                    this.tapTimes.shift();
                }

                if (this.tapTimes.length >= 2) {
                    const intervals = [];
                    for (let i = 1; i < this.tapTimes.length; i++) {
                        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
                    }

                    // Use median for robustness against outliers
                    intervals.sort((a, b) => a - b);
                    const medianInterval = intervals.length % 2 === 0
                        ? (intervals[intervals.length / 2 - 1] + intervals[intervals.length / 2]) / 2
                        : intervals[Math.floor(intervals.length / 2)];

                    if (medianInterval > 0) {
                        const newBpm = Math.round(60000 / medianInterval);
                        if (newBpm >= 40 && newBpm <= 500) {
                            this.setTempo(newBpm);
                        }
                    }
                }

                // Clear taps after 2 seconds of inactivity
                if (this.tapTimeout) clearTimeout(this.tapTimeout);
                this.tapTimeout = setTimeout(() => {
                    this.tapTimes = [];
                }, 2000);
            }

            savePreset() {
                const preset = {
                    bpm: this.bpm,
                    timeSignature: document.getElementById('timeSignature').value,
                    subdivision: this.subdivision,
                    sound: this.sound,
                    volume: this.volume,
                    accentPattern: [...this.accentPattern]
                };

                const input = document.getElementById('presetName');
                const name = input && input.value ? input.value.trim() : '';
                if (!name) {
                    alert('Enter a preset name');
                    return;
                }
                localStorage.setItem(`metronome-preset-${name}`, JSON.stringify(preset));
                this.refreshPresetList(name);
                alert('Preset saved successfully!');
            }

            loadPreset() {
                const list = document.getElementById('presetList');
                const name = list && list.value ? list.value : '';
                if (!name) { alert('Choose a preset to load'); return; }
                const presetData = localStorage.getItem(`metronome-preset-${name}`);
                if (!presetData) { alert('Preset not found!'); return; }
                const preset = JSON.parse(presetData);

                this.setTempo(preset.bpm);
                document.getElementById('timeSignature').value = preset.timeSignature;
                this.setTimeSignature(preset.timeSignature);
                this.subdivision = preset.subdivision;
                this.sound = preset.sound;
                this.volume = preset.volume;

                document.getElementById('soundSelect').value = preset.sound;
                document.getElementById('volumeSlider').value = preset.volume * 100;

                document.querySelectorAll('.subdivision-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.subdivision === preset.subdivision) {
                        btn.classList.add('active');
                    }
                });
                alert('Preset loaded successfully!');
            }

            refreshPresetList(selectName = '') {
                const list = document.getElementById('presetList');
                if (!list) return;
                const keys = Object.keys(localStorage).filter(k => k.startsWith('metronome-preset-'))
                    .map(k => k.replace('metronome-preset-', ''))
                    .sort((a, b) => a.localeCompare(b));
                list.innerHTML = '';
                const placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = 'Select preset';
                list.appendChild(placeholder);
                keys.forEach(name => {
                    const opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name;
                    if (name === selectName) opt.selected = true;
                    list.appendChild(opt);
                });
            }
        }

        // Global functions
        let metronome;
        let isFullscreen = false;

        function initializeMetronome() {
            metronome = new ProfessionalMetronome();
        }

        function toggleMetronome() {
            if (!metronome) {
                initializeMetronome();
            }

            if (metronome.isPlaying) {
                metronome.stop();
            } else {
                metronome.start();
            }
        }

        function adjustTempo(change) {
            if (!metronome) {
                initializeMetronome();
            }
            metronome.setTempo(metronome.bpm + change);
        }

        function setTempo(bpm) {
            if (!metronome) {
                initializeMetronome();
            }
            metronome.setTempo(bpm);
        }

        function setAccentMode(mode) {
            if (!metronome) initializeMetronome();
            metronome.accentMode = mode;
            metronome.updateAccentPattern();
        }

        function tapTempo() {
            if (!metronome) {
                initializeMetronome();
            }
            metronome.tapTempo();
        }

        function savePreset() {
            if (!metronome) {
                initializeMetronome();
            }
            metronome.savePreset();
        }

        function loadPreset() {
            if (!metronome) {
                initializeMetronome();
            }
            metronome.loadPreset();
        }

        function setTheme(name) {
            document.body.classList.remove('theme-sunset', 'theme-aurora');
            if (name === 'sunset') document.body.classList.add('theme-sunset');
            if (name === 'aurora') document.body.classList.add('theme-aurora');
            // Update segmented control selected state
            document.querySelectorAll('.theme-option').forEach(btn => {
                const isSelected = btn.classList.contains(`theme-${name}`);
                btn.classList.toggle('selected', isSelected);
                btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            });
        }

        // Fullscreen controls
        function enterFullscreen() {
            const elem = document.querySelector('.metronome-section');
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
            document.body.classList.add('fullscreen-active');
            const btn = document.getElementById('fullscreenBtn');
            if (btn) btn.textContent = '⤡ Exit';
            isFullscreen = true;
        }
        function exitFullscreen() {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            document.body.classList.remove('fullscreen-active');
            const btn = document.getElementById('fullscreenBtn');
            if (btn) btn.textContent = '⤢ Fullscreen';
            isFullscreen = false;
        }
        function toggleFullscreen() { if (!isFullscreen) enterFullscreen(); else exitFullscreen(); }
        document.addEventListener('fullscreenchange', () => {
            const fs = !!document.fullscreenElement;
            if (!fs) document.body.classList.remove('fullscreen-active');
            const btn = document.getElementById('fullscreenBtn');
            if (btn) btn.textContent = fs ? '⤡ Exit' : '⤢ Fullscreen';
            isFullscreen = fs;
        });

        // Practice timer controls
        let practiceTimerRunning = false;
        let practiceTimerStart = 0;
        let practiceTimerAccum = 0;
        let practiceTimerRAF = null;
        function formatHMS(ms) {
            const total = Math.floor(ms / 1000);
            const h = Math.floor(total / 3600).toString().padStart(2, '0');
            const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(total % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
        }
        function renderPracticeTimer() {
            const el = document.getElementById('timerDisplay');
            if (!el) return;
            let elapsed = practiceTimerAccum;
            if (practiceTimerRunning) elapsed += performance.now() - practiceTimerStart;
            el.textContent = formatHMS(elapsed);
        }
        function tickPracticeTimer() {
            renderPracticeTimer();
            if (practiceTimerRunning) practiceTimerRAF = requestAnimationFrame(tickPracticeTimer);
        }
        function startPracticeTimer() {
            if (practiceTimerRunning) return;
            practiceTimerRunning = true;
            practiceTimerStart = performance.now();
            tickPracticeTimer();
        }
        function pausePracticeTimer() {
            if (!practiceTimerRunning) return;
            practiceTimerRunning = false;
            practiceTimerAccum += performance.now() - practiceTimerStart;
            if (practiceTimerRAF) cancelAnimationFrame(practiceTimerRAF);
            renderPracticeTimer();
        }
        function resetPracticeTimer() {
            practiceTimerRunning = false;
            practiceTimerAccum = 0;
            practiceTimerStart = 0;
            if (practiceTimerRAF) cancelAnimationFrame(practiceTimerRAF);
            renderPracticeTimer();
        }

        function attachTilt(selector) {
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                const damp = 8; // toned down for practicality
                const reset = () => el.style.transform = '';
                el.addEventListener('mousemove', (e) => {
                    const r = el.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width;   // 0..1
                    const y = (e.clientY - r.top) / r.height;   // 0..1
                    const rx = (0.5 - y) * damp;
                    const ry = (x - 0.5) * damp;
                    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
                });
                el.addEventListener('mouseleave', reset);
            });
        }

        // Mobile controls functions
        function toggleMobileControls() {
            const panel = document.querySelector('.controls-panel');
            const overlay = document.querySelector('.mobile-overlay');
            const button = document.querySelector('.mobile-controls-toggle');

            if (panel.classList.contains('open')) {
                closeMobileControls();
            } else {
                panel.classList.add('open');
                overlay.classList.add('active');
                button.style.left = '320px';
            }
        }

        function closeMobileControls() {
            const panel = document.querySelector('.controls-panel');
            const overlay = document.querySelector('.mobile-overlay');
            const button = document.querySelector('.mobile-controls-toggle');

            panel.classList.remove('open');
            overlay.classList.remove('active');
            button.style.left = '20px';
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            // Add click handlers for tempo preset buttons
            document.querySelectorAll('.tempo-preset-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const bpm = parseInt(e.target.textContent.match(/\d+/)[0]);
                    setTempo(bpm);
                });
            });

            // Add visual feedback for button interactions
            document.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.target.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        e.target.style.transform = '';
                    }, 150);
                });
            });

            // Add keyboard shortcuts
            let shortcutsEnabled = true;
            document.addEventListener('keydown', (e) => {
                if (!shortcutsEnabled) return;
                // Prevent default only for our shortcuts
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        toggleMetronome();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        adjustTempo(1);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        adjustTempo(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        adjustTempo(5);
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        adjustTempo(-5);
                        break;
                    case 'KeyT':
                        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault();
                            tapTempo();
                        }
                        break;
                    case 'KeyQ':
                        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault();
                            tapTempo();
                        }
                        break;
                    case 'KeyW':
                        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault();
                            tapTempo();
                        }
                        break;
                    case 'KeyE':
                        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault();
                            tapTempo();
                        }
                        break;
                    case 'KeyR':
                        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault();
                            tapTempo();
                        }
                        break;
                    case 'Enter':
                        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault();
                            tapTempo();
                        }
                        break;
                    case 'Escape':
                        if (window.innerWidth <= 768) {
                            closeMobileControls();
                        }
                        break;
                }
            });

            // Add visual feedback for tap tempo keys
            const tapKeys = ['KeyT', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'Enter'];
            document.addEventListener('keydown', (e) => {
                if (!shortcutsEnabled) return;
                if (tapKeys.includes(e.code)) {
                    const tapButton = document.querySelector('.tap-tempo-btn');
                    if (tapButton) {
                        tapButton.style.transform = 'scale(0.95)';
                        tapButton.style.background = 'linear-gradient(135deg, #ff6b9d, #ffd93d)';
                    }
                }
            });

            document.addEventListener('keyup', (e) => {
                if (!shortcutsEnabled) return;
                if (tapKeys.includes(e.code)) {
                    const tapButton = document.querySelector('.tap-tempo-btn');
                    if (tapButton) {
                        setTimeout(() => {
                            tapButton.style.transform = '';
                            tapButton.style.background = '';
                        }, 150);
                    }
                }
            });

            // Disable shortcuts when typing in inputs/selects
            const focusables = document.querySelectorAll('input, select, textarea');
            focusables.forEach(el => {
                el.addEventListener('focus', () => { shortcutsEnabled = false; });
                el.addEventListener('blur', () => { shortcutsEnabled = true; });
            });

            // Initialize the metronome
            initializeMetronome();
            attachTilt('.card-3d');
            if (metronome && metronome.refreshPresetList) {
                metronome.refreshPresetList();
            }
        });

        // Handle visibility change to pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && metronome && metronome.isPlaying) {
                // Optionally pause when tab is hidden
                // metronome.stop();
            }
        });
        // Register service worker for offline support
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }
