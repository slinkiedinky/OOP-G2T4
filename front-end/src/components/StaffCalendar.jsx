"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { authFetch } from "../lib/api";
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
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import BookSlotForPatientModal from "./BookSlotForPatientModal";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function StaffCalendar() {
  // Clinic filtering states
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [clinicTypeFilter, setClinicTypeFilter] = useState("");
  const [locationFilters, setLocationFilters] = useState([]);
  const locations = ["CENTRAL", "EAST", "WEST", "NORTH", "SOUTH"];

  // Doctor and appointment states
  const [appointments, setAppointments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [doctors, setDoctors] = useState([]);

  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [bookSlotModalOpen, setBookSlotModalOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);

  // Load clinics on mount
  useEffect(() => {
    loadClinics();
  }, []);

  // Load doctors when clinic changes
  useEffect(() => {
    if (selectedClinic) {
      loadDoctors();
      loadAppointments();
    } else {
      setDoctors([]);
      setSelectedDoctor("");
      setAppointments([]);
      setCalendarEvents([]);
    }
  }, [selectedClinic, selectedDoctor]);

  async function loadClinics() {
    try {
      const res = await authFetch("/api/clinics");
      const data = await res.json();
      setClinics(data);
      if (data.length > 0) {
        setSelectedClinic(data[0]);
      }
    } catch (err) {
      console.error("Failed to load clinics:", err);
    }
  }

  async function loadDoctors() {
    if (!selectedClinic) return;
    try {
      const res = await authFetch(`/api/clinics/${selectedClinic.id}/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    }
  }

  async function loadAppointments() {
    if (!selectedClinic) return;

    setLoading(true);
    try {
      let url = `/api/staff/appointments/upcoming?clinicId=${selectedClinic.id}`;
      if (selectedDoctor) {
        const today = new Date().toISOString().split("T")[0];
        url = `/api/staff/appointments/upcoming/by-doctor?clinicId=${selectedClinic.id}&date=${today}&doctorId=${selectedDoctor}`;
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

  function handleAppointmentClick(appointment) {
    setSelectedAppointment(appointment);
    setDetailsModalOpen(true);
  }

  function handleModalClose() {
    setDetailsModalOpen(false);
    setSelectedAppointment(null);
  }

  function handleAppointmentUpdate() {
    loadAppointments();
    if (selectedDate) {
      loadDayAppointments(selectedDate);
    }
  }

  async function handleDateClick(info) {
    if (!selectedClinic) return;

    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);

    try {
      let url = `/api/staff/appointments/upcoming/by-date?clinicId=${selectedClinic.id}&date=${clickedDate}`;
      if (selectedDoctor) {
        url = `/api/staff/appointments/upcoming/by-doctor?clinicId=${selectedClinic.id}&date=${clickedDate}&doctorId=${selectedDoctor}`;
      }

      const res = await authFetch(url);
      const dayAppts = await res.json();

      let slotsUrl = `/api/patient/appointments/available?clinicId=${selectedClinic.id}&date=${clickedDate}`;
      if (selectedDoctor) {
        slotsUrl += `&doctorId=${selectedDoctor}`;
      }
      const slotsRes = await authFetch(slotsUrl);
      const availableSlots = await slotsRes.json();
      const unbookedSlots = availableSlots.filter(
        (slot) => !dayAppts.some((appt) => appt.id === slot.id)
      );
      setDayAppointments([...dayAppts, ...unbookedSlots]);
      setDayViewOpen(true);
    } catch (err) {
      console.error("Failed to load day data:", err);
    }
  }

  function handleEventClick(info) {
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
      const updated = dayAppointments.filter((appt) => appt.id !== apptId);
      setDayAppointments(updated);
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    }
  }

  function handleClearFilters() {
    setClinicTypeFilter("");
    setLocationFilters([]);
    setSelectedDoctor("");
  }

  const handleLocationChange = (event) => {
    const value = event.target.value;
    setLocationFilters(typeof value === "string" ? value.split(",") : value);
  };

  const filteredClinics = clinics.filter((clinic) => {
    const matchesType =
      !clinicTypeFilter || clinic.clinicType === clinicTypeFilter;
    const matchesLocation =
      locationFilters.length === 0 || locationFilters.includes(clinic.location);
    return matchesType && matchesLocation;
  });

  return (
    <div style={{ width: "100%" }}>
      {/* Filters */}
      <Card sx={{ marginBottom: 2 }}>
        <CardContent sx={{ padding: "16px !important" }}>
          {/* Autocomplete Search */}
          <Autocomplete
            options={filteredClinics}
            value={selectedClinic}
            onChange={(event, newValue) => {
              setSelectedClinic(newValue);
            }}
            getOptionLabel={(option) => option.name || ""}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <div style={{ fontWeight: 600 }}>{option.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {option.address} • {option.location} • {option.clinicType} •
                    ID: {option.id}
                  </div>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by clinic name, address, location, or ID..."
                size="small"
              />
            )}
            sx={{ marginBottom: 2 }}
          />

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Clinic Type</InputLabel>
              <Select
                value={clinicTypeFilter}
                onChange={(e) => setClinicTypeFilter(e.target.value)}
                label="Clinic Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="GP">General Practice</MenuItem>
                <MenuItem value="SPECIALIST">Specialist</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Location</InputLabel>
              <Select
                multiple
                value={locationFilters}
                onChange={handleLocationChange}
                input={<OutlinedInput label="Location" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    <Checkbox checked={locationFilters.indexOf(loc) > -1} />
                    <ListItemText primary={loc} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              sx={{ minWidth: 180 }}
              size="small"
              disabled={!selectedClinic}
            >
              <InputLabel>Doctor (Optional)</InputLabel>
              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                label="Doctor (Optional)"
              >
                <MenuItem value="">
                  <em>All Doctors</em>
                </MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(clinicTypeFilter ||
              locationFilters.length > 0 ||
              selectedDoctor) && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                size="small"
                sx={{ height: 40 }}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "#64748b",
              fontStyle: "italic",
            }}
          >
            💡 Click on any date to see appointments for that day
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {!selectedClinic ? (
        <Card>
          <CardContent>
            <p style={{ textAlign: "center", color: "#666", padding: 40 }}>
              Please select a clinic to view appointments
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
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
          Appointments for{" "}
          {selectedDate ? new Date(selectedDate).toLocaleDateString() : ""}
        </DialogTitle>
        <DialogContent>
          {dayAppointments.length === 0 ? (
            <p style={{ color: "#666" }}>
              No appointments or slots for this date.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {/* Booked Appointments */}
              {dayAppointments.filter((appt) => appt.patient).length > 0 && (
                <>
                  <h4 style={{ marginBottom: 8 }}>
                    Booked Appointments (
                    {dayAppointments.filter((appt) => appt.patient).length})
                  </h4>
                  <div style={{ display: "grid", gap: 12 }}>
                    {dayAppointments
                      .filter((appt) => appt.patient)
                      .map((appt) => (
                        <Card
                          key={appt.id}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "#f9fafb" },
                          }}
                          onClick={() => handleAppointmentClick(appt)}
                        >
                          <CardContent>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {new Date(appt.startTime).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </div>
                                <div style={{ fontSize: 14, color: "#666" }}>
                                  Patient:{" "}
                                  {appt.patient?.name ||
                                    appt.patient?.username ||
                                    "N/A"}
                                </div>
                                <div style={{ fontSize: 14, color: "#666" }}>
                                  Doctor: {appt.doctor?.name || "N/A"}
                                </div>
                              </div>
                              <Chip
                                label={appt.status}
                                size="small"
                                color={
                                  appt.status === "BOOKED"
                                    ? "primary"
                                    : "success"
                                }
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </>
              )}

              {/* Available Slots */}
              {dayAppointments.filter((slot) => !slot.patient).length > 0 && (
                <>
                  <h4 style={{ marginBottom: 8, marginTop: 16 }}>
                    Available Slots (
                    {dayAppointments.filter((slot) => !slot.patient).length})
                  </h4>
                  <div style={{ display: "grid", gap: 12 }}>
                    {dayAppointments
                      .filter(
                        (slot) => !slot.patient && slot.status === "AVAILABLE"
                      )
                      .map((slot) => (
                        <Card
                          key={slot.id}
                          sx={{
                            cursor: "pointer",
                            border: "1px solid #e0e0e0",
                            "&:hover": {
                              backgroundColor: "#f5f5f5",
                              borderColor: "#2196f3",
                            },
                          }}
                          onClick={() => {
                            setSelectedSlotForBooking(slot);
                            setBookSlotModalOpen(true);
                          }}
                        >
                          <CardContent>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 16 }}>
                                  {new Date(slot.startTime).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#666",
                                    marginTop: 4,
                                  }}
                                >
                                  Doctor: {slot.doctor?.name || "N/A"}
                                </div>
                                <div style={{ marginTop: 8 }}>
                                  <span
                                    style={{
                                      padding: "4px 12px",
                                      borderRadius: 4,
                                      background: "#e8f5e9",
                                      color: "#2e7d32",
                                      fontWeight: 500,
                                      fontSize: 13,
                                    }}
                                  >
                                    Available
                                  </span>
                                </div>
                              </div>
                              <div style={{ color: "#2196f3", fontSize: 24 }}>
                                +
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <AppointmentDetailsModal
        open={detailsModalOpen}
        onClose={handleModalClose}
        appointment={selectedAppointment}
        onUpdate={handleAppointmentUpdate}
      />

      <BookSlotForPatientModal
        open={bookSlotModalOpen}
        onClose={() => {
          setBookSlotModalOpen(false);
          setSelectedSlotForBooking(null);
        }}
        slot={selectedSlotForBooking}
        onSuccess={() => {
          loadAppointments();
          setDayViewOpen(false);
        }}
      />
    </div>
  );
}
