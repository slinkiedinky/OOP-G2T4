"use client";
import RequireAuth from "../components/RequireAuth";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authFetch } from "../../lib/api";
import AppointmentDetailsModal from "../../components/AppointmentDetailsModal";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Autocomplete from "@mui/material/Autocomplete";

/**
 * Staff all appointments page
 *
 * Shows upcoming and historical appointments for staff users. Provides
 * filters, search and a details modal for individual appointments.
 */
export default function StaffAllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("22");

  // Filter states
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const params = useSearchParams();
  const appointmentIdParam = params ? params.get("appointmentId") : null;

  // Load clinics on mount
  useEffect(() => {
    loadClinics();
  }, []);

  // Load appointments when clinic is selected
  useEffect(() => {
    if (selectedClinic) {
      loadAppointments();
    }
  }, [selectedClinic]);

  useEffect(() => {
    if (!appointmentIdParam) return;
    const aid = parseInt(appointmentIdParam);
    if (isNaN(aid)) return;

    const found = appointments.find((a) => Number(a.id) === aid);
    if (found) {
      setSelectedAppointment(found);
      setDetailsModalOpen(true);
      return;
    }

    (async () => {
      try {
        const res = await authFetch(`/api/staff/appointments/${aid}`);
        if (!res.ok) throw new Error(`Not found: ${res.status}`);
        const appt = await res.json();
        setSelectedAppointment(appt);
        setDetailsModalOpen(true);
        if (appt?.clinic?.id) setClinicId(String(appt.clinic.id));
      } catch (err) {
        console.error("Failed to load appointment from query param:", err);
      }
    })();
  }, [appointmentIdParam, appointments]);

  async function loadAppointments() {
    if (!selectedClinic) {
      setError("Please select a clinic");
      setAppointments([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `/api/staff/appointments/upcoming?clinicId=${selectedClinic.id}`;
      const res = await authFetch(url);

      if (!res.ok) {
        throw new Error(`Failed to load appointments: ${res.statusText}`);
      }

      const data = await res.json();
      setAppointments(data);

      if (data.length === 0) {
        setError("No appointments found for this clinic.");
      }
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }
  async function loadClinics() {
    try {
      const res = await authFetch("/api/clinics");
      const data = await res.json();
      setClinics(data);
      // Set default clinic to ID 37
      const defaultClinic = data.find((clinic) => clinic.id === 37);
      if (defaultClinic) {
        setSelectedClinic(defaultClinic);
        try { localStorage.setItem('staffSelectedClinic', JSON.stringify(defaultClinic)); } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to load clinics:", err);
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
  }

  function handleClearFilters() {
    setStatusFilter("ALL");
    setSearchQuery("");
    setDateFilter(""); // NEW: Clear date filter
  }

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

  // Filter appointments by status, search query, and date
  const filteredAppointments = appointments.filter((appt) => {
    // Status filter
    const matchesStatus =
      statusFilter === "ALL" || appt.status === statusFilter;

    // Search filter (removed clinic name since we filter by clinicId already)
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !searchQuery ||
      appt.patient?.fullname?.toLowerCase().includes(searchLower) ||
      appt.patient?.username?.toLowerCase().includes(searchLower) ||
      appt.patient?.email?.toLowerCase().includes(searchLower) ||
      appt.doctor?.name?.toLowerCase().includes(searchLower) ||
      appt.id?.toString().includes(searchQuery);

    // Date filter - only apply if dateFilter has a value
    const matchesDate =
      !dateFilter || appt.startTime?.split("T")[0] === dateFilter;

    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        <h2>Upcoming Appointments</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>
          View and manage all clinic appointments
        </p>

        {/* Clinic Selection */}
        <Card sx={{ marginBottom: 3 }}>
          <CardContent>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Select Clinic</h3>

            {/* Clinic Selector */}
            <Autocomplete
              value={selectedClinic}
              onChange={(event, newValue) => {
                setSelectedClinic(newValue);
                if (newValue) {
                  setClinicId(String(newValue.id));
                  try {
                    localStorage.setItem('staffSelectedClinic', JSON.stringify(newValue));
                  } catch (e) {
                    // ignore localStorage errors
                  }
                } else {
                  setAppointments([]);
                  try { localStorage.removeItem('staffSelectedClinic'); } catch (e) {}
                }
              }}
              options={clinics}
              getOptionLabel={(option) =>
                option.address
                  ? `${option.name} - ${option.address}`
                  : option.name || ""
              }
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={option.id} {...otherProps}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{option.name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {option.address && `${option.address} • `}
                        {option.clinicType} • {option.location}
                      </div>
                    </div>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Clinic"
                  placeholder="Search clinics..."
                  size="small"
                />
              )}
              fullWidth
            />
          </CardContent>
        </Card>

        {/* Secondary Filters - Only show after clinic is selected */}
        {selectedClinic && appointments.length > 0 && (
          <Card sx={{ marginBottom: 3 }}>
            <CardContent>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                Filter Appointments
              </h3>

              {/* Search Bar */}
              <TextField
                fullWidth
                label="Search by patient, doctor, or appointment ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. John Doe, Sarah Lee, Dr. Smith..."
                size="small"
                sx={{ marginBottom: 2 }}
              />

              {/* Status and Date Filters */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Filter by Status"
                  >
                    <MenuItem value="ALL">All Statuses</MenuItem>
                    <MenuItem value="BOOKED">Booked</MenuItem>
                    <MenuItem value="CHECKED_IN">Checked In</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="NO_SHOW">No Show</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ position: "relative", minWidth: 180 }}>
                  <TextField
                    label={
                      dateFilter
                        ? "Filtering by Date"
                        : "Filter by Date (Optional)"
                    }
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    fullWidth
                    sx={{
                      // Highlight when active
                      ...(dateFilter && {
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                          "& fieldset": {
                            borderColor: "#1976d2",
                            borderWidth: 2,
                          },
                        },
                      }),
                    }}
                  />
                  {dateFilter && (
                    <Button
                      size="small"
                      onClick={() => setDateFilter("")}
                      sx={{
                        position: "absolute",
                        right: 40,
                        top: "50%",
                        transform: "translateY(-50%)",
                        minWidth: "auto",
                        padding: "4px",
                        fontSize: "18px",
                        color: "#666",
                      }}
                    >
                      ✕
                    </Button>
                  )}
                </Box>

                {(statusFilter !== "ALL" || searchQuery || dateFilter) && (
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ height: 40 }}
                  >
                    Clear Filters
                    {dateFilter &&
                      ` (Date: ${new Date(dateFilter).toLocaleDateString()})`}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#fee",
              borderRadius: 4,
              color: "#c33",
            }}
          >
            {error}
          </div>
        )}

        {/* Results Summary */}
        {!loading && (
          <div style={{ marginBottom: 16, color: "#666", fontSize: 14 }}>
            {(searchQuery || dateFilter) && (
              <div>
                Showing {filteredAppointments.length} of {appointments.length}{" "}
                appointments
                {statusFilter !== "ALL" && ` with status "${statusFilter}"`}
                {dateFilter &&
                  ` on ${new Date(dateFilter).toLocaleDateString()}`}
              </div>
            )}
          </div>
        )}

        {/* Appointments List */}
        <div style={{ marginTop: 24 }}>
          {loading ? (
            <p style={{ color: "#666" }}>Loading appointments...</p>
          ) : filteredAppointments.length === 0 ? (
            <Card sx={{ padding: 3, textAlign: "center" }}>
              <div style={{ color: "#666" }}>
                {appointments.length === 0 ? (
                  "No appointments found for this clinic."
                ) : (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      No appointments match your filters
                    </div>
                    <div style={{ fontSize: 14 }}>
                      Try adjusting your search, status, or date filter
                    </div>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <>
              {/* Split appointments into Booked and Upcoming */}
              {(() => {
                const now = new Date();

                // Booked appointments (status = BOOKED, any date in future)
                const bookedAppointments = filteredAppointments.filter(
                  (appt) =>
                    appt.status === "BOOKED" && new Date(appt.startTime) >= now
                );

                // Upcoming appointments (future, not BOOKED status)
                const upcomingAppointments = filteredAppointments.filter(
                  (appt) =>
                    appt.status !== "BOOKED" && new Date(appt.startTime) >= now
                );

                const renderAppointmentCard = (appt) => {
                  const statusStyle = getStatusColor(appt.status);
                  return (
                    <Card
                      key={appt.id}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          backgroundColor: "#f9fafb",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
                      }}
                      onClick={() => handleAppointmentClick(appt)}
                    >
                      <CardContent>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 16 }}>
                              {new Date(appt.startTime).toLocaleString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
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
                              <strong>Patient:</strong>{" "}
                              {appt.patient?.fullname ||
                                appt.patient?.username ||
                                appt.patient?.email ||
                                "N/A"}
                            </div>
                            <div style={{ fontSize: 14, color: "#666" }}>
                              <strong>Doctor:</strong>{" "}
                              {appt.doctor?.name || "N/A"}
                            </div>
                            <div style={{ fontSize: 14, color: "#666" }}>
                              <strong>Clinic:</strong>{" "}
                              {appt.clinic?.name || "N/A"}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <span
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: 4,
                                  background: statusStyle.bg,
                                  color: statusStyle.color,
                                  fontWeight: 500,
                                  fontSize: 13,
                                }}
                              >
                                {appt.status}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#999",
                                marginTop: 4,
                              }}
                            >
                              ID: {appt.id}
                            </div>
                          </div>
                          <div style={{ color: "#999", fontSize: 24 }}>›</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                };

                return (
                  <>
                    {/* Booked Appointments - Collapsible */}
                    {bookedAppointments.length > 0 && (
                      <Accordion defaultExpanded sx={{ marginBottom: 3 }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            backgroundColor: "#e3f2fd",
                            "&:hover": { backgroundColor: "#bbdefb" },
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: "#1976d2",
                              }}
                            >
                              📋 Booked Appointments
                            </span>
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: 12,
                                backgroundColor: "#1976d2",
                                color: "white",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              {bookedAppointments.length}
                            </span>
                          </div>
                        </AccordionSummary>
                        <AccordionDetails sx={{ padding: 2 }}>
                          <div style={{ display: "grid", gap: 16 }}>
                            {bookedAppointments.map(renderAppointmentCard)}
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Upcoming Appointments (non-BOOKED) - Collapsible */}
                    {upcomingAppointments.length > 0 && (
                      <Accordion defaultExpanded sx={{ marginBottom: 3 }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            backgroundColor: "#e8f5e9",
                            "&:hover": { backgroundColor: "#c8e6c9" },
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: "#2e7d32",
                              }}
                            >
                              📆 Upcoming Appointments
                            </span>
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: 12,
                                backgroundColor: "#2e7d32",
                                color: "white",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              {upcomingAppointments.length}
                            </span>
                          </div>
                        </AccordionSummary>
                        <AccordionDetails sx={{ padding: 2 }}>
                          <div style={{ display: "grid", gap: 16 }}>
                            {upcomingAppointments.map(renderAppointmentCard)}
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* No appointments message */}
                    {bookedAppointments.length === 0 &&
                      upcomingAppointments.length === 0 && (
                        <Card sx={{ padding: 3, textAlign: "center" }}>
                          <div style={{ color: "#666" }}>
                            No appointments found
                          </div>
                        </Card>
                      )}
                  </>
                );
              })()}
            </>
          )}
        </div>

        {/* Appointment Details Modal */}
        <AppointmentDetailsModal
          open={detailsModalOpen}
          onClose={handleModalClose}
          appointment={selectedAppointment}
          onUpdate={handleAppointmentUpdate}
        />
      </div>
    </RequireAuth>
  );
}
