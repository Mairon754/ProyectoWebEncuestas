
const API_BASE = "/proyecto_web/backend/api";

async function http(path, { method = "GET", token = null, body = null } = {}) {
  const headers = { "Accept": "application/json" };
  if (body !== null) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const msg = (data && data.message) ? data.message : `Error HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const API = {
  participantRegister: (code, pin) => http("/participant/register.php", { method: "POST", body: { code, pin } }),
  participantLogin: (code, pin) => http("/participant/login.php", { method: "POST", body: { code, pin } }),
  submitConsent: (token, accepted = true) => http("/consent/submit.php", { method: "POST", token, body: { accepted: !!accepted, version: "v1" } }),
  listSurveys: (token) => http("/surveys/list.php", { method: "GET", token }),
  getSurvey: (token, id) => http(`/surveys/get.php?id=${encodeURIComponent(id)}`, { method: "GET", token }),
  sendBatch: (token, payload) => http("/responses/batch.php", { method: "POST", token, body: payload }),
  adminLogin: (email, password) => http("/auth/login.php", { method: "POST", body: { email, password } }),
  adminLogout: (token) => http("/auth/logout.php", { method: "POST", token }),
  adminListSurveys: (token) => http("/admin/surveys_list.php", { method: "GET", token }),
  adminCreateSurvey: (token, title, description) => http("/admin/surveys_create.php", { method: "POST", token, body: { title, description } }),
  adminAddQuestion: (token, survey_id, text, qtype, options) => http("/admin/question_add.php", { method: "POST", token, body: { survey_id, text, qtype, options } }),
  adminExportUrl: (token) => `${API_BASE}/admin/export_csv.php?token=${encodeURIComponent(token)}`,
  adminGenerateParticipants: (token, count, prefix) =>
  http("/admin/participants_generate.php", { method: "POST", token, body: { count, prefix } }),
  adminListParticipants: (token) =>
  http("/admin/participants_list.php", { method: "GET", token }),
};
