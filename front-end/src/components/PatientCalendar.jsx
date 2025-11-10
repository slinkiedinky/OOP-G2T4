"use client";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { authFetch } from "../lib/api";
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
import Button from "@mui/material/Button";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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

export default function PatientCalendar({ patientId }) {
  // Clinic filtering states
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [clinicTypeFilter, setClinicTypeFilter] = useState("");
  const [locationFilters, setLocationFilters] = useState([]);
  const locations = ["CENTRAL", "EAST", "WEST", "NORTH", "SOUTH"];

  // Doctor and appointment states
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Side panel states
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dayAppointments, setDayAppointments] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Track available slots by date for calendar display
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState({});

  const renderEventContent = useCallback((eventInfo) => {
    const {
      availableCount = 0,
      hasMyBooking = false,
    } = eventInfo.event.extendedProps || {};

    const baseTag = {
      display: "block",
      width: "100%",
      fontSize: 11,
      fontWeight: 600,
      padding: "4px 8px",
      borderRadius: 12,
      textAlign: "center",
      boxSizing: "border-box",
    };

    const badges = [];

    if (hasMyBooking) {
      badges.push(
        <span
          key="booked"
          style={{
            ...baseTag,
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#047857",
          }}
        >
          ✓ Booked
        </span>
      );
    }

    if (!hasMyBooking && availableCount > 0) {
      badges.push(
        <span
          key="available"
          style={{
            ...baseTag,
            backgroundColor: "rgba(37, 99, 235, 0.12)",
            color: "#1d4ed8",
          }}
        >
          {availableCount} slot{availableCount > 1 ? "s" : ""}
        </span>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
        }}
      >
        {badges}
      </div>
    );
  }, []);

  // Load clinics on mount
  useEffect(() => {
    loadClinics();
  }, []);

  // Load doctors and appointments when clinic changes
  useEffect(() => {
    if (selectedClinic && patientId) {
      loadDoctors();
      loadAppointments();
      loadDayAppointments(selectedDate);
    } else {
      setDoctors([]);
      setSelectedDoctor("");
      setAppointments([]);
      setCalendarEvents([]);
      setDayAppointments([]);
      setAvailableSlotsByDate({});
    }
  }, [selectedClinic, selectedDoctor, patientId]);

  // Reload day appointments when date changes
  useEffect(() => {
    if (selectedClinic && selectedDate && patientId) {
      loadDayAppointments(selectedDate);
    }
  }, [selectedDate]);

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
    if (!selectedClinic || !patientId) return;

    setLoading(true);
    try {
      // Get patient's booked appointments
      const res = await authFetch(
        `/api/patient/appointments?patientId=${patientId}`
      );
      const data = await res.json();

      // Filter by selected clinic and doctor
      const filteredData = data.filter((appt) => {
        const matchesClinic = appt.clinic?.id === selectedClinic.id;
        const matchesDoctor =
          !selectedDoctor || appt.doctor?.id === parseInt(selectedDoctor);
        return matchesClinic && matchesDoctor;
      });

      setAppointments(filteredData);

      // Get available slots for next 60 days
      const slotsByDate = {};
      const eventMap = {};
      const today = new Date();

      // Track patient bookings per day
      filteredData.forEach((appt) => {
        const dateStr = appt.startTime.split("T")[0];
        if (!eventMap[dateStr]) {
          eventMap[dateStr] = {
            id: dateStr,
            start: dateStr,
            bookedCount: 0,
            availableCount: 0,
            hasMyBooking: false,
          };
        }
        eventMap[dateStr].bookedCount += 1;
        eventMap[dateStr].hasMyBooking = true;
      });

      // Fetch available slots for next 60 days
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        try {
          let url = `/api/patient/appointments/available?clinicId=${selectedClinic.id}&date=${dateStr}`;
          if (selectedDoctor) {
            url += `&doctorId=${selectedDoctor}`;
          }

          const res = await authFetch(url);
          const slots = await res.json();

          // Filter out past and already booked slots
          const now = new Date();
          const availableSlots = slots.filter((slot) => {
            const slotTime = new Date(slot.startTime);
            const isNotBooked = !filteredData.some(
              (appt) => appt.id === slot.id
            );
            const isInFuture = slotTime > now;
            return isNotBooked && isInFuture;
          });

          if (availableSlots.length > 0) {
            slotsByDate[dateStr] = availableSlots;

            if (!eventMap[dateStr]) {
              eventMap[dateStr] = {
                id: dateStr,
                start: dateStr,
                bookedCount: 0,
                availableCount: 0,
                hasMyBooking: false,
              };
            }
            eventMap[dateStr].availableCount += availableSlots.length;
          }
        } catch (err) {
          console.error(`Failed to load slots for ${dateStr}:`, err);
        }
      }

      setAvailableSlotsByDate(slotsByDate);
      const events = Object.values(eventMap).map((event) => ({
        id: event.id,
        start: event.start,
        title: "",
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: "#0f172a",
        extendedProps: event,
      }));
      setCalendarEvents(events);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDayAppointments(dateStr) {
    if (!selectedClinic || !patientId) return;

    const normalizedDate = dateStr.split("T")[0];
    setDayLoading(true);

    try {
      // Get patient's appointments for this date
      const res = await authFetch(
        `/api/patient/appointments?patientId=${patientId}`
      );
      const allAppts = await res.json();

      const dayAppts = allAppts.filter((appt) => {
        const apptDate = appt.startTime.split("T")[0];
        const matchesDate = apptDate === normalizedDate;
        const matchesClinic = appt.clinic?.id === selectedClinic.id;
        const matchesDoctor =
          !selectedDoctor || appt.doctor?.id === parseInt(selectedDoctor);
        return matchesDate && matchesClinic && matchesDoctor;
      });

      // Get available slots from cache or fetch
      let availableSlots = availableSlotsByDate[normalizedDate] || [];

      // If not in cache, fetch them
      if (availableSlots.length === 0) {
        let slotsUrl = `/api/patient/appointments/available?clinicId=${selectedClinic.id}&date=${normalizedDate}`;
        if (selectedDoctor) {
          slotsUrl += `&doctorId=${selectedDoctor}`;
        }

        const slotsRes = await authFetch(slotsUrl);
        if (slotsRes.ok) {
          const slots = await slotsRes.json();
          const now = new Date();
          availableSlots = slots.filter((slot) => {
            const slotTime = new Date(slot.startTime);
            const isNotBooked = !dayAppts.some((appt) => appt.id === slot.id);
            const isInFuture = slotTime > now;
            return isNotBooked && isInFuture;
          });
        }
      }

      setDayAppointments([...dayAppts, ...availableSlots]);
    } catch (err) {
      console.error("Failed to load day data:", err);
    } finally {
      setDayLoading(false);
    }
  }

  function handleDateClick(info) {
    setSelectedDate(info.dateStr);
  }

  function handleEventClick(info) {
    setSelectedDate(info.event.startStr);
  }

  async function handleBookSlot(slot) {
    try {
      const res = await authFetch("/api/patient/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, patientId: patientId }),
      });

      if (!res.ok) throw new Error("Failed to book appointment");

      alert("Appointment booked successfully!");
      loadAppointments();
      loadDayAppointments(selectedDate);
    } catch (err) {
      alert("Failed to book appointment: " + err.message);
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
      {/* Legend */}
      <Card sx={{ marginBottom: 2, backgroundColor: "#f8fafc" }}>
        <CardContent sx={{ padding: "12px 16px !important" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>
                Legend:
              </span>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "#3b82f6",
                  borderRadius: 1,
                }}
              />
              <span style={{ fontSize: 14 }}>Available slots</span>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "#10b981",
                  borderRadius: 1,
                }}
              />
              <span style={{ fontSize: 14 }}>Your booked appointment</span>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filters - Full Width */}
      <Card sx={{ marginBottom: 2 }}>
        <CardContent sx={{ padding: "16px !important" }}>
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
              <InputLabel>Preferred Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                label="Preferred Doctor"
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
            💡 Click on any date to see your appointments and available slots
          </div>
        </CardContent>
      </Card>

      {/* Calendar and Side Panel */}
      <div
        style={{
          display: "flex",
          gap: 16,
          width: "100%",
          alignItems: "stretch",
        }}
      >
        {/* Main Calendar Section */}
        <div style={{ flex: "0 0 65%" }}>
          {!selectedClinic ? (
            <Card sx={{ height: 640 }}>
              <CardContent>
                <p style={{ textAlign: "center", color: "#666", padding: 40 }}>
                  Please select a clinic to view appointments
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card sx={{ height: 640 }}>
              <CardContent>
                <div style={{ textAlign: "center", padding: 64 }}>
                  <CircularProgress />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: 640 }}>
              <CardContent sx={{ height: "100%" }}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={calendarEvents}
                  eventContent={renderEventContent}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  buttonText={{ today: "Back to Today" }}
                  headerToolbar={{
                    left: "prev,next",
                    center: "title",
                    right: "today",
                  }}
                  height="100%"
                  eventDisplay="block"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side Panel - WITH EXPLICIT HEIGHT */}
        <div style={{ flex: "0 0 35%" }}>
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              height: 640,
            }}
          >
            {/* Header - Fixed */}
            <CardContent
              sx={{
                flexShrink: 0,
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "16px !important",
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : ""}
                </h3>
                {selectedDate === new Date().toISOString().split("T")[0] && (
                  <div
                    style={{
                      display: "inline-block",
                      fontSize: 14,
                      color: "#1976d2",
                      fontWeight: 700,
                      padding: "8px 16px",
                      backgroundColor: "#e3f2fd",
                      borderRadius: 8,
                      border: "2px solid #1976d2",
                      letterSpacing: "0.5px",
                      boxShadow: "0 2px 4px rgba(25, 118, 210, 0.2)",
                    }}
                  >
                    📅 TODAY
                  </div>
                )}
              </div>
            </CardContent>

            {/* Scrollable Content */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {dayLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <CircularProgress size={32} />
                </div>
              ) : !selectedClinic ? (
                <p
                  style={{
                    color: "#666",
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  Select a clinic to view appointments
                </p>
              ) : dayAppointments.length === 0 ? (
                <p
                  style={{
                    color: "#666",
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  No appointments or available slots for this date.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {/* Your Appointments */}
                  {dayAppointments.filter((appt) => appt.patient).length >
                    0 && (
                    <>
                      <h4
                        style={{ marginBottom: 8, fontSize: 16, marginTop: 0 }}
                      >
                        Your Appointments (
                        {dayAppointments.filter((appt) => appt.patient).length})
                      </h4>
                      <div style={{ display: "grid", gap: 12 }}>
                        {dayAppointments
                          .filter((appt) => appt.patient)
                          .map((appt) => (
                            <Card
                              key={appt.id}
                              sx={{
                                border: "1px solid #e2e8f0",
                                backgroundColor: "#ffffff",
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
                              }}
                            >
                              <CardContent sx={{ padding: "12px !important" }}>
                                <div style={{ fontWeight: 600 }}>
                                  {new Date(appt.startTime).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#666",
                                    marginTop: 4,
                                  }}
                                >
                                  Doctor:{" "}
                                  {(
                                    appt.doctor?.fullName ??
                                    appt.doctor?.fullname ??
                                    appt.doctor?.name ??
                                    ""
                                  )
                                    .replace(/^Dr\.?\s*/i, "")
                                    .trim() || "N/A"}
                                </div>
                                <div style={{ fontSize: 13, color: "#666" }}>
                                  Clinic: {appt.clinic?.name || "N/A"}
                                </div>
                                <Chip
                                  label={appt.status}
                                  size="small"
                                  sx={{
                                    marginTop: 1,
                                    fontWeight: 600,
                                    backgroundColor:
                                      appt.status === "BOOKED"
                                        ? "#dbeafe"
                                        : "#dcfce7",
                                    color:
                                      appt.status === "BOOKED"
                                        ? "#1d4ed8"
                                        : "#047857",
                                  }}
                                />
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </>
                  )}

                  {/* Available Slots */}
                  {dayAppointments.filter((slot) => !slot.patient).length >
                    0 && (
                    <>
                      <h4
                        style={{ marginBottom: 8, marginTop: 16, fontSize: 16 }}
                      >
                        Available Slots (
                        {dayAppointments.filter((slot) => !slot.patient).length}
                        )
                      </h4>
                      <div style={{ display: "grid", gap: 12 }}>
                        {dayAppointments
                          .filter(
                            (slot) =>
                              !slot.patient && slot.status === "AVAILABLE"
                          )
                          .map((slot) => (
                            <Card
                              key={slot.id}
                              sx={{
                                border: "1px solid #e2e8f0",
                                backgroundColor: "#ffffff",
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
                                "&:hover": { backgroundColor: "#f8fafc" },
                              }}
                            >
                              <CardContent sx={{ padding: "12px !important" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{ fontWeight: 600, fontSize: 15 }}
                                    >
                                      {new Date(
                                        slot.startTime
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: "#666",
                                        marginTop: 4,
                                      }}
                                    >
                                      Doctor:{" "}
                                      {(
                                        slot.doctor?.fullName ??
                                        slot.doctor?.fullname ??
                                        slot.doctor?.name ??
                                        ""
                                      )
                                        .replace(/^Dr\.?\s*/i, "")
                                        .trim() || "N/A"}
                                    </div>
                                  </div>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    sx={{
                                      flexShrink: 0,
                                      whiteSpace: "nowrap",
                                    }}
                                    onClick={() => handleBookSlot(slot)}
                                  >
                                    Book Slot
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Box>
          </Card>
        </div>
      </div>
    </div>
  );
}
