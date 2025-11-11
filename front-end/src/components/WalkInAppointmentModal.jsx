"use client";
import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import { authFetch } from "../lib/api";

/**
 * WalkInAppointmentModal
 *
 * Modal used by staff to create a walk-in appointment for an existing
 * patient. Loads patients, doctors and available slots for a selected date.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string|number} props.clinicId - Clinic identifier to create appointment in
 * @param {Function} props.onSuccess - Callback invoked after successful creation
 * @returns {JSX.Element}
 */
export default function WalkInAppointmentModal({ open, onClose, clinicId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (open) {
      loadPatientsAndDoctors();
      // Set today's date as default
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
  }, [open, clinicId]);

  useEffect(() => {
    if (selectedDate && clinicId) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedDoctor, clinicId]);

  async function loadPatientsAndDoctors() {
    try {
      // Load all patients (you'll need an endpoint for this)
      const patientsRes = await authFetch("/api/staff/patients");
      const patientsData = await patientsRes.json();
      setPatients(patientsData);

      // Load doctors for this clinic
      const doctorsRes = await authFetch(`/api/patient/clinics/${clinicId}/doctors`);
      const doctorsData = await doctorsRes.json();
      setDoctors(doctorsData);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }

  async function loadAvailableSlots() {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      let url = `/api/patient/appointments/available?clinicId=${clinicId}&date=${selectedDate}`;
      if (selectedDoctor) {
        url += `&doctorId=${selectedDoctor}`;
      }

      const res = await authFetch(url);
      const slots = await res.json();
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Failed to load slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit() {
    if (!selectedPatient || !selectedSlot) {
      alert("Please select a patient and time slot");
      return;
    }

    setLoading(true);
    try {
      await authFetch(`/api/patient/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: selectedSlot,
          patientId: selectedPatient.id,
        }),
      });
      alert("Walk-in appointment created successfully!");
      handleClose();
      onSuccess();
    } catch (err) {
      alert("Failed to create appointment: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelectedPatient(null);
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Walk-in Appointment</DialogTitle>
      <DialogContent>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          {/* Patient Selection */}
          <Autocomplete
            options={patients}
            value={selectedPatient}
            onChange={(event, newValue) => setSelectedPatient(newValue)}
            getOptionLabel={(option) =>
              `${option.name || option.username || option.email} (ID: ${option.id})`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Patient"
                placeholder="Search by name or email..."
                required
              />
            )}
          />

          {/* Date Selection */}
          <TextField
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            inputProps={{ min: new Date().toISOString().split("T")[0] }}
          />

          {/* Doctor Filter (Optional) */}
          <FormControl>
            <InputLabel>Filter by Doctor (Optional)</InputLabel>
            <Select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              label="Filter by Doctor (Optional)"
            >
              <MenuItem value="">
                <em>Any available doctor</em>
              </MenuItem>
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Time Slot Selection */}
          <FormControl required>
            <InputLabel>Select Time Slot</InputLabel>
            <Select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              label="Select Time Slot"
              disabled={loadingSlots || !selectedDate}
            >
              {loadingSlots ? (
                <MenuItem disabled>
                  <CircularProgress size={20} /> Loading slots...
                </MenuItem>
              ) : availableSlots.length === 0 ? (
                <MenuItem disabled>No available slots for this date</MenuItem>
              ) : (
                availableSlots.map((slot) => (
                  <MenuItem key={slot.id} value={slot.id}>
                    {new Date(slot.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    - {slot.doctor?.name || "N/A"}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {availableSlots.length > 0 && (
            <div style={{ fontSize: 12, color: "#666" }}>
              {availableSlots.length} slot(s) available
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedPatient || !selectedSlot}
        >
          {loading ? "Creating..." : "Create Appointment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}