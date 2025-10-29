"use client";
import React from "react";
import RequireAuth from "../../components/RequireAuth";
import PatientCalendar from "../../../components/PatientCalendar";
import { getUserFromToken } from "../../../lib/api";
export default function PatientCalendarPage() {
  const user = getUserFromToken();
  const patientId = user?.userId || 1;
  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        <h2>Book Appointment</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>
          View available appointments and book directly from the calendar
        </p>
        <PatientCalendar patientId={patientId} />
      </div>
    </RequireAuth>
  );
}
