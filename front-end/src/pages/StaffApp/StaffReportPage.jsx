import React, { useState, useEffect } from 'react';
// Assuming you have a CSS file for this page
// import './StaffReportPage.css'; 

export default function StaffReportPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  
  // --- NEW STATE ---
  // This state will hold the list of clinics for the dropdown
  const [clinics, setClinics] = useState([]); 
  // This state will store the ID of the clinic the user selects
  const [selectedClinic, setSelectedClinic] = useState(''); 

  // --- EFFECT 1: Fetch the list of clinics when the page loads ---
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        // 1. Call the new /api/clinics endpoint you created
        const response = await fetch('/api/clinics'); 
        if (!response.ok) {
          throw new Error('Failed to load clinic list');
        }
        const data = await response.json();
        setClinics(data);
        
        // 2. If we get clinics, select the first one by default
        if (data.length > 0) {
          setSelectedClinic(data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch clinics: ' + err.message);
      }
    };
    fetchClinics();
  }, []); // The empty array [] means this runs only once when the page loads

  // --- EFFECT 2: Fetch the report *after* a clinic is selected ---
  useEffect(() => {
    // Don't try to fetch a report if no clinic is selected yet
    if (!selectedClinic) {
      return;
    }

    const fetchReport = async () => {
      try {
        setReport(null); // Clear the old report
        setError(''); // Clear any old errors
        
        const today = new Date().toISOString().split('T')[0];
        
        // 3. This is the NEW, MODIFIED URL that includes the selected clinic ID
        const response = await fetch(`/api/reports/daily/${selectedClinic}?date=${today}`); 
        
        if (!response.ok) {
          const errorText = await response.text(); // Get more details from the back-end
          throw new Error(errorText || 'Error loading report');
        }
        
        const data = await response.json();
        setReport(data);
      } catch (err) {
        // This is the error you saw before, "Failed to fetch"
        setError('Failed to fetch report: ' + err.message); 
      }
    };

    fetchReport();
  }, [selectedClinic]); // This array tells React to re-run this code *every time* 'selectedClinic' changes

  // --- RENDER THE PAGE ---
  return (
    <div className="staff-report-page"> {/* You may have a className here */}
      <h2>Daily Report for</h2>
      
      {/* --- 4. ADD THIS NEW SECTION FOR THE DROPDOWN --- */}
      <div className="clinic-selector" style={{ marginBottom: '20px' }}>
        <label htmlFor="clinic-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Select Clinic: 
        </label>
        <select
          id="clinic-select"
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          disabled={clinics.length === 0}
          style={{ padding: '5px' }}
        >
          {clinics.length === 0 ? (
            <option>Loading clinics...</option>
          ) : (
            clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))
          )}
        </select>
      </div>
      {/* --- END OF NEW SECTION --- */}

      {/* 5. This is your existing code for showing the report */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* Show "Loading..." only while fetching and there's no error */}
      {!report && !error && <p>Loading report data...</p>}
      
      {/* Show the report data once it's loaded */}
      {report && (
        <ul>
          {/* 6. Use the property names from your DailyReportDto.java */}
          <li>Total Patients Seen: {report.totalPatientsSeen}</li>
          <li>Average Waiting Time: {report.averageWaitingTimeMinutes.toFixed(2)} minutes</li>
          <li>No-Show Rate: {report.noShowRatePercentage.toFixed(2)}%</li>
        </ul>
      )}
    </div>
  );
}