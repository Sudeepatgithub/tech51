
// Constants and Defaults
const MODES = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

const DEFAULTS = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStart: false,
    notifications: false,
    darkTheme: true
};

// State
let state = {
    mode: 'pomodoro',
    timeLeft: MODES.pomodoro * 60,
    isRunning: false,
    pomodorosCompleted: 0,
    lastFrameTime: null,
    settings: { ...DEFAULTS }
};

// Audio Context (created on first user interaction)
let audioCtx = null;

// DOM Elements
const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const skipBtn = document.getElementById('skip-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsToggle = document.getElementById('settings-toggle');
const saveSettingsBtn = document.getElementById('save-settings');
const resetSettingsBtn = document.getElementById('reset-settings');
const nextSessionIndicator = document.getElementById('next-session-indicator');
const cycleCount = document.getElementById('cycle-count');
const themeToggle = document.getElementById('theme-toggle');

// Helper: Format time as mm:ss
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Logic: Notification Sound (Simple Beep)
function playNotificationSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Create oscillator
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

// Logic: Desktop Notifications
function sendNotification(title, body) {
    if (state.settings.notifications && Notification.permission === "granted") {
        new Notification(title, { body, icon: '/favicon.ico' }); // generic icon
    }
}

// Init
function init() {
    loadSettings();
    render();
    applyTheme();

    // Request notification permission if enabled
    if (state.settings.notifications && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// Persist & Load
function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(state.settings));
    localStorage.setItem('pomodoroStats', JSON.stringify({ pomodorosCompleted: state.pomodorosCompleted }));
}

function loadSettings() {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
        state.settings = { ...DEFAULTS, ...JSON.parse(saved) };
    }

    const stats = localStorage.getItem('pomodoroStats');
    if (stats) {
        state.pomodorosCompleted = JSON.parse(stats).pomodorosCompleted || 0;
    }

    // Initialize time based on saved mode setting duration
    resetTimer(false);

    // Populate Settings UI
    document.getElementById('setting-pomodoro').value = state.settings.pomodoro;
    document.getElementById('setting-shortBreak').value = state.settings.shortBreak;
    document.getElementById('setting-longBreak').value = state.settings.longBreak;
    document.getElementById('setting-longBreakInterval').value = state.settings.longBreakInterval;
    document.getElementById('setting-autoStart').checked = state.settings.autoStart;
    document.getElementById('setting-notifications').checked = state.settings.notifications;
}

// Timer Loop (High Precision)
function tick(timestamp) {
    if (!state.isRunning) {
        state.lastFrameTime = null;
        return;
    }

    if (!state.lastFrameTime) state.lastFrameTime = timestamp;
    const delta = (timestamp - state.lastFrameTime) / 1000;

    if (delta >= 1) {
        state.timeLeft -= 1;
        state.lastFrameTime = timestamp; // catch up
        // Or strictly: state.lastFrameTime += 1000 (if using ms) to avoid drift
        // But basic delta > 1s subtraction is "ok" for this, better is target-time.
        // Let's refine to be resilient to background throttling:
        // Actually, let's just use the timestamps given by requestAnimationFrame
        // but that stops in background.
        // Use Date.now() for robustness!
    }

    // Correction for robust background timing:
    // This loop just updates the UI. The actual logic should check Date.now()

    requestAnimationFrame(tick);
}

// Interval implementation using Date.now() to prevent drift
let timerInterval;
function startTimer() {
    if (state.isRunning) return;

    // Resume audio context if needed
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    state.isRunning = true;
    updateControls();

    const targetTime = Date.now() + (state.timeLeft * 1000);

    timerInterval = setInterval(() => {
        const now = Date.now();
        const left = Math.ceil((targetTime - now) / 1000);

        if (left <= 0) {
            clearInterval(timerInterval);
            state.timeLeft = 0;
            completeSession();
        } else {
            state.timeLeft = left;
        }
        render();
    }, 100); // Check frequently
}

function stopTimer() {
    state.isRunning = false;
    clearInterval(timerInterval);
    updateControls();
}

function resetTimer(autoStart = false) {
    stopTimer();
    const duration = state.settings[state.mode]; // get duration in minutes
    state.timeLeft = duration * 60;
    render();
    if (autoStart && state.settings.autoStart) {
        startTimer();
    }
}

function completeSession() {
    playNotificationSound();

    let nextMode = '';
    let msg = '';

    if (state.mode === 'pomodoro') {
        state.pomodorosCompleted++;
        saveSettings(); // save stats

        if (state.pomodorosCompleted % state.settings.longBreakInterval === 0) {
            nextMode = 'longBreak';
            msg = "Time for a long break!";
        } else {
            nextMode = 'shortBreak';
            msg = "Time for a short break!";
        }
        sendNotification("Pomodoro Complete!", msg);
    } else {
        // Break is over
        nextMode = 'pomodoro';
        msg = "Back to work!";
        sendNotification("Break Over!", msg);
    }

    switchMode(nextMode);

    if (state.settings.autoStart) {
        startTimer();
    }
}

function switchMode(newMode) {
    state.mode = newMode;
    // Update body attribute for theme colors
    document.body.setAttribute('data-mode', newMode);

    // Highlight button
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    resetTimer(); // resets time based on new mode
}

// View Updates
function render() {
    timeDisplay.textContent = formatTime(state.timeLeft);
    const modeName = state.mode === 'pomodoro' ? 'Pomodoro' : state.mode === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.title = `${formatTime(state.timeLeft)} - ${modeName}`;

    cycleCount.textContent = state.pomodorosCompleted;

    // Predict next
    if (state.mode === 'pomodoro') {
        const untilLong = state.settings.longBreakInterval - (state.pomodorosCompleted % state.settings.longBreakInterval);
        if (untilLong === 1 || (state.pomodorosCompleted > 0 && (state.pomodorosCompleted + 1) % state.settings.longBreakInterval === 0)) {
            // Logic check: if we just finished 3, next is 4 (which triggers long). 
            // Actually, if we are IN pomodoro, and we complete it, we check (completed + 1).
            // Simpler: Just check what comes AFTER this one.
            if ((state.pomodorosCompleted + 1) % state.settings.longBreakInterval === 0) {
                nextSessionIndicator.textContent = "Next: Long Break";
            } else {
                nextSessionIndicator.textContent = "Next: Short Break";
            }
        } else {
            nextSessionIndicator.textContent = "Next: Short Break";
        }
    } else {
        nextSessionIndicator.textContent = "Next: Pomodoro";
    }
}

function updateControls() {
    if (state.isRunning) {
        startBtn.textContent = "Pause";
        startBtn.classList.remove('primary-btn'); // optional styling change?
        document.body.classList.add('timer-running');
    } else {
        startBtn.textContent = "Start";
        startBtn.classList.add('primary-btn');
        document.body.classList.remove('timer-running');
    }
}

function applyTheme() {
    if (state.settings.darkTheme) {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = `<svg class="sun-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    } else {
        document.body.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = `<svg class="moon-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (state.isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', () => {
    if (confirm("Reset current timer?")) {
        resetTimer();
    }
});

skipBtn.addEventListener('click', () => {
    stopTimer();
    completeSession(); // Manually trigger completion logic (advances mode)
});

modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        if (state.isRunning && !confirm("Timer is running. Switch modes?")) return;
        switchMode(mode);
    });
});

settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
});

// Settings Inputs
saveSettingsBtn.addEventListener('click', () => {
    state.settings.pomodoro = parseInt(document.getElementById('setting-pomodoro').value);
    state.settings.shortBreak = parseInt(document.getElementById('setting-shortBreak').value);
    state.settings.longBreak = parseInt(document.getElementById('setting-longBreak').value);
    state.settings.longBreakInterval = parseInt(document.getElementById('setting-longBreakInterval').value);
    state.settings.autoStart = document.getElementById('setting-autoStart').checked;
    state.settings.notifications = document.getElementById('setting-notifications').checked;

    if (state.settings.notifications && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    saveSettings();
    settingsPanel.classList.add('hidden');
    resetTimer(); // Apply new durations immediately
});

resetSettingsBtn.addEventListener('click', () => {
    if (confirm("Reset all settings to default?")) {
        state.settings = { ...DEFAULTS };
        saveSettings();
        loadSettings(); // re-populate UI
        applyTheme();
    }
});

themeToggle.addEventListener('click', () => {
    state.settings.darkTheme = !state.settings.darkTheme;
    applyTheme();
    saveSettings();
});

// Start
init();
