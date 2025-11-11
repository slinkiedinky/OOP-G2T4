"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { authFetch } from "../../../lib/api";


export default function Clinic() {
  const params = useParams();
  const [id, setId] = useState(null); // Added state for clinic ID
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Workaround for build environment: Get ID from URL
    const path = window.location.pathname;
    const parts = path.split('/');
    const clinicId = parts[parts.length - 1]; // Get the last part of the path

    if (clinicId && clinicId !== "clinics") {
      setId(clinicId);
      loadDoctors(clinicId); // Pass clinicId to loadDoctors
    } else {
      setError("Could not determine Clinic ID from URL.");
      setLoading(false);
    }
  }, []); // Run only once on mount

  async function loadDoctors(clinicId) {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`/api/clinics/${params.id}/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors:", err);
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
      {/* Changed params.id to id */}
      <h2>Doctors for Clinic {id}</h2> 
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