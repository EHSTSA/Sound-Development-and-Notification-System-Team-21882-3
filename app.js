import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// ── Firebase ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDWqSi2Is6YLcwKPf-A2A5ekbk2QEd52MQ",
  authDomain: "tsa-sound-detector.firebaseapp.com",
  projectId: "tsa-sound-detector",
  storageBucket: "tsa-sound-detector.firebasestorage.app",
  messagingSenderId: "895425942202",
  appId: "1:895425942202:web:727262b3c1d2e20e6b2883",
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);

// ── EmailJS ───────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = "TSA-Sound-Detector";
const EMAILJS_TEMPLATE_ID = "template_fa9wwjj";

async function sendEmail(sound, score) {
  const emailSetting = document.getElementById("emailSetting");
  const emailAddressInput = document.getElementById("emailAddress");

  if (!emailSetting || !emailSetting.checked) return;

  const toEmail = emailAddressInput?.value.trim();
  if (!toEmail) {
    addLog("📧 Email failed: no email address entered.");
    return;
  }

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      email: toEmail,
      sound: sound.label,
      emoji: sound.emoji,
      score: score.toFixed(3),
      time: new Date().toLocaleString(),
    });

    addLog(`📧 Email sent for ${sound.label} to ${toEmail}`);
  } catch (e) {
    console.error("EmailJS send failed:", e);
    addLog(`📧 Email failed: ${e?.text || e?.message || "unknown error"}`);
  }
}

// ── Auth DOM ──────────────────────────────────────────────────────────────────
const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");
const authErrorEl = document.getElementById("authError");
const userEmailEl = document.getElementById("userEmail");
const tabSignIn = document.getElementById("tabSignIn");
const tabSignUp = document.getElementById("tabSignUp");
const emailInput = document.getElementById("emailInput");
const passInput = document.getElementById("passInput");
const passConfirmInput = document.getElementById("passConfirmInput");
const signInBtn = document.getElementById("signInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const signOutBtn = document.getElementById("signOutBtn");

// ── Auth helpers ──────────────────────────────────────────────────────────────
function authErr(msg) {
  authErrorEl.textContent = msg;
  authErrorEl.style.display = msg ? "block" : "none";
}

function setBusy(btn, busy) {
  btn.disabled = busy;
  if (!btn._t) btn._t = btn.textContent;
  btn.textContent = busy ? "Please wait…" : btn._t;
}

function niceError(code) {
  return ({
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with that email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error — check your connection.",
  })[code] || `Error: ${code}`;
}

// ── Auth tab switch ───────────────────────────────────────────────────────────
tabSignIn.onclick = () => {
  tabSignIn.classList.add("active");
  tabSignUp.classList.remove("active");
  passConfirmInput.style.display = "none";
  signInBtn.style.display = "block";
  signUpBtn.style.display = "none";
  authErr("");
};

tabSignUp.onclick = () => {
  tabSignUp.classList.add("active");
  tabSignIn.classList.remove("active");
  passConfirmInput.style.display = "block";
  signUpBtn.style.display = "block";
  signInBtn.style.display = "none";
  authErr("");
};

signInBtn.onclick = async () => {
  authErr("");
  setBusy(signInBtn, true);
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passInput.value);
  } catch (e) {
    authErr(niceError(e.code));
  } finally {
    setBusy(signInBtn, false);
  }
};

signUpBtn.onclick = async () => {
  authErr("");
  if (passInput.value !== passConfirmInput.value) {
    authErr("Passwords don't match.");
    return;
  }
  setBusy(signUpBtn, true);
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passInput.value);
  } catch (e) {
    authErr(niceError(e.code));
  } finally {
    setBusy(signUpBtn, false);
  }
};

signOutBtn.onclick = () => {
  stopListening();
  signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (user) {
    authScreen.style.display = "none";
    mainApp.style.display = "block";
    userEmailEl.textContent = user.displayName || user.email;
  } else {
    authScreen.style.display = "flex";
    mainApp.style.display = "none";
    stopListening();
  }
});

// ── Sounds ────────────────────────────────────────────────────────────────────
const SOUNDS = [
  { id: "smoke", idx: [396, 397], label: "Smoke Detector", emoji: "🚨", tier: "danger", notif: "Smoke detector going off!" },
  { id: "siren", idx: [388, 389, 390], label: "Siren", emoji: "🚨", tier: "danger", notif: "Siren detected nearby." },
  { id: "glass", idx: [60, 61], label: "Glass Shatter", emoji: "💥", tier: "danger", notif: "Glass breaking detected!" },
  { id: "baby", idx: [14, 15], label: "Baby Crying", emoji: "👶", tier: "warn", notif: "Baby crying detected." },
  { id: "vehhorn", idx: [325, 326], label: "Vehicle Horn", emoji: "📯", tier: "warn", notif: "Vehicle horn detected." },
  { id: "trainhorn", idx: [302, 303], label: "Train Horn", emoji: "🚂", tier: "warn", notif: "Train horn detected." },
  { id: "reversing", idx: [329], label: "Reversing Beeps", emoji: "🔁", tier: "warn", notif: "Reversing vehicle detected." },
  { id: "doorbell", idx: [379, 380], label: "Doorbell", emoji: "🔔", tier: "info", notif: "Someone rang the doorbell." },
  { id: "knock", idx: [382], label: "Knock", emoji: "✊", tier: "info", notif: "Knock at the door detected." },
  { id: "phone", idx: [400, 401], label: "Telephone Ringing", emoji: "📞", tier: "info", notif: "Telephone ringing." },
  { id: "alarm", idx: [393, 394], label: "Alarm Clock", emoji: "⏰", tier: "info", notif: "Alarm clock going off." },
  { id: "buzzer", idx: [398], label: "Buzzer", emoji: "📳", tier: "info", notif: "Buzzer detected." },
  { id: "microwave", idx: [375], label: "Microwave", emoji: "📡", tier: "info", notif: "Microwave beep detected." },
  { id: "dog", idx: [74, 75, 76], label: "Dog Barking", emoji: "🐕", tier: "info", notif: "Dog barking detected." },
  { id: "vacuum", idx: [373], label: "Vacuum Cleaner", emoji: "🌀", tier: "info", notif: "Vacuum cleaner detected." },
];

const enabled = Object.fromEntries(SOUNDS.map(s => [s.id, true]));

// ── App DOM ───────────────────────────────────────────────────────────────────
const statusEl = document.getElementById("status");
const statusOrb = document.getElementById("statusOrb");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const alertBox = document.getElementById("alertBox");
const eventLog = document.getElementById("eventLog");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const notifSetting = document.getElementById("notifSetting");
const darkSetting = document.getElementById("darkSetting");
const thresholdSlider = document.getElementById("thresholdSlider");
const thresholdVal = document.getElementById("thresholdVal");
const clearLogBtn = document.getElementById("clearLog");

// ── Sound toggles ─────────────────────────────────────────────────────────────
(function buildToggles() {
  const container = document.getElementById("soundToggles");

  [
    ["🚨 Emergency", "danger"],
    ["⚠️ Traffic & Safety", "warn"],
    ["ℹ️ Everyday", "info"]
  ].forEach(([label, tier]) => {
    const hdr = document.createElement("div");
    hdr.className = "sound-group-label";
    hdr.textContent = label;
    container.appendChild(hdr);

    SOUNDS.filter(s => s.tier === tier).forEach(s => {
      const row = document.createElement("div");
      row.className = "setting-row";
      row.innerHTML = `
        <div class="setting-label">${s.emoji} ${s.label}</div>
        <label class="toggle">
          <input type="checkbox" id="snd-${s.id}" checked>
          <span class="toggle-slider"></span>
        </label>
      `;
      container.appendChild(row);

      row.querySelector("input").onchange = e => {
        enabled[s.id] = e.target.checked;
      };
    });
  });
})();

// ── UI helpers ────────────────────────────────────────────────────────────────
function addLog(msg) {
  const ts = new Date().toLocaleTimeString();
  eventLog.textContent += `[${ts}] ${msg}\n`;
  eventLog.scrollTop = eventLog.scrollHeight;
}

clearLogBtn.onclick = () => {
  eventLog.textContent = "";
};

settingsBtn.onclick = () => {
  settingsPanel.style.display = settingsPanel.style.display === "block" ? "none" : "block";
};

darkSetting.onchange = () => {
  document.body.classList.toggle("dark", darkSetting.checked);
};

thresholdSlider.oninput = () => {
  THRESHOLD = parseFloat(thresholdSlider.value);
  thresholdVal.textContent = THRESHOLD.toFixed(2);
};

let alertTO;

function showAlert(sound, score) {
  clearTimeout(alertTO);
  alertBox.className = `alert-${sound.tier}`;
  alertBox.textContent = `${sound.emoji}  ${sound.label} detected (${score.toFixed(3)})`;
  alertBox.style.display = "block";
  alertBox.style.animation = "none";
  void alertBox.offsetWidth;
  alertBox.style.animation = "";
  alertTO = setTimeout(() => {
    alertBox.style.display = "none";
  }, 8000);
}

async function notify(sound) {
  if (!notifSetting.checked || !("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission === "granted") {
    new Notification(`${sound.emoji} ${sound.label}`, {
      body: sound.notif
    });
  }
}

function beep(tier) {
  try {
    if (!audioCtx || audioCtx.state === "closed") return;

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.frequency.value = tier === "danger" ? 880 : tier === "warn" ? 660 : 440;
    o.type = tier === "danger" ? "square" : "sine";

    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);

    o.connect(g);
    g.connect(audioCtx.destination);

    o.start();
    o.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.error("Beep error:", e);
  }
}

// ── YAMNet ────────────────────────────────────────────────────────────────────
const YAMNET_SR = 16000;
const WINDOW_S = 1.5;
const POLL_MS = 750;
const COOLDOWN = 3000;
const MODEL_URL = "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1";
let THRESHOLD = 0.20;

let model = null;
let audioCtx = null;
let micStream = null;
let srcNode = null;
let procNode = null;
let silentGain = null;
let samples = [];
let nativeSR = 44100;
let timer = null;
let listening = false;
let lastHit = 0;

async function loadModel() {
  statusEl.textContent = "Loading YAMNet…";
  addLog("Fetching YAMNet from TF Hub…");
  model = await window.tf.loadGraphModel(MODEL_URL, { fromTFHub: true });
  addLog("YAMNet ready — 15 sound classes active.");
  statusEl.textContent = "Ready";
}

async function resample(buf, fromSR) {
  if (fromSR === YAMNET_SR) return buf;

  const outLen = Math.ceil(buf.length * YAMNET_SR / fromSR);

  const tmp = new OfflineAudioContext(1, buf.length, fromSR);
  const src = tmp.createBuffer(1, buf.length, fromSR);
  src.getChannelData(0).set(buf);

  const dst = new OfflineAudioContext(1, outLen, YAMNET_SR);
  const n = dst.createBufferSource();
  n.buffer = src;
  n.connect(dst.destination);
  n.start(0);

  return (await dst.startRendering()).getChannelData(0);
}

async function runInference() {
  if (!model || !listening) return;

  const need = Math.ceil(nativeSR * WINDOW_S);
  if (samples.length < need) return;

  const snap = Float32Array.from(samples.slice(-need));

  let wv, s0, sm, arr;
  try {
    const s16 = await resample(snap, nativeSR);
    const cl = s16.map(v => Math.max(-1, Math.min(1, v)));
    wv = window.tf.tensor1d(cl);
    const out = model.execute({ waveform: wv });
    s0 = Array.isArray(out) ? out[0] : out;
    sm = window.tf.mean(s0, 0);
    arr = await sm.array();
  } catch (e) {
    addLog("Inference error: " + e.message);
    return;
  } finally {
    wv?.dispose();
    s0?.dispose();
    sm?.dispose();
  }

  const now = Date.now();
  if (now - lastHit <= COOLDOWN) return;

  const top5 = arr.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log("Top-5 YAMNet:", top5.map(([i, v]) => `[${i}] ${v.toFixed(3)}`).join("  "));

  let best = null;
  let bestScore = 0;

  for (const s of SOUNDS) {
    if (!enabled[s.id]) continue;
    const sc = Math.max(...s.idx.map(i => arr[i] ?? 0));
    if (sc >= THRESHOLD && sc > bestScore) {
      best = s;
      bestScore = sc;
    }
  }

  if (best) {
    lastHit = now;
    showAlert(best, bestScore);
    addLog(`${best.emoji} ${best.label} — score ${bestScore.toFixed(3)}`);
    beep(best.tier);
    notify(best);
    await sendEmail(best, bestScore);
    await flashScreen(3);
  }
}

async function startListening() {
  if (!model) await loadModel();
  if (listening) return;

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      },
      video: false
    });
  } catch (e) {
    addLog("Mic error: " + e.message);
    statusEl.textContent = "Mic denied";
    return;
  }

  try {
    micStream = stream;
    audioCtx = new AudioContext();

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    nativeSR = audioCtx.sampleRate;
    samples = [];

    srcNode = audioCtx.createMediaStreamSource(stream);
    procNode = audioCtx.createScriptProcessor(4096, 1, 1);
    silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;

    const maxBuf = nativeSR * 6;
    procNode.onaudioprocess = e => {
      const chunk = e.inputBuffer.getChannelData(0);
      samples.push(...chunk);
      if (samples.length > maxBuf) {
        samples = samples.slice(samples.length - maxBuf);
      }
    };

    srcNode.connect(procNode);
    procNode.connect(silentGain);
    silentGain.connect(audioCtx.destination);

    listening = true;
    timer = setInterval(runInference, POLL_MS);
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.textContent = "Listening…";
    statusOrb.classList.add("listening");
    addLog(`Mic active at ${nativeSR} Hz → 16 kHz.`);
  } catch (e) {
    console.error("AudioContext/startListening error:", e);
    addLog("Audio system error: " + e.message);
    statusEl.textContent = "Audio error";
    stopListening();
  }
}

function stopListening() {
  clearInterval(timer);
  timer = null;

  try {
    procNode && (procNode.onaudioprocess = null);
    procNode?.disconnect();
  } catch {}

  try {
    srcNode?.disconnect();
  } catch {}

  try {
    silentGain?.disconnect();
  } catch {}

  try {
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
    }
  } catch {}

  try {
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close();
    }
  } catch {}

  procNode = null;
  srcNode = null;
  silentGain = null;
  micStream = null;
  audioCtx = null;
  samples = [];
  listening = false;

  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
  if (statusEl) statusEl.textContent = "Stopped";
  if (statusOrb) statusOrb.classList.remove("listening");

  addLog("Stopped.");
}

startBtn.onclick = startListening;
stopBtn.onclick = stopListening;

async function flashScreen(times = 3) {
  const overlay = document.getElementById("flashOverlay");
  if (!overlay) return;

  for (let i = 0; i < times; i++) {
    overlay.style.opacity = "1";
    await new Promise(r => setTimeout(r, 100)); // flash on

    overlay.style.opacity = "0";
    await new Promise(r => setTimeout(r, 150)); // flash off
  }
}
