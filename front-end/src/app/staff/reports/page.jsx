// Set this as a client component to use state and effects
"use client";

import { useState, useEffect } from "react";
// 1. Import authFetch from your api.js file
import { authFetch } from "@/lib/api"; 
import CircularProgress from "@mui/material/CircularProgress";
// 2. Import MUI components for the dropdown
import { Select, MenuItem, InputLabel, FormControl, Box } from "@mui/material";

export default function ReportsPage() {
  // 3. State for the report, loading, and errors
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false); // Default to false
  const [error, setError] = useState("");

  // 4. NEW state to hold the list of clinics and the selected clinic
  const [clinics, setClinics] = useState([]); // To store list of clinics
  const [selectedClinic, setSelectedClinic] = useState(""); // To store the selected clinic ID

  const today = new Date().toISOString().split('T')[0];

  // 5. NEW Effect - Load the list of clinics once when the page loads
  useEffect(() => {
    async function loadClinics() {
      try {
        // You'll need to create this API endpoint in your backend
        const res = await authFetch(`/api/clinics`); 
        const data = await res.json();
        setClinics(data); // Assumes data is an array like [{ id: 1, name: "Clinic A" }]
      } catch (err) {
        console.error("Failed to load clinics:", err);
        setError("Failed to load clinic list. " + err.message);
      }
    }
    loadClinics();
  }, []); // Empty dependency array, runs only once

  // 6. MODIFIED Effect - Load the report when 'selectedClinic' or 'today' changes
  useEffect(() => {
    // Don't try to load a report if no clinic is selected
    if (!selectedClinic) {
      setReport(null); // Clear any old report data
      return;
    }

    async function loadReport() {
      setLoading(true);
      setError("");
      setReport(null); // Clear previous report

      try {
        // 7. MODIFIED API call to include the clinicId
        const res = await authFetch(`/api/reports/daily?date=${today}&clinicId=${selectedClinic}`);
        const data = await res.json();
        
        setReport(data);

      } catch (err) {
        console.error("Failed to load report:", err);
        setError(err.message); 
      } finally {
        setLoading(false);
      }
    }
  
    loadReport();
  }, [selectedClinic, today]); // Re-runs when selectedClinic or today changes

  // 8. Helper function to get the selected clinic's name for the title
  const getClinicName = () => {
    if (!selectedClinic) return "";
    // Assumes clinic objects have 'id' and 'name' properties
    const clinic = clinics.find(c => c.id === selectedClinic); 
    return clinic ? clinic.name : "";
  };

  return (
    <div>
      {/* 9. NEW Clinic Selection Dropdown */}
      <Box sx={{ minWidth: 240, marginBottom: 4 }}>
        <FormControl fullWidth>
          <InputLabel id="clinic-select-label">Select Clinic</InputLabel>
          <Select
            labelId="clinic-select-label"
            value={selectedClinic}
            label="Select Clinic"
            onChange={(e) => setSelectedClinic(e.target.value)}
          >
            <MenuItem value="">
              <em>Please select a clinic</em>
            </MenuItem>
            {/* Assumes clinic objects have 'id' and 'name' properties */}
            {clinics.map((clinic) => (
              <MenuItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 10. MODIFIED Conditional Rendering */}
      
      {/* Show loading spinner */}
      {loading && <CircularProgress />}

      {/* Show error if any */}
      {error && (
        <div>
          <h2>Error loading report</h2>
          <p style={{ color: "#d32f2f" }}>{error}</p>
          <p style={{ color: "#666" }}>
            Please make sure you are logged in as a STAFF or ADMIN.
          </p>
        </div>
      )}

      {/* Show report data only if not loading, no error, a clinic is selected, AND report data exists */}
      {!loading && !error && selectedClinic && report && (
        <>
          <h2>Daily Report for {getClinicName()} on {today}</h2>
          <ul>
            <li>Total Patients Seen: {report.totalPatientsSeen}</li>
            <li>Average Waiting Time: {report.averageWaitingTimeMinutes.toFixed(2)} minutes</li>
            <li>No-Show Rate: {report.noShowRatePercentage.toFixed(2)}%</li>
          </ul>
        </>
      )}
      
      {/* Show "No data" message if everything finished but 'report' is still null */}
      {!loading && !error && selectedClinic && !report && (
        <div>
          <h2>Daily Report for {getClinicName()} on {today}</h2>
          <p>No report data found for this date.</p>
        </div>
      )}
    </div>
  );
}