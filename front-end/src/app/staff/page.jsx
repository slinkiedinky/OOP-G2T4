"use client";
import RequireAuth from "../components/RequireAuth";
import React, { useState, useEffect } from "react";
import { authFetch } from "../../lib/api";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("22");
  const [date, setDate] = useState("");
  const [doctorId, setDoctorId] = useState("");

  async function loadAppointments() {
    if (!clinicId) {
      setError("Please enter clinic ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let url = `/api/staff/appointments/upcoming?clinicId=${clinicId}`;

      if (date && doctorId) {
        url = `/api/staff/appointments/upcoming/by-doctor?clinicId=${clinicId}&date=${date}&doctorId=${doctorId}`;
      } else if (date) {
        url = `/api/staff/appointments/upcoming/by-date?clinicId=${clinicId}&date=${date}`;
      }

      const res = await authFetch(url);
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkInPatient(apptId) {
    if (!confirm("Check in this patient?")) return;

    try {
      await authFetch(`/api/staff/appointments/${apptId}/check-in`, {
        method: "POST",
      });
      alert("Patient checked in successfully!");
      loadAppointments();
    } catch (err) {
      alert("Failed to check in: " + err.message);
    }
  }

  async function cancelAppointment(apptId) {
    if (!confirm("Cancel this appointment?")) return;

    try {
      await authFetch(`/api/staff/appointments/${apptId}/cancel`, {
        method: "DELETE",
      });
      alert("Appointment cancelled successfully!");
      loadAppointments();
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        <h2>Staff Dashboard</h2>

        <Card className="card">
          <CardContent>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label>
                Clinic ID *
                <input
                  type="number"
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  placeholder="e.g. 22"
                />
              </label>

              <label>
                Date (optional)
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <label>
                Doctor ID (optional)
                <input
                  type="number"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  placeholder="Leave empty for all"
                />
              </label>
            </div>

            <div style={{ marginTop: 16 }}>
              <Button
                variant="contained"
                onClick={loadAppointments}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load Appointments"}
              </Button>
            </div>

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

        <div style={{ marginTop: 24 }}>
          {appointments.length === 0 ? (
            <p style={{ color: "#666" }}>
              No appointments found. Try searching above.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <h3>Appointments ({appointments.length})</h3>
              {appointments.map((appt) => (
                <Card key={appt.id}>
                  <CardContent>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(appt.startTime).toLocaleString()}
                        </div>
                        <div
                          style={{ fontSize: 14, color: "#666", marginTop: 4 }}
                        >
                          Patient:{" "}
                          {appt.patient?.fullName ||
                            appt.patient?.email ||
                            "N/A"}
                        </div>
                        <div style={{ fontSize: 14, color: "#666" }}>
                          Doctor: {appt.doctor?.name || "N/A"}
                        </div>
                        <div style={{ fontSize: 14, color: "#666" }}>
                          Status:{" "}
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              background:
                                appt.status === "BOOKED"
                                  ? "#e3f2fd"
                                  : appt.status === "CHECKED_IN"
                                  ? "#e8f5e9"
                                  : "#fff3e0",
                              color:
                                appt.status === "BOOKED"
                                  ? "#1976d2"
                                  : appt.status === "CHECKED_IN"
                                  ? "#388e3c"
                                  : "#f57c00",
                              fontWeight: 500,
                            }}
                          >
                            {appt.status}
                          </span>
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#999", marginTop: 4 }}
                        >
                          ID: {appt.id}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {appt.status === "BOOKED" && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => checkInPatient(appt.id)}
                            >
                              Check In
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => cancelAppointment(appt.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
