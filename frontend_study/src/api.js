const BASE = "https://ttech-backend.onrender.com";

export async function submitAssignment(data, file = null) {
  // Use FormData when a file is attached so the backend gets multipart/form-data
  if (file) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v && fd.append(k, v));
    fd.append("file", file);
    const res = await fetch(`${BASE}/api/assignments`, { method: "POST", body: fd });
    if (!res.ok) throw await res.json();
    return res.json();
  }
  // No file — plain JSON is fine
  const res = await fetch(`${BASE}/api/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export function adminFileUrl(password, filename) {
 const base = "https://ttech-backend.onrender.com";
  // Append password as query param so the browser can open/download the file directly
  return `${base}/api/admin/files/${encodeURIComponent(filename)}?pw=${encodeURIComponent(password)}`;
}

export async function checkStatus(ref) {
  const res = await fetch(`${BASE}/api/assignments/${ref}/status`);
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function adminHeaders(password) {
  return {
    "Content-Type": "application/json",
    "Authorization": password
  };
}

export async function adminLogin(password) {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetAssignments(password, status = "") {
  const url = `${BASE}/api/admin/assignments${status ? `?status=${status}` : ""}`;

  const res = await fetch(url, {
    headers: adminHeaders(password)
  });

  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateAssignment(password, id, patch) {
  const res = await fetch(`${BASE}/api/admin/assignments/${id}`, {
    method: "PATCH",
    headers: adminHeaders(password),
    body: JSON.stringify(patch),
  });

  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminAddPayment(password, data) {
  const res = await fetch(`${BASE}/api/admin/payments`, {
    method: "POST",
    headers: adminHeaders(password),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetPayments(password) {
  const res = await fetch(`${BASE}/api/admin/payments`, {
    headers: adminHeaders(password)
  });

  if (!res.ok) throw await res.json();
  return res.json();
}