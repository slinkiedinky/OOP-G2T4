"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { authFetch } from "../lib/api";
import AppointmentList from "./AppointmentList";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

export default function StaffCalendar({ clinicId = 22 }) {
  const [appointments, setAppointments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [doctors, setDoctors] = useState([]);

  // Day view dialog
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayAppointments, setDayAppointments] = useState([]);

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, [clinicId, selectedDoctor]);

  async function loadDoctors() {
    try {
      const res = await authFetch(`/api/patient/clinics/${clinicId}/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    }
  }

  async function loadAppointments() {
    setLoading(true);
    try {
      let url = `/api/staff/appointments/upcoming?clinicId=${clinicId}`;
      if (selectedDoctor) {
        // Get all appointments for a specific doctor
        const today = new Date().toISOString().split("T")[0];
        url = `/api/staff/appointments/upcoming/by-doctor?clinicId=${clinicId}&date=${today}&doctorId=${selectedDoctor}`;
      }

      const res = await authFetch(url);
      const data = await res.json();
      setAppointments(data);

      // Convert to calendar events - group by date
      const eventMap = {};
      data.forEach((appt) => {
        const dateStr = appt.startTime.split("T")[0];
        if (!eventMap[dateStr]) {
          eventMap[dateStr] = {
            id: dateStr,
            title: "",
            start: dateStr,
            count: 0,
            appointments: [],
          };
        }
        eventMap[dateStr].count++;
        eventMap[dateStr].appointments.push(appt);
      });

      // Create events with counts
      const events = Object.values(eventMap).map((event) => ({
        ...event,
        title: `${event.count} appointment${event.count > 1 ? "s" : ""}`,
        color: "#2563eb",
      }));

      setCalendarEvents(events);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleDateClick(info) {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);

    // Filter appointments for this date
    const dateAppointments = appointments.filter(
      (appt) => appt.startTime.split("T")[0] === clickedDate
    );
    setDayAppointments(dateAppointments);
    setDayViewOpen(true);
  }

  function handleEventClick(info) {
    // When clicking on an event (appointment count), show that day's appointments
    const clickedDate = info.event.startStr;
    setSelectedDate(clickedDate);
    setDayAppointments(info.event.extendedProps.appointments || []);
    setDayViewOpen(true);
  }

  async function handleCheckIn(apptId) {
    if (!confirm("Check in this patient?")) return;

    try {
      await authFetch(`/api/staff/appointments/${apptId}/check-in`, {
        method: "POST",
      });
      alert("Patient checked in successfully!");
      loadAppointments();
      // Update day view
      const updated = dayAppointments.map((appt) =>
        appt.id === apptId ? { ...appt, status: "CHECKED_IN" } : appt
      );
      setDayAppointments(updated);
    } catch (err) {
      alert("Failed to check in: " + err.message);
    }
  }

  async function handleCancel(apptId) {
    if (!confirm("Cancel this appointment?")) return;

    try {
      await authFetch(`/api/staff/appointments/${apptId}/cancel`, {
        method: "DELETE",
      });
      alert("Appointment cancelled successfully!");
      loadAppointments();
      // Update day view
      const updated = dayAppointments.filter((appt) => appt.id !== apptId);
      setDayAppointments(updated);
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Filters */}
      <Card sx={{ marginBottom: 2 }}>
        <CardContent>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                label="Filter by Doctor"
              >
                <MenuItem value="">All Doctors</MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Chip
                label={`Total: ${appointments.length} appointments`}
                color="primary"
                variant="outlined"
              />
            </div>
          </div>
          <div
            style={{ marginTop: 12, fontSize: 14, color: "#666", fontStyle: "italic" }}
          >
            Click on any date to see appointments for that day
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
              eventClick={handleEventClick}
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

      {/* Day View Dialog */}
      <Dialog
        open={dayViewOpen}
        onClose={() => setDayViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Appointments
          {selectedDate && (
            <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </DialogTitle>
        <DialogContent>
          {dayAppointments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "#666" }}>
              No appointments for this date
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16, color: "#666" }}>
                {dayAppointments.length} appointment
                {dayAppointments.length > 1 ? "s" : ""}
              </div>
              <AppointmentList
                appointments={dayAppointments}
                onCheckIn={handleCheckIn}
                onCancel={handleCancel}
                showPatientInfo={true}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}