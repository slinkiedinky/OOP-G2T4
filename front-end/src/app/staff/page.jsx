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
import Divider from "@mui/material/Divider";

export default function StaffAllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("22");

  // Filter states
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const params = useSearchParams();
  const appointmentIdParam = params ? params.get("appointmentId") : null;

  useEffect(() => {
    loadAppointments();
  }, [clinicId]);

  // Auto-open modal when appointmentId query param is present
  useEffect(() => {
    if (!appointmentIdParam) return;
    const aid = parseInt(appointmentIdParam);
    if (isNaN(aid)) return;

    // If we already have the appointment in the loaded list, open it
    const found = appointments.find((a) => Number(a.id) === aid);
    if (found) {
      setSelectedAppointment(found);
      setDetailsModalOpen(true);
      return;
    }

    // Otherwise fetch the appointment directly and open modal
    (async () => {
      try {
        const res = await authFetch(`/api/staff/appointments/${aid}`);
        if (!res.ok) throw new Error(`Not found: ${res.status}`);
        const appt = await res.json();
        setSelectedAppointment(appt);
        setDetailsModalOpen(true);
        // If clinicId is different, update it so list reflects the same clinic (optional)
        if (appt?.clinic?.id) setClinicId(String(appt.clinic.id));
      } catch (err) {
        console.error("Failed to load appointment from query param:", err);
      }
    })();
  }, [appointmentIdParam, appointments]);

  async function loadAppointments() {
    if (!clinicId) {
      setError("Please enter clinic ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `/api/staff/appointments/upcoming?clinicId=${clinicId}`;
      const res = await authFetch(url);
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
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
  }

  function handleClearFilters() {
    setStatusFilter("ALL");
    setSearchQuery("");
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

  // Filter appointments by status and search query
  const filteredAppointments = appointments.filter((appt) => {
    // Status filter
    const matchesStatus =
      statusFilter === "ALL" || appt.status === statusFilter;

    // Search filter (searches across patient, doctor, and clinic names)
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !searchQuery ||
      appt.patient?.name?.toLowerCase().includes(searchLower) ||
      appt.patient?.username?.toLowerCase().includes(searchLower) ||
      appt.patient?.email?.toLowerCase().includes(searchLower) ||
      appt.doctor?.name?.toLowerCase().includes(searchLower) ||
      appt.clinic?.name?.toLowerCase().includes(searchLower) ||
      appt.id?.toString().includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        <h2>All Appointments</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>
          View and manage all clinic appointments
        </p>

        {/* Filters Card */}
        <Card sx={{ marginBottom: 3 }}>
          <CardContent>
            {/* Search Bar */}
            <TextField
              fullWidth
              label="Search by patient, doctor, clinic name, or appointment ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. John Doe, Sarah Lee, Medical Clinic..."
              size="small"
              sx={{ marginBottom: 2 }}
            />

            {/* Filters Row */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <TextField
                label="Clinic ID"
                type="number"
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              />

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

              <Button
                variant="contained"
                onClick={loadAppointments}
                disabled={loading}
                sx={{ height: 40 }}
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>

              {(statusFilter !== "ALL" || searchQuery) && (
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ height: 40 }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>

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
          </CardContent>
        </Card>

        {/* Results Summary */}
        {!loading && (
          <div style={{ marginBottom: 16, color: "#666", fontSize: 14 }}>
            {searchQuery && (
              <div>
                Showing {filteredAppointments.length} of {appointments.length}{" "}
                appointments
                {statusFilter !== "ALL" && ` with status "${statusFilter}"`}
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
                      Try adjusting your search or status filter
                    </div>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <>
              {/* Booked Appointments - Collapsible Section */}
              {filteredAppointments.filter((appt) => appt.status === "BOOKED")
                .length > 0 && (
                <Accordion
                  defaultExpanded
                  sx={{
                    marginBottom: 3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: "#e3f2fd",
                      "&:hover": { backgroundColor: "#bbdefb" },
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
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
                        {
                          filteredAppointments.filter(
                            (appt) => appt.status === "BOOKED"
                          ).length
                        }
                      </span>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails sx={{ padding: 2 }}>
                    <div style={{ display: "grid", gap: 16 }}>
                      {filteredAppointments
                        .filter((appt) => appt.status === "BOOKED")
                        .map((appt) => {
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
                                    <div
                                      style={{ fontWeight: 600, fontSize: 16 }}
                                    >
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
                                      {appt.patient?.name ||
                                        appt.patient?.username ||
                                        appt.patient?.email ||
                                        "N/A"}
                                    </div>
                                    <div
                                      style={{ fontSize: 14, color: "#666" }}
                                    >
                                      <strong>Doctor:</strong>{" "}
                                      {appt.doctor?.name || "N/A"}
                                    </div>
                                    <div
                                      style={{ fontSize: 14, color: "#666" }}
                                    >
                                      <strong>Clinic:</strong>{" "}
                                      {appt.clinic?.name || "N/A"}
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
                                  <div style={{ color: "#999", fontSize: 24 }}>
                                    ›
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* All Appointments Section */}
              <div style={{ display: "grid", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>All Appointments ({filteredAppointments.length})</h3>
                  {statusFilter !== "ALL" && (
                    <span style={{ fontSize: 14, color: "#666" }}>
                      Filtered by: <strong>{statusFilter}</strong>
                    </span>
                  )}
                </div>

                {filteredAppointments.map((appt) => {
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
                              {appt.patient?.name ||
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
                })}
              </div>
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
