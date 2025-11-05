"use client";
import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { authFetch, getQueueStatus } from "../lib/api";

export default function AppointmentDetailsModal({ open, onClose, appointment, onUpdate }) {
  const [treatmentSummary, setTreatmentSummary] = useState(
    appointment?.treatmentSummary || ""
  );
  const [loading, setLoading] = useState(false);
  const [queueInfo, setQueueInfo] = useState(null);

  // Load queue info for this appointment's clinic to determine whether patient was called
  // NOTE: effect must be declared before any early returns so hooks order stays stable
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!appointment || !appointment.clinic || !appointment.clinic.id) return;
      try {
        const data = await getQueueStatus(appointment.clinic.id);
        // data.entries is the list
        const entries = data?.entries || [];
        const match = entries.find((e) => String(e.appointmentId) === String(appointment.id));
        if (mounted) setQueueInfo(match || null);
      } catch (e) {
        console.error('Failed to load queue info for appointment', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, [appointment]);

  if (!appointment) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "BOOKED":
        return { bg: "#e3f2fd", color: "#1976d2" };
      case "CHECKED_IN":
        return { bg: "#e8f5e9", color: "#388e3c" };
      case "COMPLETED":
        return { bg: "#f3e5f5", color: "#7b1fa2" };
      case "CANCELLED":
        return { bg: "#fce4ec", color: "#c2185b" };
      case "NO_SHOW":
        return { bg: "#fff3e0", color: "#f57c00" };
      default:
        return { bg: "#f5f5f5", color: "#666" };
    }
  };

  async function handleCheckIn() {
    setLoading(true);
    try {
      await authFetch(`/api/staff/appointments/${appointment.id}/check-in`, {
        method: "POST",
      });
      alert("Patient checked in successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      alert("Failed to check in: " + err.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleSaveTreatmentSummary() {
    if (!treatmentSummary.trim()) {
      alert("Please enter a treatment summary");
      return;
    }

    setLoading(true);
    try {
      await authFetch(
        `/api/staff/appointments/${appointment.id}/treatment-summary`,
        {
          method: "PUT",
          headers: { "Content-Type": "text/plain" },
          body: treatmentSummary,
        }
      );
      alert("Treatment summary saved!");
      onUpdate();
    } catch (err) {
      alert("Failed to save treatment summary: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkCompleted() {
    if (!appointment.treatmentSummary && !treatmentSummary.trim()) {
      alert("Please add treatment summary before marking as completed");
      return;
    }

    // Save treatment summary first if not saved
    if (treatmentSummary !== appointment.treatmentSummary) {
      await handleSaveTreatmentSummary();
    }

    setLoading(true);
    try {
      await authFetch(`/api/staff/appointments/${appointment.id}/complete`, {
        method: "PUT",
      });
      alert("Appointment marked as completed!");
      onUpdate();
      onClose();
    } catch (err) {
      alert("Failed to mark as completed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkNoShow() {
    if (!confirm("Mark this patient as no-show?")) return;

    setLoading(true);
    try {
      await authFetch(`/api/staff/appointments/${appointment.id}/no-show`, {
        method: "PUT",
      });
      alert("Marked as no-show");
      onUpdate();
      onClose();
    } catch (err) {
      alert("Failed to mark as no-show: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const statusStyle = getStatusColor(appointment.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Appointment Details</span>
          <Chip
            label={appointment.status}
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 600,
            }}
          />
        </div>
      </DialogTitle>
      
      <DialogContent>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Patient Info */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#666", marginBottom: 4 }}>
              PATIENT
            </div>
            <div style={{ fontSize: 16 }}>
              {appointment.patient?.name || appointment.patient?.username || "N/A"}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              {appointment.patient?.email || "No email"}
            </div>
          </div>

          <Divider />

          {/* Appointment Info */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#666", marginBottom: 4 }}>
              APPOINTMENT TIME
            </div>
            <div style={{ fontSize: 16 }}>
              {new Date(appointment.startTime).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#666", marginBottom: 4 }}>
              DOCTOR
            </div>
            <div style={{ fontSize: 16 }}>{appointment.doctor?.name || "N/A"}</div>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#666", marginBottom: 4 }}>
              CLINIC
            </div>
            <div style={{ fontSize: 16 }}>{appointment.clinic?.name || "N/A"}</div>
          </div>

          {/* Treatment Summary Section */}
          {(appointment.status === "CHECKED_IN" || appointment.status === "COMPLETED") && (
            <>
              <Divider />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#666", marginBottom: 8 }}>
                  TREATMENT SUMMARY
                </div>
                {appointment.status === "COMPLETED" && appointment.treatmentSummary ? (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: "#f5f5f5",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    {appointment.treatmentSummary}
                  </div>
                ) : (
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={treatmentSummary}
                    onChange={(e) => setTreatmentSummary(e.target.value)}
                    placeholder="Enter treatment summary, diagnosis, prescriptions, etc."
                    disabled={appointment.status === "COMPLETED" || !(queueInfo && queueInfo.status === "CALLED")}
                  />
                )}
              </div>
            </>
          )}

          <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
            Appointment ID: {appointment.id}
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>

        {/* Status-specific action buttons */}
        {appointment.status === "BOOKED" && (
          <>
            <Button
              onClick={handleMarkNoShow}
              color="warning"
              variant="outlined"
              disabled={loading}
            >
              Mark No-Show
            </Button>
            <Button
              onClick={handleCheckIn}
              color="success"
              variant="contained"
              disabled={loading}
            >
              Check In
            </Button>
          </>
        )}

            {appointment.status === "CHECKED_IN" && (
          <>
            <Button
              onClick={handleSaveTreatmentSummary}
              color="primary"
              variant="outlined"
                  disabled={loading || !treatmentSummary.trim() || !(queueInfo && queueInfo.status === "CALLED")}
            >
              Save Summary
            </Button>
            <Button
              onClick={handleMarkCompleted}
              color="success"
              variant="contained"
                  disabled={loading || !(queueInfo && queueInfo.status === "CALLED")}
            >
              Mark Completed
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}