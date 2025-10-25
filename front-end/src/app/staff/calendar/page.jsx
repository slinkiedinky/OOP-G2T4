"use client";
import React from "react";
import RequireAuth from "../../components/RequireAuth";
import StaffCalendar from "../../../components/StaffCalendar";
import Button from "@mui/material/Button";
import Link from "next/link";

export default function StaffCalendarPage() {
  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Staff Calendar</h2>
            <p style={{ color: "#666", marginTop: 8, marginBottom: 0 }}>
              View all appointments in a monthly calendar view
            </p>
          </div>
          <Link href="/staff">
            <Button variant="outlined">Back to List View</Button>
          </Link>
        </div>

        <StaffCalendar clinicId={22} />
      </div>
    </RequireAuth>
  );
}
