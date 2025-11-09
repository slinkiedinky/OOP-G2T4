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

  // --- CORRECTION 1 ---
  // Define 'today' in the component's main scope.
  // This makes it available to both loadReport() and the return() statement.
  const today = new Date().toISOString().split('T')[0];

  // 3. Call the loadReport function when the page loads
  useEffect(() => {
    loadReport();
    // We add 'today' to the dependency array, though it's stable for the page load.
    // Alternatively, you can disable the ESLint warning for an empty array.
  }, [today]); 

  // 4. Define the async function to call your API
  async function loadReport() {
    setLoading(true);
    setError("");

    // 'today' is now read from the component scope
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
          {/* This message aligns with project roles [cite: 48, 50] */}
          Please make sure you are logged in as a STAFF or ADMIN.
        </p>
      </div>
    );
  }
  
  // --- CORRECTION 2 ---
  // Add a "null check" for the report object itself.
  // This prevents the page from crashing if the API returns empty/null data.
  if (!report) {
    return (
      <div>
        <h2>Daily Report for {today}</h2>
        <p>No report data found for this date.</p>
      </div>
    );
  }

  // 8. Show the report data
  return (
    <div>
      {/* --- CORRECTION 3 --- */}
      {/* Use the 'today' variable from the component scope, not 'report.date'. */}
      {/* This fixes the bug from your screenshot. */}
      <h2>Daily Report for {today}</h2>
      
      {/* These list items directly fulfill the project requirements [cite: 90, 91] */}
      <ul>
        <li>Total Patients Seen: {report.totalPatientsSeen}</li>
        <li>Average Waiting Time: {report.averageWaitingTimeMinutes.toFixed(2)} minutes</li>
        <li>No-Show Rate: {report.noShowRatePercentage.toFixed(2)}%</li>
      </ul>
    </div>
  );
}