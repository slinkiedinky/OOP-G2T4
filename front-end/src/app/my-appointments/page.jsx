"use client";
import RequireAuth from "../components/RequireAuth";
import React, { useState, useEffect } from "react";
import { authFetch } from "../../lib/api";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hardcoded patientId for now
  const patientId = 1;

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(
        `/api/patient/appointments?patientId=${patientId}`
      );
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(apptId) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await authFetch(
        `/api/patient/appointments/${apptId}?patientId=${patientId}`,
        {
          method: "DELETE",
        }
      );
      alert("Appointment cancelled successfully!");
      loadAppointments();
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    }
  }

  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        <h2>My Appointments</h2>

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

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <p style={{ color: "#666" }}>Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p style={{ color: "#666" }}>No appointments found.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <h3>Your Appointments ({appointments.length})</h3>
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
                          Doctor: {appt.doctor?.name || "N/A"}
                        </div>
                        <div style={{ fontSize: 14, color: "#666" }}>
                          Clinic: {appt.clinic?.name || "N/A"}
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
                                  : "#fff3e0",
                              color:
                                appt.status === "BOOKED"
                                  ? "#1976d2"
                                  : "#f57c00",
                              fontWeight: 500,
                            }}
                          >
                            {appt.status}
                          </span>
                        </div>
                      </div>

                      {appt.status === "BOOKED" && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => cancelAppointment(appt.id)}
                        >
                          Cancel
                        </Button>
                      )}
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
