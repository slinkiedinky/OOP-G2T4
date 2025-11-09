"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [bookSlotModalOpen, setBookSlotModalOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);

  // Side panel states - always visible, defaults to today
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dayAppointments, setDayAppointments] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Load clinics on mount
  useEffect(() => {
    loadClinics();
  }, []);

  // Load doctors and appointments when clinic changes
  useEffect(() => {
    if (selectedClinic) {
      loadDoctors();
      loadAppointments();
      loadDayAppointments(selectedDate); // Load today's appointments
    } else {
      setDoctors([]);
      setSelectedDoctor("");
      setAppointments([]);
      setCalendarEvents([]);
      setDayAppointments([]);
    }
  }, [selectedClinic, selectedDoctor]);

  // Reload day appointments when date changes
  useEffect(() => {
    if (selectedClinic && selectedDate) {
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
      data.forEach((slot) => {
        const dateStr = slot.startTime.split("T")[0];
        if (!eventMap[dateStr]) {
          eventMap[dateStr] = {
            id: dateStr,
            start: dateStr,
            bookedCount: 0,
            availableCount: 0,
          };
        }

        const isAvailable =
          slot.status === "AVAILABLE" || (!slot.patient && slot.status !== "CANCELLED");

        if (isAvailable) {
          eventMap[dateStr].availableCount += 1;
        } else {
          eventMap[dateStr].bookedCount += 1;
        }
      });

      const events = Object.values(eventMap).map((event) => ({
        id: event.id,
        start: event.start,
        title: "",
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: "#0f172a",
        extendedProps: {
          bookedCount: event.bookedCount,
          availableCount: event.availableCount,
        },
      }));

      setCalendarEvents(events);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }
  async function loadDayAppointments(dateStr) {
    if (!selectedClinic) return;

    const normalizedDate = dateStr.split("T")[0];
    console.log("Loading appointments for date:", normalizedDate);

    setDayLoading(true);
    try {
      let url = `/api/staff/appointments/upcoming/by-date?clinicId=${selectedClinic.id}&date=${normalizedDate}`;
      if (selectedDoctor) {
        url = `/api/staff/appointments/upcoming/by-doctor?clinicId=${selectedClinic.id}&date=${normalizedDate}&doctorId=${selectedDoctor}`;
      }

      console.log("Fetching booked appointments:", url);
      const res = await authFetch(url);
      const dayAppts = await res.json();
      console.log("Booked appointments:", dayAppts);

      let slotsUrl = `/api/staff/slots/available?clinicId=${selectedClinic.id}&date=${normalizedDate}`;
      if (selectedDoctor) {
        slotsUrl += `&doctorId=${selectedDoctor}`;
      }

      console.log("Fetching available slots:", slotsUrl);
      const slotsRes = await authFetch(slotsUrl);

      // Check if the response is ok
      if (!slotsRes.ok) {
        console.error("Failed to fetch slots:", slotsRes.status);
        // If endpoint doesn't exist, just show booked appointments
        setDayAppointments(dayAppts);
        return;
      }

      const availableSlots = await slotsRes.json();
      console.log("Available slots:", availableSlots);

      const unbookedSlots = availableSlots.filter(
        (slot) => !dayAppts.some((appt) => appt.id === slot.id)
      );
      console.log("Unbooked slots:", unbookedSlots);

      setDayAppointments([...dayAppts, ...unbookedSlots]);
    } catch (err) {
      console.error("Failed to load day data:", err);
    } finally {
      setDayLoading(false);
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
    loadDayAppointments(selectedDate);
  }
  function handleDateClick(info) {
    const clickedDate = info.dateStr;
    console.log("Date clicked:", clickedDate);
    setSelectedDate(clickedDate);
  }

  function handleEventClick(info) {
    setSelectedDate(info.event.startStr);
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

  const renderEventContent = useCallback((eventInfo) => {
    const { bookedCount = 0, availableCount = 0 } =
      eventInfo.event.extendedProps || {};

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

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
        }}
      >
        <span
          style={{
            ...baseTag,
            backgroundColor: "rgba(37, 99, 235, 0.12)",
            color: "#1d4ed8",
          }}
        >
          {bookedCount} booked
        </span>
        <span
          style={{
            ...baseTag,
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#047857",
          }}
        >
          {availableCount} available
        </span>
      </div>
    );
  }, []);

  const filteredClinics = clinics.filter((clinic) => {
    const matchesType =
      !clinicTypeFilter || clinic.clinicType === clinicTypeFilter;
    const matchesLocation =
      locationFilters.length === 0 || locationFilters.includes(clinic.location);
    return matchesType && matchesLocation;
  });

  const statusStyles = useMemo(
    () => ({
      BOOKED: {
        label: "Booked",
        chipSx: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
      },
      CHECKED_IN: {
        label: "Checked In",
        chipSx: { backgroundColor: "#dcfce7", color: "#047857" },
      },
      COMPLETED: {
        label: "Completed",
        chipSx: { backgroundColor: "#e0f2fe", color: "#0369a1" },
      },
      NO_SHOW: {
        label: "No-show",
        chipSx: { backgroundColor: "#fef3c7", color: "#b45309" },
      },
      CANCELLED: {
        label: "Cancelled",
        chipSx: { backgroundColor: "#fee2e2", color: "#b91c1c" },
      },
    }),
    []
  );

  return (
    <div style={{ width: "100%" }}>
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

      {/* Calendar and Side Panel - Aligned Heights */}
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

        {/* Side Panel - Always Visible */}
        <div style={{ flex: "0 0 35%" }}>
          <Card
            sx={{
              height: 640,
              display: "flex",
              flexDirection: "column",
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
                  No appointments or slots for this date.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {/* Booked Appointments */}
                  {dayAppointments.filter((appt) => appt.patient).length >
                    0 && (
                    <>
                      <h4 style={{ marginBottom: 8, fontSize: 16 }}>
                        Booked Appointments (
                        {dayAppointments.filter((appt) => appt.patient).length})
                      </h4>
                      <div style={{ display: "grid", gap: 12 }}>
                        {dayAppointments
                          .filter((appt) => appt.patient)
                          .map((appt) => {
                            const style =
                              statusStyles[appt.status] || statusStyles.BOOKED;
                            const patientName =
                              appt.patient?.fullName ??
                              appt.patient?.fullname ??
                              appt.patient?.name ??
                              appt.patient?.username ??
                              "N/A";
                            const doctorRaw =
                              appt.doctor?.fullName ??
                              appt.doctor?.fullname ??
                              appt.doctor?.name ??
                              "";
                            const doctorName =
                              doctorRaw.replace(/^Dr\.?\s*/i, "").trim() ||
                              "N/A";
                            return (
                              <Card
                                key={appt.id}
                                sx={{
                                  border: "1px solid #e2e8f0",
                                  backgroundColor: "#ffffff",
                                  cursor: "pointer",
                                  "&:hover": { backgroundColor: "#f8fafc" },
                                }}
                                onClick={() => handleAppointmentClick(appt)}
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
                                    Patient: {patientName}
                                  </div>
                                  <div style={{ fontSize: 13, color: "#666" }}>
                                    Doctor: {doctorName}
                                  </div>
                                  <Chip
                                    label={style.label}
                                    size="small"
                                    sx={{
                                      marginTop: 1,
                                      fontWeight: 600,
                                      ...(style.chipSx || {
                                        backgroundColor: "#e2e8f0",
                                        color: "#475569",
                                      }),
                                    }}
                                  />
                                </CardContent>
                              </Card>
                            );
                          })}
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
                                      textTransform: "none",
                                    }}
                                    onClick={() => {
                                      setSelectedSlotForBooking(slot);
                                      setBookSlotModalOpen(true);
                                    }}
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

      {/* Modals */}
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
          loadDayAppointments(selectedDate);
        }}
      />
    </div>
  );
}
