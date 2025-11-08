// Set this as a client component to use state and effects
"use client";

import { useState, useEffect } from "react";
// 1. Import authFetch from your api.js file
import { authFetch } from "@/lib/api"; 
import CircularProgress from "@mui/material/CircularProgress";

export default function ReportsPage() {
  // 2. Create state to hold your report data, loading status, and errors
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 3. Call the loadReport function when the page loads
  useEffect(() => {
    loadReport();
  }, []);

  // 4. Define the async function to call your API
  async function loadReport() {
    setLoading(true);
    setError("");

    // Get today's date in YYYY-MM-DD format for the API
    const today = new Date().toISOString().split('T')[0];

    try {
      // 5. This is the key part:
      //    - Use authFetch instead of fetch
      //    - Build the URL to match your ReportController
      const res = await authFetch(`/api/reports/daily?date=${today}`);
      const data = await res.json();
      
      setReport(data);

    } catch (err) {
      console.error("Failed to load report:", err);
      // This will catch the 401 Unauthorized error if you're not logged in as staff
      setError(err.message); 
    } finally {
      setLoading(false);
    }
  }

  // 6. Show a loading message
  if (loading) {
    return <CircularProgress />;
  }

  // 7. Show an error message
  if (error) {
    return (
      <div>
        <h2>Error loading report</h2>
        <p style={{ color: "#d32f2f" }}>{error}</p>
        <p style={{ color: "#666" }}>
          Please make sure you are logged in as a STAFF or ADMIN.
        </p>
      </div>
    );
  }

  // 8. Show the report data
  return (
    <div>
      <h2>Daily Report for {report.date}</h2>
      <ul>
        <li>Total Patients Seen: {report.totalPatientsSeen}</li>
        <li>Average Waiting Time: {report.averageWaitingTimeMinutes.toFixed(2)} minutes</li>
        <li>No-Show Rate: {report.noShowRatePercentage.toFixed(2)}%</li>
      </ul>
    </div>
  );
}