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

export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    return exp < now;
  } catch (e) {
    console.error("Failed to check token expiration:", e);
    return true; // If we can't parse it, consider it expired
  }
}

export function getTokenExpirationTime() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000; // Return expiration time in milliseconds
  } catch (e) {
    return null;
  }
}
export async function authFetch(url, opts = {}) {
  // Always convert relative api paths to absolute URL pointing to backend
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  if (typeof url === "string" && url.startsWith("/api/")) {
    url = apiBase + url;
  }

  opts = { ...opts };
  
  // Ensure headers object exists
  if (!opts.headers) {
    opts.headers = {};
  } else if (opts.headers instanceof Headers) {
    // Convert Headers object to plain object if needed
    const headersObj = {};
    opts.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    opts.headers = headersObj;
  } else {
    // Make a copy if it's already an object
    opts.headers = { ...opts.headers };
  }
  
  const token = getToken();
  
  // Check if token is expired before making request
  if (token && isTokenExpired()) {
    if (typeof window !== "undefined") {
      console.warn("Token has expired. Removing token and redirecting to login.");
      removeToken();
      // Don't redirect automatically - let the component handle it
      throw new Error("Token expired. Please log in again.");
    }
  }
  
  // Set headers - ensure Authorization is always set if token exists
  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }
  if (opts.body && !opts.headers["Content-Type"]) {
    opts.headers["Content-Type"] = "application/json";
  }
  
  // Debug logging AFTER setting headers
  if (typeof window !== "undefined" && (url.includes('/api/doctors') || url.includes('/api/clinic-management'))) {
    console.log('=== authFetch DEBUG ===');
    console.log('Final URL:', url);
    console.log('Token exists:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log('Token payload:', payload);
        console.log('Token role:', payload.role);
        const expTime = payload.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = expTime - now;
        console.log('Token expires in:', Math.floor(timeUntilExpiry / 1000), 'seconds');
        if (timeUntilExpiry < 0) {
          console.warn('Token is EXPIRED!');
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
    console.log('Request headers:', opts.headers);
    console.log('Authorization header present:', !!opts.headers["Authorization"]);
    console.log('======================');
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const p = JSON.parse(text);
      msg = p.message || JSON.stringify(p);
    } catch (e) {}
    
    // Log 401 errors with more detail
    if (res.status === 401 && typeof window !== "undefined") {
      console.error('=== 401 Error Details ===');
      console.error('URL:', url);
      console.error('Token sent:', !!token);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.error('Token expired:', isTokenExpired());
          console.error('Token expiration:', new Date(payload.exp * 1000).toISOString());
        } catch (e) {
          console.error('Failed to decode token for error logging:', e);
        }
      }
      console.error('Response body:', text);
      console.error('=======================');
      
      // If token is expired or invalid, remove it
      if (token && (isTokenExpired() || msg.includes("expired") || msg.includes("invalid"))) {
        console.warn("Removing expired/invalid token");
        removeToken();
      }
    }
    
    const err = new Error(`HTTP ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res;
}

// Helper to parse JSON responses but return null for empty bodies (204 or empty)
export async function parseJsonOrNull(res) {
  if (!res) return null;
  // No Content
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    // Not valid JSON
    return null;
  }
}

// Queue-related helper functions
export async function getQueueStatus(clinicId, date) {
  // date should be an ISO yyyy-MM-dd string representing the UTC calendar day
  const d = date || new Date().toISOString().slice(0, 10);
  const url = `/api/queue/status?clinicId=${clinicId}&date=${d}`;
  if (typeof window !== "undefined") console.log("getQueueStatus ->", url);
  const res = await authFetch(url);
  return res.json();
}

export async function getAllQueueStatus(clinicId) {
  const url = `/api/queue/status?clinicId=${clinicId}&all=true`;
  const res = await authFetch(url);
  return res.json();
}

export async function startQueue(clinicId) {
  const url = `/api/queue/start`;
  const res = await authFetch(url, { method: "POST", body: JSON.stringify({ clinicId }) });
  return parseJsonOrNull(res);
}

export async function pauseQueue(clinicId) {
  const url = `/api/queue/pause`;
  const res = await authFetch(url, { method: "POST", body: JSON.stringify({ clinicId }) });
  return parseJsonOrNull(res);
}

export async function resumeQueue(clinicId) {
  const url = `/api/queue/resume`;
  const res = await authFetch(url, { method: "POST", body: JSON.stringify({ clinicId }) });
  return parseJsonOrNull(res);
}

export async function callNext(clinicId) {
  const url = `/api/queue/call-next`;
  const res = await authFetch(url, { method: "POST", body: JSON.stringify({ clinicId }) });
  return parseJsonOrNull(res);
}

export async function fastTrackAppointment(appointmentId, reason) {
  const url = `/api/queue/fast-track`;
  const res = await authFetch(url, { method: "POST", body: JSON.stringify({ appointmentId, reason }) });
  async function notifyFastTrack(email, clinicId, reason) {
    try {
      await fetch("/api/email/notification/notifyfasttrack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, clinicId, reason }),
      });
      console.log("✅ Sent fast-track notification to", email);
    } catch (err) {
      console.error("Failed to send fast-track notification:", err);
    }
  return parseJsonOrNull(res);
  }
}

export async function getPatientQueue(appointmentId) {
  if (appointmentId) {
    const url = `/api/patient/queue?appointmentId=${appointmentId}`;
    const res = await authFetch(url);
    return res.json();
  }
  // fallback to fetch patient's current queue
  const url = `/api/patient/queue/mine`;
  const res = await authFetch(url);
  return res.json();
}
