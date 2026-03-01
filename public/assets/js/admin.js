
import { API } from './api.js';
const $ = (id) => document.getElementById(id);

const screens = { login: $("admin-login"), dash: $("admin-dashboard") };
function show(name){ Object.values(screens).forEach(s=>s.classList.remove("active")); screens[name].classList.add("active"); }

const adminMsg = $("admin-msg");
const adminCreateMsg = $("admin-create-msg");
const adminQMsg = $("admin-q-msg");
const adminListMsg = $("admin-list-msg");
const btnLogout = $("btn-admin-logout");
const adminPMsg = document.getElementById("admin-p-msg");
const adminPTable = document.getElementById("admin-p-table");
let token = localStorage.getItem("pw_admin_token") || null;
function setMsg(el, text, ok = true){ el.innerHTML = `<div class="toast-mini" style="border-color:${ok?'rgba(0,255,120,.25)':'rgba(255,80,80,.25)'}">${text}</div>`; }
function escapeHtml(str){ return String(str).replace(/[&<>"']/g,(m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }

$("btn-admin-back").addEventListener("click", () => window.location.href="./index.html");

$("btn-admin-login").addEventListener("click", async () => {
  adminMsg.innerHTML = "";
  try{
    const email = $("a-email").value.trim();
    const pass = $("a-pass").value.trim();
    if(!email || !pass) return setMsg(adminMsg, "Completa correo y contraseña.", false);
    const r = await API.adminLogin(email, pass);
    token = r.token;
    localStorage.setItem("pw_admin_token", token);
    btnLogout.classList.remove("d-none");
    setMsg(adminMsg, "Sesión iniciada.", true);
    await bootDash();
  }catch(e){ setMsg(adminMsg, e.message, false); }
});

btnLogout.addEventListener("click", async () => {
  try{ if(token) await API.adminLogout(token); }catch(e){}
  token=null; localStorage.removeItem("pw_admin_token");
  btnLogout.classList.add("d-none");
  show("login");
});

async function bootDash(){
  show("dash");
  $("btn-export").href = API.adminExportUrl(token);
  await refreshSurveys();
}

async function refreshSurveys(){
  adminListMsg.innerHTML="";
  try{
    const r = await API.adminListSurveys(token);
    renderSurveys(r.surveys||[]);
    fillSelect(r.surveys||[]);
  }catch(e){ setMsg(adminListMsg, e.message, false); }
}

function renderSurveys(list){
  const wrap = $("admin-survey-list");
  wrap.innerHTML="";
  if(!list.length){ wrap.innerHTML = `<div class="text-white-75">No hay encuestas.</div>`; return; }
  list.forEach(s=>{
    const div=document.createElement("div");
    div.className="survey-card";
    div.innerHTML = `
      <div class="survey-title">${escapeHtml(s.title)}</div>
      <div class="survey-desc">${escapeHtml(s.description||"Sin descripción")}</div>
      <div class="mt-2 text-white-50 small">ID: ${s.id} • Preguntas: ${s.question_count}</div>`;
    wrap.appendChild(div);
  });
}

function fillSelect(list){
  const sel=$("q-survey");
  sel.innerHTML="";
  list.forEach(s=>{
    const o=document.createElement("option");
    o.value=s.id;
    o.textContent = `${s.title} (ID ${s.id})`;
    sel.appendChild(o);
  });
}

$("btn-refresh").addEventListener("click", refreshSurveys);

$("btn-create-survey").addEventListener("click", async ()=>{
  adminCreateMsg.innerHTML="";
  try{
    const title=$("s-title").value.trim();
    const desc=$("s-desc").value.trim();
    if(!title) return setMsg(adminCreateMsg, "El título es obligatorio.", false);
    await API.adminCreateSurvey(token, title, desc);
    setMsg(adminCreateMsg, "Encuesta creada.", true);
    $("s-title").value=""; $("s-desc").value="";
    await refreshSurveys();
  }catch(e){ setMsg(adminCreateMsg, e.message, false); }
});

$("btn-add-question").addEventListener("click", async ()=>{
  adminQMsg.innerHTML="";
  try{
    const survey_id=Number($("q-survey").value);
    const text=$("q-text").value.trim();
    const qtype=$("q-type").value;
    const raw=$("q-options").value.trim();
    const options = raw ? raw.split("\\n").map(x=>x.trim()).filter(Boolean) : [];
    if(!survey_id) return setMsg(adminQMsg, "Selecciona una encuesta.", false);
    if(!text) return setMsg(adminQMsg, "Escribe el texto de la pregunta.", false);
    if(qtype==="single" && options.length<2) return setMsg(adminQMsg, "Para selección única, agrega mínimo 2 opciones.", false);
    await API.adminAddQuestion(token, survey_id, text, qtype, options);
    setMsg(adminQMsg, "Pregunta agregada.", true);
    $("q-text").value=""; $("q-options").value="";
    await refreshSurveys();
  }catch(e){ setMsg(adminQMsg, e.message, false); }
});

(async()=>{
  if(token){ btnLogout.classList.remove("d-none"); await bootDash(); }
  else show("login");
})();

function renderParticipantsGenerated(items){
  if(!items.length){
    adminPTable.innerHTML = `<div class="text-white-75">No se generaron códigos.</div>`;
    return;
  }

  adminPTable.innerHTML = `
    <div class="table-responsive">
      <table class="table table-dark table-sm align-middle">
        <thead><tr><th>Código</th><th>PIN</th><th>QR</th></tr></thead>
        <tbody>
          ${items.map((x,i) => `
            <tr>
              <td>${x.code}</td>
              <td><b>${x.pin}</b></td>
              <td><div id="qr_${i}" style="width:72px;height:72px"></div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="d-flex gap-2 mt-2">
      <button class="btn btn-outline-light btn-sm" id="btn-copy-pins">Copiar lista</button>
      <button class="btn btn-outline-light btn-sm" id="btn-print-qr">Imprimir QRs</button>
    </div>
  `;

  // Generar QRs
  // Formato del QR: PW|CODIGO|PIN
  // (no es URL, así el escaneo funciona incluso sin red)
  items.forEach((x,i) => {
    const el = document.getElementById(`qr_${i}`);
    el.innerHTML = "";
    new QRCode(el, {
      text: `PW|${x.code}|${x.pin}`,
      width: 72,
      height: 72,
      correctLevel: QRCode.CorrectLevel.M
    });
  });

  document.getElementById("btn-copy-pins").onclick = async () => {
    const text = items.map(x => `${x.code}\t${x.pin}`).join("\n");
    await navigator.clipboard.writeText(text);
    setMsg(adminPMsg, "Lista copiada al portapapeles.", true);
  };

  document.getElementById("btn-print-qr").onclick = () => {
    window.print();
  };
}

function renderParticipantsList(items){
  if(!items.length){
    adminPTable.innerHTML = `<div class="text-white-75">No hay participantes.</div>`;
    return;
  }
  adminPTable.innerHTML = `
    <div class="table-responsive">
      <table class="table table-dark table-sm align-middle">
        <thead><tr><th>ID</th><th>Código</th><th>Creado</th></tr></thead>
        <tbody>
          ${items.map(x => `<tr><td>${x.id}</td><td>${x.code}</td><td>${x.created_at}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

document.getElementById("btn-gen-participants").addEventListener("click", async () => {
  adminPMsg.innerHTML = "";
  try{
    const count = Number(document.getElementById("p-count").value || 1);
    const prefix = document.getElementById("p-prefix").value.trim() || "EST-";
    const r = await API.adminGenerateParticipants(token, count, prefix);
    setMsg(adminPMsg, "Participantes generados.", true);
    renderParticipantsGenerated(r.items || []);
  }catch(e){
    setMsg(adminPMsg, e.message, false);
  }
});

document.getElementById("btn-list-participants").addEventListener("click", async () => {
  adminPMsg.innerHTML = "";
  try{
    const r = await API.adminListParticipants(token);
    setMsg(adminPMsg, "Lista cargada.", true);
    renderParticipantsList(r.items || []);
  }catch(e){
    setMsg(adminPMsg, e.message, false);
  }
});
