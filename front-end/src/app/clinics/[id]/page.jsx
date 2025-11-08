"use client";
import { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { authFetch } from "@/lib/api"; // <-- FIX #1: Import authFetch (assuming it's in /src/lib/api.js)

// FIX #2: Accept { params } as a prop to get the dynamic [id]
export default function Clinic({ params }) {
  // const [id, setId] = useState(null); // No longer needed, we use params.id
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FIX #3: Simplified useEffect to load data based on params.id
  useEffect(() => {
    if (params.id) {
      loadDoctors(); // Pass clinicId to loadDoctors
    } else {
      setError("Could not determine Clinic ID from URL.");
      setLoading(false);
    }
  }, [params.id]); // Re-run this effect if the ID changes

  // FIX #4: loadDoctors can now use params.id directly
  async function loadDoctors() {
    setLoading(true);
    setError("");
    try {
      // FIX #5: Use params.id, which is now correctly defined
      const res = await authFetch(`/api/patient/clinics/${params.id}/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors:", err);
      // This will correctly set the error to "authFetch is not defined"
      // if your import path in FIX #1 is wrong.
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <CircularProgress />
        <p style={{ color: "#666", marginTop: 16 }}>Loading doctors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>Error loading doctors</h2>
        {/* This will now correctly display "authFetch is not defined" if the import is missing */}
        <p style={{ color: "#d32f2f" }}>{error}</p>
        <p style={{ color: "#666", fontSize: 14 }}>
          Please make sure you are logged in as a PATIENT.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* FIX #6: Changed id to params.id */}
      <h2>Doctors for Clinic {params.id}</h2>
      {doctors.length === 0 ? (
        <p style={{ color: "#666" }}>No doctors found for this clinic.</p>
      ) : (
        <div className="grid-cards">
          {doctors.map((d) => (
            <Card className="card" key={d.id}>
              <CardContent>
                <h3 className="card-title">
                  {d.name || d.fullName || "Doctor"}
                </h3>
                <p className="card-sub">
                  {d.specialization || d.specialty || "General Practice"}
                </p>
                <div style={{ marginTop: 8, fontSize: 12, color: "#8892a6" }}>
                  ID: {d.id}
                </div>
                <div style={{ marginTop: 12 }}>
                  <Button size="small" variant="contained">
                    View Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}