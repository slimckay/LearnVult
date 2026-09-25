const API = import.meta.env.VITE_API_URL || "";
function authHeader() {
  const token = localStorage.getItem("lv_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}
export async function login(email, password) {
  return parse(await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
}
export async function register(payload) {
  return parse(await fetch(`${API}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
}
export async function forgotPassword(email) {
  return parse(await fetch(`${API}/api/auth/forgot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }));
}
export async function resetPassword(payload) {
  return parse(await fetch(`${API}/api/auth/reset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
}
export async function listResources(params = {}) {
  const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, value]) => value))).toString();
  return parse(await fetch(`${API}/api/resources${query ? `?${query}` : ""}`, { headers: { ...authHeader() } }));
}
export async function uploadResource(formData) {
  return parse(await fetch(`${API}/api/resources`, { method: "POST", headers: { ...authHeader() }, body: formData }));
}
export async function downloadResource(id) {
  const res = await fetch(`${API}/api/resources/${id}/download`, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error("Download failed");
  return { blob: await res.blob() };
}
export async function syncStatus() {
  return parse(await fetch(`${API}/api/sync/status`, { headers: { ...authHeader() } }));
}
export async function flushSync() {
  return parse(await fetch(`${API}/api/sync/flush`, { method: "POST", headers: { ...authHeader() } }));
}
export async function adminSummary() {
  return parse(await fetch(`${API}/api/admin/summary`, { headers: { ...authHeader() } }));
}
export async function adminUsers() {
  return parse(await fetch(`${API}/api/admin/users`, { headers: { ...authHeader() } }));
}
export async function adminVerifyTeacher(id) {
  return parse(await fetch(`${API}/api/admin/users/${id}/verify`, { method: "POST", headers: { ...authHeader() } }));
}
export async function adminUnverifyTeacher(id) {
  return parse(await fetch(`${API}/api/admin/users/${id}/unverify`, { method: "POST", headers: { ...authHeader() } }));
}
export async function adminIssueResetCode(id) {
  return parse(await fetch(`${API}/api/admin/users/${id}/reset-code`, { method: "POST", headers: { ...authHeader() } }));
}
export async function adminSetPassword(id, password) {
  return parse(await fetch(`${API}/api/admin/users/${id}/password`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ password }) }));
}
export async function adminResources() {
  return parse(await fetch(`${API}/api/admin/resources`, { headers: { ...authHeader() } }));
}
export async function adminDeleteResource(id) {
  return parse(await fetch(`${API}/api/admin/resources/${id}`, { method: "DELETE", headers: { ...authHeader() } }));
}
