"use client";
import React, { useEffect, useState, useRef } from "react";
import RequireAuth from "../../components/RequireAuth";
import { getQueueStatus } from "../../../lib/api";
import Grid from "@mui/material/Grid";
import QueueBoard from "../../components/QueueBoard";
import QueueControls from "../../components/QueueControls";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

/**
 * StaffQueuePage
 *
 * Staff-facing queue management UI. Shows current queue, a clinic selector
 * (autocomplete) and controls for starting/pausing/calling patients.
 */
export default function StaffQueuePage() {
  const [clinicId, setClinicId] = useState("22");
  const [clinics, setClinics] = useState([]);
  const [selectedClinicObj, setSelectedClinicObj] = useState(null);
  const [queue, setQueue] = useState([]);

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(null);
  const [display, setDisplay] = useState(true);
  const polling = useRef(null);

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

        // If a clinic was selected in the staff appointments page, prefer that
        try {
          const stored = JSON.parse(localStorage.getItem('staffSelectedClinic'));
          if (stored && stored.id) {
            const foundStored = (data || []).find(c => String(c.id) === String(stored.id));
            if (foundStored) {
              setSelectedClinicObj(foundStored);
              setClinicId(String(foundStored.id));
              return;
            }
          }
        } catch (e) {
          // ignore localStorage parse errors
        }

        // fallback: if clinicId matches, set selected object
        const found = (data || []).find(c => String(c.id) === String(clinicId));
        if (found) setSelectedClinicObj(found);
      } catch (err) {
        console.error('Failed to load clinics', err);
      }
    }
    fetchClinics();

    // Listen for clinic selection changes from other pages/tabs (localStorage)
    function onStorage(e) {
      if (e.key !== 'staffSelectedClinic') return;
      if (!e.newValue) {
        setSelectedClinicObj(null);
        setClinicId('');
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && parsed.id) {
          setClinicId(String(parsed.id));
          // optimistic: set selected object from parsed value; when clinics list loads it will be normalized
          setSelectedClinicObj(parsed);
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('storage', onStorage);

    return () => { mounted = false; window.removeEventListener('storage', onStorage); };
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
      </div>
    </RequireAuth>
  );
}
