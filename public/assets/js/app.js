
import { DB } from './db.js';
import { API } from './api.js';

const $ = (id) => document.getElementById(id);
const screens = {
  welcome: $("screen-welcome"),
  auth: $("screen-auth"),
  consent: $("screen-consent"),
  surveys: $("screen-surveys"),
  quiz: $("screen-quiz"),
  finish: $("screen-finish"),
};
function show(name) { Object.values(screens).forEach(s => s.classList.remove("active")); screens[name].classList.add("active"); }

const netBadge = $("net-badge");
const btnSync = $("btn-sync");
const btnSalir = $("btn-salir");
const authMsg = $("auth-msg");
const consentMsg = $("consent-msg");
const surveysMsg = $("surveys-msg");
const pendingBadge = $("pending-badge");
const surveyList = $("survey-list");
const quizTitle = $("quiz-title");
const quizPoints = $("quiz-points");
const quizProgress = $("quiz-progress");
const bar = $("bar");
const qText = $("q-text");
const qHelp = $("q-help");
const opts = $("opts");
const quizStatus = $("quiz-status");
const finishPoints = $("finish-points");
const finishPending = $("finish-pending");

let token = localStorage.getItem("pw_participant_token") || null;
let participantCode = localStorage.getItem("pw_participant_code") || null;

let currentSurvey = null;
let currentQuestions = [];
let currentIndex = 0;
let points = 0;
let sessionUUID = null;

function setMsg(el, text, ok = true) {
  el.innerHTML = `<div class="toast-mini" style="border-color:${ok ? 'rgba(0,255,120,.25)' : 'rgba(255,80,80,.25)'}">${text}</div>`;
}
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }

function setNetUI() {
  const online = navigator.onLine;
  netBadge.classList.toggle("online", online);
  netBadge.classList.toggle("offline", !online);
  netBadge.textContent = online ? "● Online" : "● Offline";
}
window.addEventListener("online", () => { setNetUI(); autoSyncSoon(); });
window.addEventListener("offline", () => { setNetUI(); refreshPending(); });
setNetUI();

async function refreshPending() {
  const n = await DB.countPending();
  pendingBadge.textContent = `Pendientes: ${n}`;
  finishPending.textContent = `Pendientes: ${n}`;
}
refreshPending();

async function boot() {
  if (token) { btnSalir.classList.remove("d-none"); await goSurveys(); }
  else show("welcome");
}
boot();

$("btn-participante").addEventListener("click", () => show("auth"));
$("btn-auth-back").addEventListener("click", () => show("welcome"));
btnSalir.addEventListener("click", () => {
  localStorage.removeItem("pw_participant_token");
  localStorage.removeItem("pw_participant_code");
  token = null; participantCode = null;
  btnSalir.classList.add("d-none");
  show("welcome");
});

$("btn-p-register").addEventListener("click", async () => {
  authMsg.innerHTML = "";
  const code = $("p-code").value.trim();
  const pin = $("p-pin").value.trim();
  if (!code || !pin) return setMsg(authMsg, "Debes escribir código y PIN.", false);
  try { await API.participantRegister(code, pin); setMsg(authMsg, "Registro exitoso. Ahora inicia sesión.", true); }
  catch (e) { setMsg(authMsg, e.message, false); }
});

$("btn-p-login").addEventListener("click", async () => {
  authMsg.innerHTML = "";
  const code = $("p-code").value.trim();
  const pin = $("p-pin").value.trim();
  if (!code || !pin) return setMsg(authMsg, "Debes escribir código y PIN.", false);
  try {
    const r = await API.participantLogin(code, pin);
    token = r.token; participantCode = r.code;
    localStorage.setItem("pw_participant_token", token);
    localStorage.setItem("pw_participant_code", participantCode);
    btnSalir.classList.remove("d-none");
    setMsg(authMsg, "Sesión iniciada.", true);
    show("consent");
  } catch (e) { setMsg(authMsg, e.message, false); }
});

$("btn-consent-accept").addEventListener("click", async () => {
  consentMsg.innerHTML = "";
  try { await API.submitConsent(token, true); setMsg(consentMsg, "Consentimiento registrado.", true); await goSurveys(); }
  catch (e) { setMsg(consentMsg, e.message, false); }
});
$("btn-consent-decline").addEventListener("click", () => setMsg(consentMsg, "Sin consentimiento no podemos recolectar datos. Puedes salir.", false));

async function goSurveys() {
  show("surveys");
  surveysMsg.innerHTML = "";
  await refreshPending();
  try {
    const r = await API.listSurveys(token);
    renderSurveyList(r.surveys || []);
  } catch (e) { setMsg(surveysMsg, e.message, false); }
}

function renderSurveyList(list) {
  surveyList.innerHTML = "";
  if (!list.length) { surveyList.innerHTML = `<div class="text-white-75">No hay encuestas activas todavía.</div>`; return; }
  list.forEach((s) => {
    const div = document.createElement("div");
    div.className = "survey-card";
    div.innerHTML = `
      <div class="survey-title">${escapeHtml(s.title)}</div>
      <div class="survey-desc">${escapeHtml(s.description || "Sin descripción")}</div>
      <div class="mt-2 text-white-50 small">ID: ${s.id}</div>
    `;
    div.addEventListener("click", () => startSurvey(s.id));
    surveyList.appendChild(div);
  });
}

async function startSurvey(id) {
  show("quiz"); quizStatus.textContent = "";
  points = 0; currentIndex = 0; sessionUUID = crypto.randomUUID();
  try {
    const r = await API.getSurvey(token, id);
    currentSurvey = r.survey; currentQuestions = r.questions || [];
    quizTitle.textContent = currentSurvey ? currentSurvey.title : "Encuesta";
    renderQuestion();
  } catch (e) { setMsg(surveysMsg, e.message, false); show("surveys"); }
}

function renderQuestion() {
  const total = currentQuestions.length || 0;
  quizProgress.textContent = `${Math.min(currentIndex + 1, total)}/${total}`;
  quizPoints.textContent = `Puntos: ${points}`;
  bar.style.width = total ? `${Math.round((currentIndex / total) * 100)}%` : "0%";
  if (currentIndex >= total) return finishSurvey();

  const q = currentQuestions[currentIndex];
  qText.textContent = q.text;
  qHelp.textContent = q.qtype === "single" ? "Selecciona una opción" : (q.qtype === "text" ? "Escribe tu respuesta" : "Escribe un número");
  opts.innerHTML = "";

  if (q.qtype === "single") {
    const letters = ["A","B","C","D","E","F"];
    (q.options || []).forEach((opt, idx) => {
      const btn = document.createElement("div");
      btn.className = `opt-btn alt${(idx % 4) + 1}`;
      btn.innerHTML = `<div class="opt-letter">${letters[idx] || "•"}</div><div>${escapeHtml(opt.label)}</div>`;
      btn.addEventListener("click", () => answer({ option_id: opt.id }));
      opts.appendChild(btn);
    });
  } else if (q.qtype === "text") {
    opts.innerHTML = `
      <textarea id="txt-answer" class="form-control" rows="4" placeholder="Escribe aquí..."></textarea>
      <div class="d-flex justify-content-end mt-2">
        <button id="btn-send-text" class="btn btn-glow">Enviar</button>
      </div>
    `;
    $("btn-send-text").onclick = () => {
      const v = $("txt-answer").value.trim();
      if (!v) return (quizStatus.textContent = "Escribe una respuesta.");
      answer({ text_value: v });
    };
  } else {
    opts.innerHTML = `
      <input id="num-answer" class="form-control" type="number" placeholder="0" />
      <div class="d-flex justify-content-end mt-2">
        <button id="btn-send-num" class="btn btn-glow">Enviar</button>
      </div>
    `;
    $("btn-send-num").onclick = () => {
      const raw = $("num-answer").value;
      if (raw === "" || raw === null) return (quizStatus.textContent = "Escribe un número.");
      const v = Number(raw);
      if (Number.isNaN(v)) return (quizStatus.textContent = "Número inválido.");
      answer({ number_value: v });
    };
  }
}

async function answer({ option_id = null, text_value = null, number_value = null } = {}) {
  const q = currentQuestions[currentIndex];
  const payload = {
    uuid: crypto.randomUUID(),
    session_uuid: sessionUUID,
    survey_id: currentSurvey.id,
    question_id: q.id,
    option_id,
    text_value,
    number_value,
    answered_at: new Date().toISOString(),
    participant_code: participantCode
  };
  await DB.enqueue(payload);
  points += 100;
  quizStatus.textContent = "✔ Guardado";
  await refreshPending();
  currentIndex++;
  renderQuestion();
  autoSyncSoon();
}

$("btn-quit-quiz").addEventListener("click", async () => { show("surveys"); await goSurveys(); });

function finishSurvey() {
  bar.style.width = "100%";
  finishPoints.textContent = String(points);
  show("finish");
  refreshPending();
}

btnSync.addEventListener("click", () => syncNow(true));
$("btn-finish-sync").addEventListener("click", () => syncNow(true));
$("btn-finish-back").addEventListener("click", () => goSurveys());

let syncTimer = null;
function autoSyncSoon() {
  if (!navigator.onLine || !token) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(false), 1200);
}

async function syncNow(showAlerts = false) {
  if (!token) return;
  if (!navigator.onLine) { if (showAlerts) alert("Estás offline. Se sincroniza cuando vuelva internet."); return; }
  try {
    const pending = await DB.pending(250);
    if (!pending.length) { if (showAlerts) alert("No hay pendientes."); return; }
    const res = await API.sendBatch(token, { items: pending });
    const received = res.received || [];
    await DB.markSynced(received);
    await DB.cleanupSynced();
    await refreshPending();
    if (showAlerts) alert(`Sincronizado: ${received.length} respuestas.`);
  } catch (e) {
    if (showAlerts) alert(`No se pudo sincronizar: ${e.message}`);
  }
}

setInterval(() => { if (navigator.onLine && token) syncNow(false); }, 30000);
// ====== ESCANEO QR (offline) ======
const qrModal = document.getElementById("qr-modal");
const qrVideo = document.getElementById("qr-video");
const qrMsg = document.getElementById("qr-scan-msg");
let qrStream = null;
let qrLoop = null;

function openQRModal(){
  qrModal.style.display = "block";
  qrMsg.textContent = "";
}
function closeQRModal(){
  qrModal.style.display = "none";
  stopQRScanner();
}

async function startQRScanner(){
  // BarcodeDetector funciona en Chrome/Edge (Android/PC). En otros navegadores puede no estar.
  if (!("BarcodeDetector" in window)) {
    qrMsg.textContent = "Tu navegador no soporta escaneo QR. Escribe código y PIN manualmente.";
    return;
  }

  try{
    qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    qrVideo.srcObject = qrStream;
    await qrVideo.play();

    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    qrLoop = setInterval(async () => {
      try{
        if (qrVideo.readyState < 2) return;
        canvas.width = qrVideo.videoWidth;
        canvas.height = qrVideo.videoHeight;
        ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);

        const bitmap = await createImageBitmap(canvas);
        const codes = await detector.detect(bitmap);

        if (codes && codes.length) {
          const raw = (codes[0].rawValue || "").trim();

          // Formato esperado: PW|CODIGO|PIN
          if (raw.startsWith("PW|")) {
            const parts = raw.split("|");
            const code = parts[1] || "";
            const pin  = parts[2] || "";

            document.getElementById("p-code").value = code;
            document.getElementById("p-pin").value = pin;

            qrMsg.textContent = "QR leído. Código y PIN rellenados ✅";
            setTimeout(() => closeQRModal(), 700);
          } else {
            qrMsg.textContent = "QR no válido. Debe iniciar con PW|";
          }
        }
      } catch(e){}
    }, 250);

    qrMsg.textContent = "Escaneando…";
  } catch(e){
    qrMsg.textContent = "No se pudo acceder a la cámara. Permite el permiso y prueba de nuevo.";
  }
}

function stopQRScanner(){
  if (qrLoop) { clearInterval(qrLoop); qrLoop = null; }
  if (qrStream) {
    qrStream.getTracks().forEach(t => t.stop());
    qrStream = null;
  }
  if (qrVideo) qrVideo.srcObject = null;
}

// Botones
document.getElementById("btn-scan-qr")?.addEventListener("click", () => {
  openQRModal();
  startQRScanner();
});
document.getElementById("btn-close-qr")?.addEventListener("click", closeQRModal);