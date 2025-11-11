"use client";
import RequireAuth from "../components/RequireAuth";
import React, { useState } from "react";
import { authFetch } from "../../lib/api";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

/**
 * Appointments (booking) page
 *
 * Allows authenticated users to search available appointment slots and
 * book a slot. Uses clinic, doctor and date filters to query the API.
 */
export default function Appts() {
  const [clinicId, setClinicId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchSlots() {
    if (!clinicId || !date) {
      setError("Please enter clinic ID and date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ clinicId, date });
      if (doctorId) params.append("doctorId", doctorId);

      const res = await authFetch(
        `/api/patient/appointments/available?${params}`
      );
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function bookSlot(slotId) {
    // For now, we'll hardcode patientId = 1, later we'll get it from auth
    const patientId = 1;

    try {
      await authFetch("/api/patient/appointments/book", {
        method: "POST",
        body: JSON.stringify({ slotId, patientId }),
      });
      alert("Appointment booked successfully!");
      // Refresh the slots
      searchSlots();
    } catch (err) {
      alert("Failed to book: " + err.message);
    }
  }

  return (
    <RequireAuth>
      <div>
        <h2>Book Appointment</h2>

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
                Doctor ID (optional)
                <input
                  type="number"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  placeholder="Leave empty for any"
                />
              </label>

              <label>
                Date *
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>

            <div style={{ marginTop: 16 }}>
              <Button
                variant="contained"
                onClick={searchSlots}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search Available Slots"}
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
          {slots.length === 0 ? (
            <p style={{ color: "#666" }}>
              No slots found. Try searching above.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <h3>Available Slots ({slots.length})</h3>
              {slots.map((slot) => (
                <Card key={slot.id}>
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
                          {new Date(slot.startTime).toLocaleString()}
                        </div>
                        <div
                          style={{ fontSize: 14, color: "#666", marginTop: 4 }}
                        >
                          Doctor: {slot.doctor?.name || "N/A"}
                        </div>
                        <div style={{ fontSize: 14, color: "#666" }}>
                          Clinic: {slot.clinic?.name || "N/A"}
                        </div>
                      </div>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => bookSlot(slot.id)}
                      >
                        Book
                      </Button>
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
