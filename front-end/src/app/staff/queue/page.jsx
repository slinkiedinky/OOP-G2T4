"use client";
import React, { useEffect, useState, useRef } from "react";
import RequireAuth from "../../components/RequireAuth";
import { getQueueStatus } from "../../../lib/api";
import Grid from "@mui/material/Grid";
import QueueBoard from "../../components/QueueBoard";
import QueueControls from "../../components/QueueControls";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export default function StaffQueuePage() {
  const [clinicId, setClinicId] = useState("22");
  const [clinics, setClinics] = useState([]);
  const [selectedClinicObj, setSelectedClinicObj] = useState(null);
  const [queue, setQueue] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(null);
  const [display, setDisplay] = useState(true);
  const polling = useRef(null);

  // async function notifyPatientQueue(email, clinicId, queueNumber, numberAhead) {
  //   try {
  //     await fetch("/api/email/notification/notifypatientqueue", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email, clinicId, queueNumber, numberAhead }),
  //     });
  //     console.log("✅ Sent queue position notification to", email);
  //   } catch (err) {
  //     console.error("Failed to send queue notification:", err);
  //   }

  //   async function notifyNext(email, clinicId) {
  //     try {
  //       await fetch("/api/email/notification/notifynext", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ email, clinicId }),
  //       });
  //       console.log("✅ Sent next-in-line notification to", email);
  //     } catch (err) {
  //       console.error("Failed to send next notification:", err);
  //     }
  //   }
    
  //   async function notifyFastTrack(email, clinicId, reason) {
  //     try {
  //       await fetch("/api/email/notification/notifyfasttrack", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ email, clinicId, reason }),
  //       });
  //       console.log("✅ Sent fast-track notification to", email);
  //     } catch (err) {
  //       console.error("Failed to send fast-track notification:", err);
  //     }
  //   }
  // }

  async function loadQueue(options) {
    if (!clinicId) return;
    setLoading(true);
    try {
      console.log("loadQueue: clinicId=", clinicId, "options=", options);
      // If options.all is true, fetch full history; if options.date provided, fetch that date; otherwise today's queue.
      let data;
      if (options && options.all) {
        data = await getAllQueueStatus(clinicId);
      } else if (options && options.date) {
        data = await getQueueStatus(clinicId, options.date);
      } else {
        data = await getQueueStatus(clinicId);
      }
      // backend now returns { entries: [...], queueStarted: boolean, queuePaused: boolean }
      if (data) {
        setQueue(data.entries || []);
        setQueueStarted(!!data.queueStarted);
        setQueuePaused(!!data.queuePaused);
      } else {
        setQueue([]);
        setQueueStarted(false);
        setQueuePaused(false);
      }
    } catch (e) {
      console.error(e);
      // Show detailed error when available
      console.error("loadQueue error body:", e.body);
      alert((e.body && typeof e.body === 'string') ? e.body : (e.message || "Failed to load queue"));
    } finally {
      setLoading(false);
    }
  }

  const [queueStarted, setQueueStarted] = useState(false);
  const [queuePaused, setQueuePaused] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);

  useEffect(() => {
    loadQueue();
    polling.current = setInterval(loadQueue, 5000);
    return () => clearInterval(polling.current);
  }, [clinicId]);

  // Fetch clinics for the clinic selector (clinic name, id, address)
  useEffect(() => {
    let mounted = true;
    async function fetchClinics() {
      try {
        const res = await fetch('/api/clinics');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setClinics(data || []);
        // if clinicId matches, set selected object
        const found = (data || []).find(c => String(c.id) === String(clinicId));
        if (found) setSelectedClinicObj(found);
      } catch (err) {
        console.error('Failed to load clinics', err);
      }
    }
    fetchClinics();
    return () => { mounted = false };
  }, []);

  // compute whether call next should be disabled (there are active called/serving entries)
  const disableCallNext = queue && queue.some(q => q.status === 'CALLED' || q.status === 'SERVING');

  // (doctor list not needed for clinic-based display)

  const filtered = filter && filter.filterNumber
    ? queue.filter((q) => String(q.queueNumber) === String(filter.filterNumber))
    : queue;

  return (
    <RequireAuth role="STAFF">
      <div>
        <h2>Queue Management</h2>
        <p style={{ color: "#666" }}>Manage today's queue and display</p>

        {queueStarted ? null : (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: "#fff3f2", color: "#8a1f11" }}>
            The queue for this clinic has not been started. Staff must click "Start Q" before calling patients.
          </div>
        )}

        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ minWidth: 600 }}>
            <Autocomplete
              options={clinics}
              getOptionLabel={(option) => option?.name || String(option?.id || '')}
              value={selectedClinicObj}
              onChange={(e, newValue) => {
                setSelectedClinicObj(newValue);
                setClinicId(newValue ? String(newValue.id) : '');
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{option.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {(option.address || option.location || option.name) + (option.id ? ` • ID: ${option.id}` : '')}
                    </div>
                  </div>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Clinic" placeholder="Search clinics by name or id" />
              )}
            />
          </div>
          {/* <div>
            <button onClick={loadQueue} style={{ marginLeft: 8 }}>
              Refresh
            </button>
          </div> */}
        </div>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <QueueBoard queue={filtered} display={display} />
          </Grid>
          <Grid item xs={12} md={4}>
            <QueueControls
              clinicId={clinicId}
              queueStarted={queueStarted}
              queuePaused={queuePaused}
              disableCallNext={disableCallNext}
              onAction={(payload) => {
                if (!payload) {
                  loadQueue();
                  return;
                }
                if (payload.filterNumber !== undefined) {
                  setFilter(payload);
                }
                if (payload.display !== undefined) {
                  setDisplay(payload.display);
                }
                // pass options (e.g., { all: true } or { date }) to loadQueue
                loadQueue(payload);
              }}
            />
          </Grid>
        </Grid>
        {/* History panel below controls: choose a date and load that day's queue (history)
        <div style={{ marginTop: 16, marginBottom: 8, padding: 12, background: '#fafafa', borderRadius: 8 }}>
          <h4>Queue History</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <label htmlFor="historyDate">Date:</label>
            <input id="historyDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} />
            <button onClick={async () => {
              const el = document.getElementById('historyDate');
              if (!el) return;
              const d = el.value;
              try {
                const res = await getQueueStatus(clinicId, d);
                setHistoryEntries(res?.entries || []);
              } catch (e) {
                alert('Failed to load history: ' + (e.message || e));
              }
            }}>Load</button>
            <button onClick={() => setHistoryEntries([])}>Clear</button>
          </div>
          {historyEntries && historyEntries.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <th style={{ padding: 6 }}>Q#</th>
                    <th style={{ padding: 6 }}>Appointment ID</th>
                    <th style={{ padding: 6 }}>Slot time</th>
                    <th style={{ padding: 6 }}>Queued At</th>
                    <th style={{ padding: 6 }}>Called At</th>
                    <th style={{ padding: 6 }}>Doctor</th>
                    <th style={{ padding: 6 }}>Patient</th>
                    <th style={{ padding: 6 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyEntries.map((q) => (
                    <tr key={`hist-${q.id}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: 6 }}>{q.queueNumber}</td>
                      <td style={{ padding: 6 }}>{q.appointmentId}</td>
                      <td style={{ padding: 6 }}>{q.time ? new Date(q.time).toLocaleTimeString() : '-'}</td>
                      <td style={{ padding: 6 }}>{q.createdAt ? new Date(q.createdAt).toLocaleTimeString() : '-'}</td>
                      <td style={{ padding: 6 }}>{q.calledAt ? new Date(q.calledAt).toLocaleTimeString() : '-'}</td>
                      <td style={{ padding: 6 }}>{q.doctorName || '-'}</td>
                      <td style={{ padding: 6 }}>{q.patientName || '-'}</td>
                      <td style={{ padding: 6 }}>{q.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: '#666' }}>No history loaded.</div>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <details>
            <summary style={{ cursor: "pointer" }}>Debug: raw queue JSON</summary>
            <pre style={{ maxHeight: 300, overflow: "auto", background: "#f6f6f6", padding: 12 }}>
              {JSON.stringify(queue, null, 2)}
            </pre>
          </details>
        </div> */}
      </div>
    </RequireAuth>
  );
}
