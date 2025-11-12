"use client";
import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import { authFetch } from "../lib/api";

/**
 * BookSlotForPatientModal
 *
 * Modal used by staff to book a specific slot for an existing or new
 * patient. Supports searching existing patients and creating a new patient
 * record before booking.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Object} props.slot - Slot object being booked
 * @param {Function} props.onSuccess - Callback invoked after successful booking
 * @returns {JSX.Element|null}
 */
export default function BookSlotForPatientModal({
  open,
  onClose,
  slot,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0 = Existing, 1 = New

  // New patient form fields
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");

  useEffect(() => {
    if (open) {
      loadPatients();
    }
  }, [open]);

  async function loadPatients() {
    try {
      const res = await authFetch("/api/staff/patients");
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error("Failed to load patients:", err);
    }
  }

  async function handleSubmitExisting() {
    if (!selectedPatient) {
      alert("Please select a patient");
      return;
    }

    setLoading(true);
    try {
      await authFetch(`/api/staff/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: slot.id,
          patientId: selectedPatient.id,
        }),
      });
      alert("Appointment booked successfully!");
      handleClose();
      onSuccess();
    } catch (err) {
      alert("Failed to book appointment: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitNew() {
    if (!newPatientName.trim() || !newPatientEmail.trim()) {
      alert("Please enter patient name and email");
      return;
    }

    // Basic email validation
    if (!newPatientEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register new patient
      const registerRes = await authFetch(`/api/staff/patients/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPatientName,
          email: newPatientEmail,
        }),
      });
      const newPatient = await registerRes.json();

      // Step 2: Book appointment for the new patient
      await authFetch(`/api/staff/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: slot.id,
          patientId: newPatient.id,
        }),
      });

      alert(
        `New patient registered and appointment booked!`
      );
      handleClose();
      onSuccess();
    } catch (err) {
      alert("Failed to register patient or book appointment: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelectedPatient(null);
    setNewPatientName("");
    setNewPatientEmail("");
    setTabValue(0);
    onClose();
  }

  if (!slot) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Book Walk-in Appointment</DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 8,
          }}
        >
          {/* Slot Details */}
          <div
            style={{
              padding: 12,
              backgroundColor: "#f5f5f5",
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Selected Time Slot
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              <strong>Time:</strong>{" "}
              {new Date(slot.startTime).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              <strong>Doctor:</strong> {slot.doctor?.name || "N/A"}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              <strong>Clinic:</strong> {slot.clinic?.name || "N/A"}
            </div>
          </div>

          {/* Tabs for Existing vs New Patient */}
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              aria-label="patient selection tabs"
            >
              <Tab label="Existing Patient" />
              <Tab label="New Patient" />
            </Tabs>
          </Box>

          {/* Existing Patient Tab */}
          {tabValue === 0 && (
            <Box sx={{ paddingTop: 2 }}>
              <Autocomplete
                options={patients}
                value={selectedPatient}
                onChange={(event, newValue) => setSelectedPatient(newValue)}
                getOptionLabel={(option) =>
                  `${option.fullname || option.username || option.email} (ID: ${
                    option.id
                  })`
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {option.fullname || option.username || "Unnamed Patient"}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {option.email} • ID: {option.id}
                      </div>
                    </div>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Patient *"
                    placeholder="Search by name, email, or ID..."
                    required
                  />
                )}
              />
            </Box>
          )}

          {/* New Patient Tab */}
          {tabValue === 1 && (
            <Box
              sx={{
                paddingTop: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Alert severity="info" sx={{ fontSize: 13 }}>
                A new patient account will be created and an email will be sent to them to reset their password.
              </Alert>

              <TextField
                label="Patient Name *"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                fullWidth
              />

              <TextField
                label="Email Address *"
                type="email"
                value={newPatientEmail}
                onChange={(e) => setNewPatientEmail(e.target.value)}
                placeholder="e.g. john.doe@example.com"
                required
                fullWidth
              />

              <div style={{ fontSize: 12, color: "#666", fontStyle: "italic" }}>
                💡 Patient can change their password later
              </div>
            </Box>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {tabValue === 0 ? (
          <Button
            onClick={handleSubmitExisting}
            variant="contained"
            disabled={loading || !selectedPatient}
          >
            {loading ? "Booking..." : "Book Appointment"}
          </Button>
        ) : (
          <Button
            onClick={handleSubmitNew}
            variant="contained"
            disabled={
              loading || !newPatientName.trim() || !newPatientEmail.trim()
            }
          >
            {loading ? "Creating..." : "Register & Book"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
