"use client";
import RequireAuth from "../components/RequireAuth";
import React, { useState, useEffect } from "react";
import { authFetch } from "../../lib/api";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import { getUserFromToken } from "../../lib/api";

/**
 * MyAppointments
 *
 * Patient personal appointments view. Shows today's, upcoming and past
 * appointments and provides quick actions such as cancel and join queue.
 */
export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queueMap, setQueueMap] = useState({});
  const [queueLoading, setQueueLoading] = useState(false);
  const user = getUserFromToken();
  const patientId = user?.userId;
  useEffect(() => {
    loadAppointments();

    const handleFocus = () => loadAppointments();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
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
  // fetch queue status for any checked-in appointments so we can show inline
  loadQueueStatusesFor(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadQueueStatusesFor(appts) {
    if (!appts || appts.length === 0) {
      setQueueMap({});
      return;
    }
    const checked = appts.filter((a) => a.status === "CHECKED_IN");
    if (checked.length === 0) {
      setQueueMap({});
      return;
    }
    setQueueLoading(true);
    try {
      const results = await Promise.all(
        checked.map(async (appt) => {
          try {
            const res = await authFetch(`/api/patient/queue?appointmentId=${appt.id}`);
            if (!res.ok) return { id: appt.id, data: null };
            const data = await res.json();
            return { id: appt.id, data };
          } catch (e) {
            return { id: appt.id, data: null };
          }
        })
      );
      const map = {};
      results.forEach((r) => {
        map[r.id] = r.data;
      });
      setQueueMap(map);
    } finally {
      setQueueLoading(false);
    }
  }

  // Poll queue status for checked-in appointments so patients see updates in near real-time
  useEffect(() => {
    if (!user || user.role !== "PATIENT") return;
    const hasChecked = appointments.some((a) => a.status === "CHECKED_IN");
    if (!hasChecked) return;
    const id = setInterval(() => loadQueueStatusesFor(appointments), 5000);
    return () => clearInterval(id);
  }, [appointments, user]);

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
  const now = new Date();
  // split appointments into today's, upcoming (after today) and past
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const todaysAppointments = appointments.filter((appt) => {
    const d = new Date(appt.startTime);
    return d >= startOfToday && d <= endOfToday;
  });
  const upcomingAppointments = appointments.filter((appt) => new Date(appt.startTime) > endOfToday);
  const pastAppointments = appointments.filter((appt) => new Date(appt.startTime) < startOfToday);
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
            <>
              {/* Today's Appointments */}
              {todaysAppointments.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3>Today's Appointments ({todaysAppointments.length})</h3>
                  <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                    {todaysAppointments.map((appt) => (
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
                                style={{
                                  fontSize: 12,
                                  color: "#999",
                                  marginTop: 4,
                                }}
                              >
                                ID: {appt.id}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  color: "#666",
                                  marginTop: 4,
                                }}
                              >
                                Doctor: {appt.doctor?.name || "N/A"}
                              </div>
                              <div style={{ fontSize: 14, color: "#666" }}>
                                Clinic: {appt.clinic?.name || "N/A"}
                              </div>
                              <div style={{ fontSize: 14, color: "#666" }}>
                                Status: {" "}
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

                            {/* Buttons: cancel for BOOKED, view queue for CHECKED_IN (patients only) */}
                            {appt.status === "BOOKED" && (
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => cancelAppointment(appt.id)}
                              >
                                Cancel
                              </Button>
                            )}
                            {user?.role === "PATIENT" && appt.status === "CHECKED_IN" && (
                              <div style={{ marginLeft: 12 }}>
                                {queueLoading && !queueMap[appt.id] ? (
                                  <div style={{ color: "#666", fontSize: 13 }}>Loading queue...</div>
                                ) : queueMap[appt.id] && queueMap[appt.id].entry ? (
                                  <div style={{
                                    marginTop: 6,
                                    padding: 10,
                                    borderRadius: 8,
                                    background: "#f5f7ff",
                                    display: "flex",
                                    gap: 16,
                                    alignItems: "center",
                                  }}>
                                    <div>
                                      <div style={{ fontWeight: 700 }}>
                                        Queue #{queueMap[appt.id].entry?.queueNumber ?? "—"}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      {queueMap[appt.id].queueStarted ? (
                                        queueMap[appt.id].queuePaused ? (
                                          <div style={{ marginTop: 6, fontWeight: 700, color: "#a76a00" }}>
                                            PAUSED
                                          </div>
                                        ) : (
                                          <>
                                            <div style={{ fontSize: 13, color: "#555" }}>
                                              Now called: #{queueMap[appt.id].currentCalledNumber ?? "-"}
                                            </div>
                                            { (queueMap[appt.id].entry?.status === "CALLED" || queueMap[appt.id].entry?.status === "SERVING") && (
                                              <div style={{ marginTop: 6, fontWeight: 800, color: "#d32", fontSize: 15 }}>
                                                Your number is called!
                                              </div>
                                            ) }
                                            { !(queueMap[appt.id].entry?.status === "CALLED" || queueMap[appt.id].entry?.status === "SERVING") && (
                                              <div style={{ marginTop: 6, fontWeight: 700, color: "#2e7d32" }}>
                                                STARTED
                                              </div>
                                            ) }
                                          </>
                                        )
                                      ) : (
                                        <div style={{ fontSize: 13, color: "#666" }}>wait a moment for queue to start again</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    variant="contained"
                                    onClick={async () => {
                                      try {
                                        const res = await authFetch(`/api/patient/queue?appointmentId=${appt.id}`);
                                        if (!res.ok) {
                                          alert("Unable to join queue");
                                          return;
                                        }
                                        const data = await res.json();
                                        setQueueMap((p) => ({ ...p, [appt.id]: data }));
                                      } catch (e) {
                                        alert("Failed to join queue: " + e.message);
                                      }
                                    }}
                                  >
                                    Join Queue
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Appointments (after today) */}
              {upcomingAppointments.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3>Upcoming Appointments ({upcomingAppointments.length})</h3>
                  <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                    {upcomingAppointments.map((appt) => (
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
                                style={{
                                  fontSize: 12,
                                  color: "#999",
                                  marginTop: 4,
                                }}
                              >
                                ID: {appt.id}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  color: "#666",
                                  marginTop: 4,
                                }}
                              >
                                Doctor: {appt.doctor?.name || "N/A"}
                              </div>
                              <div style={{ fontSize: 14, color: "#666" }}>
                                Clinic: {appt.clinic?.name || "N/A"}
                              </div>
                              <div style={{ fontSize: 14, color: "#666" }}>
                                Status: {" "}
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
                            {appt.status === "CHECKED_IN" && user?.role === "PATIENT" && (
                              <div style={{ marginLeft: 12 }}>
                                {queueLoading && !queueMap[appt.id] ? (
                                  <div style={{ color: "#666", fontSize: 13 }}>Loading queue...</div>
                                ) : queueMap[appt.id] && queueMap[appt.id].entry ? (
                                  <div style={{
                                    marginTop: 6,
                                    padding: 10,
                                    borderRadius: 8,
                                    background: "#f5f7ff",
                                    display: "flex",
                                    gap: 16,
                                    alignItems: "center",
                                  }}>
                                    <div>
                                      <div style={{ fontWeight: 700 }}>
                                        Queue #{queueMap[appt.id].entry?.queueNumber ?? "—"}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      {queueMap[appt.id].queueStarted ? (
                                        queueMap[appt.id].queuePaused ? (
                                          <div style={{ marginTop: 6, fontWeight: 700, color: "#a76a00" }}>
                                            PAUSED
                                          </div>
                                        ) : (
                                          <>
                                              <div style={{ fontSize: 13, color: "#555" }}>
                                                Now called: {queueMap[appt.id].currentCalledNumber ?? "-"}
                                              </div>
                                              { (queueMap[appt.id].entry?.status === "CALLED" || queueMap[appt.id].entry?.status === "SERVING") && (
                                                <div style={{ marginTop: 6, fontWeight: 800, color: "#d32", fontSize: 15 }}>
                                                  it is your turn!
                                                </div>
                                              ) }
                                              { !(queueMap[appt.id].entry?.status === "CALLED" || queueMap[appt.id].entry?.status === "SERVING") && (
                                                <div style={{ marginTop: 6, fontWeight: 700, color: "#2e7d32" }}>
                                                  STARTED
                                                </div>
                                              ) }
                                          </>
                                        )
                                      ) : (
                                        <div style={{ fontSize: 13, color: "#666" }}>wait a moment for queue to start again</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    variant="contained"
                                    onClick={async () => {
                                      try {
                                        const res = await authFetch(`/api/patient/queue?appointmentId=${appt.id}`);
                                        if (!res.ok) {
                                          alert("Unable to join queue");
                                          return;
                                        }
                                        const data = await res.json();
                                        setQueueMap((p) => ({ ...p, [appt.id]: data }));
                                      } catch (e) {
                                        alert("Failed to join queue: " + e.message);
                                      }
                                    }}
                                    sx={{ marginLeft: 1 }}
                                  >
                                    Join Queue
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Appointments */}
              {pastAppointments.length > 0 && (
                <div>
                  <h3>Past Appointments ({pastAppointments.length})</h3>
                  <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                    {pastAppointments.map((appt) => (
                      <Card
                        key={appt.id}
                        sx={{ opacity: 0.7, backgroundColor: "#f9fafb" }}
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
                              <div style={{ fontWeight: 600 }}>
                                {new Date(appt.startTime).toLocaleString()}
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
                              <div
                                style={{
                                  fontSize: 14,
                                  color: "#666",
                                  marginTop: 4,
                                }}
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
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
