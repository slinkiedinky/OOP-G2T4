export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aqms_token");
}

export function setToken(t) {
  if (typeof window === "undefined") return;
  localStorage.setItem("aqms_token", t);
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("aqms_token");
  // clear cookie used by middleware
  document.cookie = "aqms_token=;path=/;max-age=0";
}
export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    // JWT has 3 parts: header.payload.signature
    const payload = token.split(".")[1];
    // Decode base64
    const decoded = JSON.parse(atob(payload));
    return {
      userId: decoded.userId,
      username: decoded.sub,
      role: decoded.role,
    };
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
}
export async function authFetch(url, opts = {}) {
  // If running on the server (Next SSR), convert relative api paths to an absolute URL
  if (typeof window === "undefined") {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    if (typeof url === "string" && url.startsWith("/api/")) {
      url = apiBase + url;
    }
  }

  opts = { ...opts };
  opts.headers = { ...(opts.headers || {}) };
  const token = getToken();
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (!opts.headers["Content-Type"] && opts.body)
    opts.headers["Content-Type"] = "application/json";

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const p = JSON.parse(text);
      msg = p.message || JSON.stringify(p);
    } catch (e) {}
    const err = new Error(`HTTP ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res;
}
