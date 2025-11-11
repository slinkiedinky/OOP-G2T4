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
import Toast from "./Toast";
import ConfirmDialog from "./ConfirmDialog";

export default function AppointmentDetailsModal({
  open,
  onClose,
  appointment,
  onUpdate,
}) {
  const [treatmentSummary, setTreatmentSummary] = useState(
    appointment?.treatmentSummary || ""
  );
  const [loading, setLoading] = useState(false);
  const [queueInfo, setQueueInfo] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    severity: "warning",
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!appointment || !appointment.clinic || !appointment.clinic.id) return;
      try {
        const data = await getQueueStatus(appointment.clinic.id);
        // data.entries is the list
        const entries = data?.entries || [];
        const match = entries.find(
          (e) => String(e.appointmentId) === String(appointment.id)
        );
        if (mounted) setQueueInfo(match || null);
      } catch (e) {
        console.error("Failed to load queue info for appointment", e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
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

      setToast({
        open: true,
        message: "Patient checked in successfully! ✓",
        severity: "success",
      });
      onUpdate(); // Refresh data but keep modal open

      // Don't call onClose() - let user close modal manually
    } catch (err) {
      setToast({
        open: true,
        message: "Failed to check in: " + err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleNoShow() {
    setConfirmDialog({
      open: true,
      title: "Mark as No-Show",
      message:
        "Mark this appointment as no-show? This action can be reversed if needed.",
      severity: "warning",
      onConfirm: async () => {
        setLoading(true);
        try {
          await authFetch(`/api/staff/appointments/${appointment.id}/no-show`, {
            method: "PUT",
          });
          setToast({
            open: true,
            message: "Appointment marked as no-show",
            severity: "warning",
          });
          onUpdate();
          setTimeout(() => onClose(), 1500);
        } catch (err) {
          setToast({
            open: true,
            message: "Failed to mark no-show: " + err.message,
            severity: "error",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  }

  function handleCancel() {
    setConfirmDialog({
      open: true,
      title: "Cancel Appointment",
      message:
        "Are you sure you want to cancel this appointment? The slot will become available again.",
      severity: "error",
      onConfirm: async () => {
        setLoading(true);
        try {
          await authFetch(`/api/staff/appointments/${appointment.id}/cancel`, {
            method: "DELETE",
          });
          setToast({
            open: true,
            message: "Appointment cancelled successfully",
            severity: "success",
          });
          onUpdate();
          setTimeout(() => onClose(), 1500);
        } catch (err) {
          setToast({
            open: true,
            message: "Failed to cancel: " + err.message,
            severity: "error",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  }

  async function handleSaveTreatmentSummary() {
    if (!treatmentSummary.trim()) {
      setToast({
        open: true,
        message: "Please enter a treatment summary",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      await authFetch(`/api/staff/appointments/${appointment.id}/treatment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatmentSummary }),
      });
      setToast({
        open: true,
        message: "Treatment summary saved successfully ✓",
        severity: "success",
      });
      onUpdate();
    } catch (err) {
      setToast({
        open: true,
        message: "Failed to save summary: " + err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleMarkCompleted() {
    if (!treatmentSummary.trim()) {
      setToast({
        open: true,
        message: "Please add treatment summary before marking as completed",
        severity: "warning",
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Mark as Completed",
      message:
        "Mark this appointment as completed? This will finalize the appointment.",
      severity: "info",
      onConfirm: async () => {
        setLoading(true);
        try {
          await authFetch(
            `/api/staff/appointments/${appointment.id}/complete`,
            {
              method: "PUT",
            }
          );
          setToast({
            open: true,
            message: "Appointment completed successfully! ✓",
            severity: "success",
          });
          onUpdate();
          setTimeout(() => onClose(), 1500);
        } catch (err) {
          setToast({
            open: true,
            message: "Failed to complete: " + err.message,
            severity: "error",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  }

  const statusStyle = getStatusColor(appointment.status);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 4,
                }}
              >
                PATIENT
              </div>
              <div style={{ fontSize: 16 }}>
                {appointment.patient?.fullname ||
                  appointment.patient?.username ||
                  "N/A"}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>
                {appointment.patient?.email || "No email"}
              </div>
            </div>

            <Divider />

            {/* Appointment Info */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 4,
                }}
              >
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
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 4,
                }}
              >
                DOCTOR
              </div>
              <div style={{ fontSize: 16 }}>
                {appointment.doctor?.name || "N/A"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 4,
                }}
              >
                CLINIC
              </div>
              <div style={{ fontSize: 16 }}>
                {appointment.clinic?.name || "N/A"}
              </div>
            </div>

            {/* Treatment Summary Section */}
            {(appointment.status === "CHECKED_IN" ||
              appointment.status === "COMPLETED") && (
              <>
                <Divider />
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    TREATMENT SUMMARY
                  </div>
                  {appointment.status === "COMPLETED" &&
                  appointment.treatmentSummary ? (
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
                      disabled={
                        appointment.status === "COMPLETED" ||
                        !(queueInfo && queueInfo.status === "CALLED")
                      }
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
                onClick={handleCancel}
                color="error"
                variant="outlined"
                disabled={loading}
              >
                Cancel Appointment
              </Button>
              <Button
                onClick={handleNoShow}
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
                disabled={
                  loading ||
                  !treatmentSummary.trim() ||
                  !(queueInfo && queueInfo.status === "CALLED")
                }
              >
                Save Summary
              </Button>
              <Button
                onClick={handleMarkCompleted}
                color="success"
                variant="contained"
                disabled={
                  loading || !(queueInfo && queueInfo.status === "CALLED")
                }
              >
                Mark Completed
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      <Toast
        open={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
        severity={toast.severity}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        severity={confirmDialog.severity}
      />
    </>
  );
}
