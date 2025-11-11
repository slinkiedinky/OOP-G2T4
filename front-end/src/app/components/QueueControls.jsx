"use client";
import React, { useState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useRouter } from 'next/navigation';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Tooltip from '@mui/material/Tooltip';
import {
  startQueue,
  pauseQueue,
  resumeQueue,
  callNext,
  fastTrackAppointment,
} from "../../lib/api";

/**
 * QueueControls
 *
 * Small control panel for staff to start/pause/resume the clinic queue,
 * call the next patient and apply quick filters. Calls parent via
 * onAction when actions complete.
 */
export default function QueueControls({ clinicId, onAction, queueStarted = false, queuePaused = false, disableCallNext = false }) {
  const [filterNumber, setFilterNumber] = useState("");
  const [displayEnabled, setDisplayEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function doAction(fn) {
    try {
      setLoading(true);
      const res = await fn(clinicId);
      // Trigger parent to refresh queue
      onAction && onAction();
      // Provide immediate user feedback. If the API returned a JSON result, show it; otherwise show a generic success message.
      if (res && typeof res === 'object') {
        // try to find a sensible flag in the response
        if (res.started === true) alert('Queue started');
        else if (res.paused === true) alert('Queue paused');
        else alert('Action completed');
      } else {
        alert('Action completed');
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <h3>Queue Controls</h3>
      <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Status indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Queue status:</div>
              <div style={{
                padding: "6px 10px",
                borderRadius: 16,
                background: queueStarted ? (queuePaused ? "#fff4e5" : "#e8f5e9") : "#f5f5f5",
                color: queueStarted ? (queuePaused ? "#a76a00" : "#2e7d32") : "#666",
                fontWeight: 600,
                fontSize: 13,
              }}>
                {queueStarted ? (queuePaused ? "PAUSED" : "STARTED") : "STOPPED"}
              </div>
            </div>

            <Button
              variant={queueStarted ? "outlined" : "contained"}
              onClick={() => doAction(startQueue)}
              disabled={loading || queueStarted}
            >
              {queueStarted ? "Started" : "Start Q"}
            </Button>

            <Button
              variant="outlined"
              onClick={() => doAction(pauseQueue)}
              disabled={loading || !queueStarted || queuePaused}
            >
              Pause Q
            </Button>

            <Button
              variant="outlined"
              onClick={() => doAction(resumeQueue)}
              disabled={loading || !queueStarted || !queuePaused}
            >
              Resume Q
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={() => doAction(callNext)}
              disabled={loading || !queueStarted || queuePaused || disableCallNext}
            >
                Call Next
            </Button>
            {/* Informational note for staff about required workflow */}
            <div style={{ marginLeft: 12, fontSize: 13, color: disableCallNext ? '#a00' : '#444' }} aria-live="polite">
              You must complete the treatment summary before calling the next patient.
            </div>
          </Stack>

        {/* History/load controls removed from here — history panel now shown below the controls in the staff page */}

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            label="Filter by Q#"
            value={filterNumber}
            onChange={(e) => setFilterNumber(e.target.value)}
            sx={{ width: 140 }}
          />
          <Button
            onClick={() => {
              // simple filtering action handled client-side by parent; emit callback with filter
              onAction && onAction({ filterNumber });
            }}
            size="small"
          >
            Apply
          </Button>
          <Button
            onClick={() => {
              setFilterNumber("");
              onAction && onAction({ filterNumber: null });
            }}
            size="small"
          >
            Clear
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            id="fastTrackAppointmentId"
            label="Fast-track Appointment ID"
          />
          <TextField
            size="small"
            id="fastTrackReason"
            label="Reason (optional)"
            sx={{ width: 300 }}
          />
          <Button
            onClick={async () => {
              const idEl = document.getElementById("fastTrackAppointmentId");
              const reasonEl = document.getElementById("fastTrackReason");
              const id = idEl ? idEl.value.trim() : "";
              const reason = reasonEl ? reasonEl.value.trim() : "";
              if (!id) return alert("Please enter an appointment ID to fast-track");
              try {
                setLoading(true);
                await fastTrackAppointment(id, reason);
                onAction && onAction();
                if (idEl) idEl.value = "";
                if (reasonEl) reasonEl.value = "";
                alert("Fast-tracked successfully");
              } catch (err) {
                alert(err.message || "Failed to fast-track");
              } finally {
                setLoading(false);
              }
            }}
          >
            Fast-track
          </Button>
        </Stack>

        {/* Display on board: open the clinic-specific display screen (no clinic ID input required on that page). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title="Open full-screen queue display for this clinic">
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  if (!clinicId) return alert('Clinic ID is required to open display');
                  const url = `/queue-display/${encodeURIComponent(clinicId)}`;
                  // open in a new tab/window; add noopener,noreferrer for security
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                sx={{ borderRadius: 8, textTransform: 'none', fontWeight: 700 }}
              >
                Display on board
              </Button>
            </span>
          </Tooltip>
        </div>
      </Stack>
    </Box>
  );
}
