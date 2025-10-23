"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { authFetch } from "../lib/api";
import TimeSlotPicker from "./TimeSlotPicker";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

export default function PatientCalendar({ patientId = 1 }) {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Time slot picker state
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Load clinics on mount
  useEffect(() => {
    loadClinics();
  }, []);

  // Load doctors when clinic is selected
  useEffect(() => {
    if (selectedClinic) {
      loadDoctors();
      loadAppointmentsForCalendar();
    }
  }, [selectedClinic, selectedDoctor]);

  async function loadClinics() {
    try {
      const res = await authFetch("/api/patient/clinics");
      const data = await res.json();
      setClinics(data);
      if (data.length > 0) {
        setSelectedClinic(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load clinics:", err);
    }
  }

  async function loadDoctors() {
    if (!selectedClinic) return;
    try {
      const res = await authFetch(
        `/api/patient/clinics/${selectedClinic}/doctors`
      );
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    }
  }

  async function loadAppointmentsForCalendar() {
    if (!selectedClinic) return;

    setLoading(true);
    try {
      // Get patient's existing appointments for this clinic
      const res = await authFetch(
        `/api/patient/appointments?patientId=${patientId}`
      );
      const appointments = await res.json();

      // Filter by selected clinic
      const clinicAppointments = appointments.filter(
        (appt) => appt.clinic?.id === parseInt(selectedClinic)
      );

      // Convert to calendar events
      const events = clinicAppointments.map((appt) => ({
        id: appt.id,
        title: `${new Date(appt.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })} - Dr. ${appt.doctor?.name || "Unknown"}`,
        start: appt.startTime,
        color: appt.status === "BOOKED" ? "#2563eb" : "#94a3b8",
        extendedProps: appt,
      }));

      setCalendarEvents(events);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDateClick(info) {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    setSlotPickerOpen(true);

    // Load available slots for this date
    setSlotsLoading(true);
    try {
      let url = `/api/patient/slots?clinicId=${selectedClinic}&date=${clickedDate}`;
      if (selectedDoctor) {
        url += `&doctorId=${selectedDoctor}`;
      }

      const res = await authFetch(url);
      const slots = await res.json();
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Failed to load slots:", err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleBookSlot(slot) {
    try {
      await authFetch(
        `/api/patient/appointments?patientId=${patientId}&slotId=${slot.id}`,
        { method: "POST" }
      );
      alert("Appointment booked successfully!");
      setSlotPickerOpen(false);
      loadAppointmentsForCalendar();
    } catch (err) {
      alert("Failed to book appointment: " + err.message);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Filters */}
      <Card sx={{ marginBottom: 2 }}>
        <CardContent>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Clinic</InputLabel>
              <Select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                label="Clinic"
              >
                {clinics.map((clinic) => (
                  <MenuItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Doctor (Optional)</InputLabel>
              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                label="Doctor (Optional)"
              >
                <MenuItem value="">All Doctors</MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div
            style={{ marginTop: 12, fontSize: 14, color: "#666", fontStyle: "italic" }}
          >
            Click on any date to see available time slots and book an appointment
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 64 }}>
          <CircularProgress />
        </div>
      ) : (
        <Card>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              dateClick={handleDateClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth",
              }}
              height="auto"
              eventDisplay="block"
            />
          </CardContent>
        </Card>
      )}

      {/* Time Slot Picker Modal */}
      <TimeSlotPicker
        open={slotPickerOpen}
        onClose={() => setSlotPickerOpen(false)}
        selectedDate={selectedDate}
        slots={availableSlots}
        loading={slotsLoading}
        onBookSlot={handleBookSlot}
      />
    </div>
  );
}