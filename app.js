const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const alertBox = document.getElementById('alertBox');
const eventLog = document.getElementById('eventLog');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const notifSetting = document.getElementById('notifSetting');
const darkSetting = document.getElementById('darkSetting');

let recognizer = null;
let listening = false;

const LABEL_DOORBELL = "Doorbell";
const LABEL_FIRE = "Fire Alarm";
const THRESHOLD = 0.7;
let lastTrigger = 0;
const COOLDOWN = 2500;

function addLog(message) {
  const ts = new Date().toLocaleTimeString();
  eventLog.textContent += `[${ts}] ${message}\n`;
  eventLog.scrollTop = eventLog.scrollHeight;
}

settingsBtn.onclick = () => {
  settingsPanel.style.display =
    settingsPanel.style.display === "none" ? "block" : "none";
};

darkSetting.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkSetting.checked);
});

async function sendNotification(title, body) {
  if (!notifSetting.checked) return;
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function playFireTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.type = "square";
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 600);
  } catch (e) {}
}

async function loadModel() {
  statusEl.textContent = "Loading model...";

  const base = window.location.origin +
    window.location.pathname.replace(/\/[^\/]*$/, "/");

  recognizer = speechCommands.create(
    "BROWSER_FFT",
    null,
    base + "model.json",
    base + "metadata.json"
  );

  await recognizer.ensureModelLoaded();
  statusEl.textContent = "Model loaded";

  addLog("Model loaded.");
}

async function startListening() {
  if (!recognizer) await loadModel();
  if (listening) return;

  startBtn.disabled = true;
  stopBtn.disabled = false;
  listening = true;
  statusEl.textContent = "Listening...";

  recognizer.listen(result => {
    const scores = result.scores;
    const labels = recognizer.wordLabels();

    const maxProb = Math.max(...scores);
    const label = labels[scores.indexOf(maxProb)];

    const now = Date.now();
    if (maxProb >= THRESHOLD && now - lastTrigger > COOLDOWN) {
      lastTrigger = now;

      if (label === LABEL_DOORBELL) {
        const p = maxProb.toFixed(2);
        alertBox.style.display = "block";
        alertBox.className = "alert-door";
        alertBox.textContent = `Doorbell detected! (${p})`;
        addLog(`Doorbell detected (${p})`);
        sendNotification("Doorbell Alert", "Someone rang the doorbell.");
      }

      if (label === LABEL_FIRE) {
        const p = maxProb.toFixed(2);
        alertBox.style.display = "block";
        alertBox.className = "alert-fire";
        alertBox.textContent = `FIRE ALARM detected! (${p})`;
        addLog(`FIRE ALARM detected (${p})`);
        playFireTone();
        sendNotification("Fire Alarm", "Fire alarm detected in the area.");
      }
    }

  }, {
    includeSpectrogram: true,
    probabilityThreshold: 0,
    overlapFactor: 0.5,
    invokeCallbackOnNoiseAndUnknown: true
  });
}

function stopListening() {
  if (!recognizer || !listening) return;
  recognizer.stopListening();
  listening = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = "Stopped";
}

startBtn.onclick = startListening;
stopBtn.onclick = stopListening;
