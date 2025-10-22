const $ = id => document.getElementById(id);

const tokenKey = 'aqms_token';

function show(id){ document.querySelectorAll('.hidden').forEach(e=>e.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }

async function fetchClinics(){
  try{
    const res = await fetch('/api/clinics');
    if(!res.ok) throw new Error('Failed');
    const clinics = await res.json();
    const container = $('clinics');
    if(!clinics.length) container.innerText = 'No clinics available.';
    else container.innerHTML = clinics.map(c => `<div class="clinic"><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.address||'')}</p></div>`).join('');
  }catch(e){ $('clinics').innerText = 'Unable to load clinics.' }
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function setAuthUI(){
  const t = localStorage.getItem(tokenKey);
  $('logout').style.display = t ? '' : 'none';
  $('show-login').style.display = t ? 'none' : '';
  $('show-register').style.display = t ? 'none' : '';
}

document.addEventListener('DOMContentLoaded', ()=>{
  setAuthUI();
  fetchClinics();

  $('show-login').addEventListener('click', ()=>{ show('login-form'); });
  $('show-register').addEventListener('click', ()=>{ show('register-form'); });
  $('logout').addEventListener('click', ()=>{ localStorage.removeItem(tokenKey); setAuthUI(); });

  $('login-form').addEventListener('submit', async e=>{
    e.preventDefault(); const fm = e.target; const body = { username: fm.username.value, password: fm.password.value };
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    if(res.ok){ const j = await res.json(); localStorage.setItem(tokenKey, j.token); setAuthUI(); alert('Logged in'); }
    else alert('Login failed');
  });

  $('register-form').addEventListener('submit', async e=>{
    e.preventDefault(); const fm = e.target; const body = { username: fm.username.value, password: fm.password.value };
    const res = await fetch('/api/auth/register-patient', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    if(res.ok){ const j = await res.json(); localStorage.setItem(tokenKey, j.token); setAuthUI(); alert('Registered'); }
    else alert('Register failed');
  });
  // populate clinic select
  const clinicSelect = $('clinic-select');
  fetch('/api/clinics').then(r=>r.json()).then(list=>{
    clinicSelect.innerHTML = '<option value="">--choose--</option>' + list.map(c=>`<option value="${c.id}">${escapeHtml(c.name)} (${c.id})</option>`).join('');
  }).catch(()=>{});

  clinicSelect.addEventListener('change', async e=>{
    const id = e.target.value; if(!id) { $('doctors').innerText='Select a clinic'; return }
    const res = await fetch(`/api/clinics/${id}/doctors`);
    if(!res.ok) { $('doctors').innerText='Failed to load doctors'; return }
    const docs = await res.json(); $('doctors').innerHTML = docs.map(d=>`<div class="clinic"><b>${escapeHtml(d.name||d.fullName||'Doctor')}</b> id:${d.id}</div>`).join('');
  });

  // Appointments: search
  $('search-available').addEventListener('click', async ()=>{
    const clinicId = $('appt-clinic').value; const doctorId = $('appt-doctor').value; const date = $('appt-date').value;
    if(!clinicId || !date) { alert('clinic and date required'); return }
    const qp = new URLSearchParams({ clinicId, date }); if(doctorId) qp.set('doctorId', doctorId);
    const res = await fetch('/api/appointments/available?'+qp.toString());
    if(!res.ok) { $('available').innerText='Search failed'; return }
    const slots = await res.json();
    $('available').innerHTML = slots.map(s=>`<div class="clinic">slot ${s.id} ${escapeHtml(s.startTime||'')} - ${escapeHtml(s.endTime||'')} <button onclick="bookSlot(${s.id})">Book</button></div>`).join('') || 'No slots';
  });

  // Queue: check-in, fast-track, call-next
  $('checkin').addEventListener('click', async ()=>{
    const slotId = $('slot-id').value; const priority = $('priority').value;
    if(!slotId) { alert('slot id required'); return }
    const res = await authFetch(`/api/queue/check-in/${slotId}?priority=${priority}`, { method:'POST' });
    const j = await res.json(); $('queue-list').innerText = JSON.stringify(j);
  });

  $('fast-track').addEventListener('click', async ()=>{
    const ticketId = $('ticket-id').value; const priority = $('ft-priority').value;
    if(!ticketId) { alert('ticket id required'); return }
    const res = await authFetch(`/api/queue/${ticketId}/fast-track?priority=${priority}`, { method:'POST' });
    const j = await res.json(); $('queue-list').innerText = JSON.stringify(j);
  });

  $('call-next').addEventListener('click', async ()=>{
    const clinicId = $('queue-clinic-id').value; if(!clinicId) { alert('clinic id required'); return }
    const res = await authFetch(`/api/queue/${clinicId}/next`, { method:'POST' }); const j = await res.json(); $('queue-list').innerText = JSON.stringify(j);
  });

  // Admin: create and list
  $('admin-create').addEventListener('click', async ()=>{
    const u = $('admin-username').value; const p = $('admin-password').value; const r = $('admin-role').value || 'PATIENT';
    if(!u||!p) { alert('username/password required'); return }
    const res = await authFetch('/api/admin/users/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:u, password:p, role:r }) });
    if(res.ok) { alert('created'); } else { const txt = await res.text(); alert('create failed: '+txt) }
  });

  $('admin-list').addEventListener('click', async ()=>{
    const res = await authFetch('/api/admin/users/all', { method:'GET' });
    if(!res.ok) { $('admin-listing').innerText='failed to list'; return }
    const list = await res.json(); $('admin-listing').innerHTML = list.map(u=>`<div>${escapeHtml(u.username)} (id:${u.id}) role:${u.role}</div>`).join('');
  });
});

async function bookSlot(slotId){
  const token = localStorage.getItem(tokenKey); if(!token) { alert('login required'); return }
  // naive: ask for patientId
  const patientId = prompt('Enter patientId to book for (numeric)'); if(!patientId) return;
  const res = await authFetch('/api/appointments/book', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slotId: Number(slotId), patientId: Number(patientId) }) });
  if(res.ok) alert('Booked'); else alert('Book failed: '+await res.text());
}

// helper that adds Authorization header when token present
function authHeaders(h={}){
  const t = localStorage.getItem(tokenKey); if(t) h['Authorization'] = 'Bearer '+t; return h;
}

async function authFetch(url, opts={}){
  opts.headers = authHeaders(opts.headers||{});
  return fetch(url, opts);
}
