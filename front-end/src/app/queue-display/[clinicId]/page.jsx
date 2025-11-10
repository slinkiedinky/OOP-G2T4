"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getQueueStatus } from "../../../lib/api";

export default function ClinicQueueDisplay() {
  const params = useParams();
  const clinicIdParam = params?.clinicId || null;

  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const polling = useRef(null);

  async function load() {
    if (!clinicIdParam) {
      setError('Missing clinic id');
      setQueueEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getQueueStatus(clinicIdParam);
      setQueueEntries(data?.entries || []);
    } catch (e) {
      console.error('Failed to load queue status', e);
      setError(e.message || String(e));
      setQueueEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    polling.current = setInterval(load, 5000);
    return () => clearInterval(polling.current);
  }, [clinicIdParam]);

  const serving = queueEntries.find((x) => x.status === "SERVING");
  let nowServing = serving || null;
  if (!nowServing) {
    const called = queueEntries.filter((x) => x.status === "CALLED");
    if (called.length) {
      called.sort((a, b) => {
        const ta = a.calledAt ? new Date(a.calledAt).getTime() : 0;
        const tb = b.calledAt ? new Date(b.calledAt).getTime() : 0;
        return tb - ta;
      });
      nowServing = called[0];
    }
  }

  const waiting = queueEntries
    .filter((x) => x.status === "QUEUED")
    .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));

  return (
    <div style={{ padding: 18, maxWidth: 1000 }}>
      <h2>Queue Display</h2>

      <div style={{ padding: 100, borderRadius: 8, background: '#fff', boxShadow: '0 1px 0 0 rgba(0,0,0,0.03) inset' }}>
        <h3 style={{ marginBottom: 8 }}>Now Serving</h3>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'crimson' }}>Error: {error}</div>
        ) : nowServing ? (
          <div style={{ padding: '12px 18px', background: '#e8f5e9', borderRadius: 8, display: 'inline-block', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Q# {nowServing.queueNumber}</div>
          </div>
        ) : (
          <div style={{ color: '#666' }}>No patient is currently being served.</div>
        )}

        <h3 style={{ marginTop: 20, marginBottom: 8 }}>Waiting</h3>
        {loading ? null : waiting.length === 0 ? (
          <div style={{ color: '#666' }}>No queued patients.</div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {waiting.map((w) => (
              <div key={`w-${w.id}`} style={{ padding: '12px 18px', borderRadius: 8, background: '#f1f1f1', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>Q# {w.queueNumber}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, color: '#888' }}>
        <small>Auto-refreshes every 5s.</small>
      </div>
    </div>
  );
}
