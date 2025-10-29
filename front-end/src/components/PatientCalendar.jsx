"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OutlinedInput from "@mui/material/OutlinedInput";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

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
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [clinicTypeFilter, setClinicTypeFilter] = useState("");
  const [locationFilters, setLocationFilters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calendar data
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState({});
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Time slot picker state
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const locations = ["CENTRAL", "EAST", "WEST", "NORTH", "SOUTH"];

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic && patientId) {
      loadDoctors();
      loadCalendarData();
    }
  }, [selectedClinic, selectedDoctor, patientId]);

  async function loadClinics() {
    try {
      const res = await authFetch("/api/patient/clinics");
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
      const res = await authFetch(
        `/api/patient/clinics/${selectedClinic.id}/doctors`
      );
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    }
  }

  async function loadCalendarData() {
    if (!selectedClinic || !patientId) return;

    setLoading(true);
    try {
      // Get patient's booked appointments
      const apptRes = await authFetch(
        `/api/patient/appointments?patientId=${patientId}`
      );
      const appointments = await apptRes.json();
      const clinicAppointments = appointments.filter(
        (appt) => String(appt.clinic?.id) === String(selectedClinic.id)
      );
      setBookedAppointments(clinicAppointments);

      // Get available slots for the next 60 days
      const slotsByDate = {};
      const today = new Date();
      const events = [];
      clinicAppointments.forEach((appt) => {
        const appointmentDate = new Date(appt.startTime);
        const dateStr = appointmentDate.toISOString().split("T")[0];

        events.push({
          id: `booked-${appt.id}`,
          title: "✓ Booked",
          start: dateStr,
          display: "background",
          backgroundColor: "#10b981",
          extendedProps: { type: "booked", appointment: appt },
        });
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

          // Filter out already booked slots AND past slots
          const now = new Date();
          const availableSlots = slots.filter((slot) => {
            const slotTime = new Date(slot.startTime);
            const isNotBooked = !clinicAppointments.some(
              (appt) => appt.id === slot.id
            );
            const isInFuture = slotTime > now;
            return isNotBooked && isInFuture;
          });

          if (availableSlots.length > 0) {
            slotsByDate[dateStr] = availableSlots;

            // Only add available slot badge if there's no booking on this date
            const hasBookingOnDate = clinicAppointments.some(
              (appt) => appt.startTime.split("T")[0] === dateStr
            );

            if (!hasBookingOnDate) {
              events.push({
                id: `available-${dateStr}`,
                title: `${availableSlots.length} slot${
                  availableSlots.length > 1 ? "s" : ""
                }`,
                start: dateStr,
                display: "background",
                backgroundColor: "#3b82f6",
                textColor: "#ffffff",
                extendedProps: {
                  type: "available",
                  count: availableSlots.length,
                },
              });
            }
          }
        } catch (err) {
          console.error(`Failed to load slots for ${dateStr}:`, err);
        }
      }

      setAvailableSlotsByDate(slotsByDate);
      console.log("=== All slots by date ===");
      console.log("Oct 29:", slotsByDate["2025-10-29"]);
      console.log("Oct 30:", slotsByDate["2025-10-30"]);
      console.log("All keys:", Object.keys(slotsByDate));
      setCalendarEvents(events);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDateClick(info) {
    const clickedDate = info.dateStr;
    const hasBooking = bookedAppointments.some(
      (appt) => appt.startTime.split("T")[0] === clickedDate
    );

    const hasAvailableSlots = availableSlotsByDate[clickedDate]?.length > 0;

    if (!hasBooking && !hasAvailableSlots) {
      return;
    }
    const bookedOnDate = bookedAppointments.filter(
      (appt) => appt.startTime.split("T")[0] === clickedDate
    );

    const now = new Date();
    const availableOnDate = (availableSlotsByDate[clickedDate] || []).filter(
      (slot) => new Date(slot.startTime) > now
    );

    setSelectedDate(clickedDate);
    setAvailableSlots([...bookedOnDate, ...availableOnDate]);
    setSlotPickerOpen(true);
  }
  async function handleBookSlot(slot) {
    try {
      await authFetch(`/api/patient/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: slot.id,
          patientId: patientId,
        }),
      });
      alert("Appointment booked successfully!");
      setSlotPickerOpen(false);
      // Reload calendar to show the new booking
      loadCalendarData();
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
  const dayCellClassNames = useCallback(
    (arg) => {
      const dateStr = arg.date.toISOString().split("T")[0];
      const hasSlots = availableSlotsByDate[dateStr]?.length > 0;
      const hasBooking = bookedAppointments.some(
        (appt) => appt.startTime.split("T")[0] === dateStr
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cellDate = new Date(arg.date);
      cellDate.setHours(0, 0, 0, 0);
      if (cellDate < today) {
        return "no-slots past-date";
      }

      // Debug log
      if (dateStr === "2025-10-29") {
        console.log("Oct 29 - hasSlots:", hasSlots, "hasBooking:", hasBooking);
        console.log(
          "Returning class:",
          !hasSlots ? "no-slots" : hasBooking ? "has-booking" : "has-slots"
        );
      }

      if (hasBooking) return "has-booking";
      if (!hasSlots) return "no-slots";
      return "has-slots";
    },
    [availableSlotsByDate, bookedAppointments]
  );

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "#e2e8f0",
                  borderRadius: 1,
                }}
              />
              <span style={{ fontSize: 14 }}>No slots available</span>
            </Box>
          </Box>
        </CardContent>
      </Card>

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

            <FormControl sx={{ minWidth: 180 }} size="small">
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
            💡 Click on a blue or green date to view available time slots
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
            <style jsx global>{`
              .no-slots,
              .past-date {
                background-color: #f1f5f9 !important;
                opacity: 0.6;
                cursor: not-allowed !important;
                pointer-events: none !important;
              }
              .has-slots {
                cursor: pointer !important;
              }
              .has-slots:hover {
                background-color: #eff6ff !important;
              }
              .has-booking {
                cursor: pointer !important;
              }
              .has-booking:hover {
                background-color: #f0fdf4 !important;
              }
              .fc-daygrid-day-number {
                padding: 4px;
              }
              .fc-day-today {
                background-color: transparent !important;
              }
            `}</style>
            <FullCalendar
              key={`calendar-${Object.keys(availableSlotsByDate).length}`}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={new Date().toISOString().split("T")[0]}
              events={calendarEvents}
              dateClick={handleDateClick}
              dayCellClassNames={dayCellClassNames}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              height="auto"
              eventDisplay="background"
              nowIndicator={false}
              dayMaxEvents={true}
              validRange={{
                start: new Date().toISOString().split("T")[0],
              }}
              eventContent={(eventInfo) => {
                if (eventInfo.event.extendedProps.type === "available") {
                  return (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 4px",
                        color: "#ffffff",
                        textAlign: "center",
                      }}
                    >
                      {eventInfo.event.title}
                    </div>
                  );
                }
                if (eventInfo.event.extendedProps.type === "booked") {
                  return (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 4px",
                        color: "#ffffff",
                        textAlign: "center",
                      }}
                    >
                      {eventInfo.event.title}
                    </div>
                  );
                }
                return null;
              }}
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
        bookedAppointments={bookedAppointments}
      />
    </div>
  );
}
