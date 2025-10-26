"use client";
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

export default function AppointmentList({
  appointments,
  onCheckIn,
  onCancel,
  onAppointmentClick,
  showPatientInfo = false,
  showActions = true,
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case "BOOKED":
        return { bg: "#e3f2fd", color: "#1976d2" };
      case "CHECKED_IN":
        return { bg: "#e8f5e9", color: "#388e3c" };
      case "CANCELLED":
        return { bg: "#fce4ec", color: "#c2185b" };
      default:
        return { bg: "#fff3e0", color: "#f57c00" };
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {appointments.map((appt) => {
        const statusStyle = getStatusColor(appt.status);
        return (
          <Card
            key={appt.id}
            sx={{
              cursor: "pointer",
              "&:hover": { backgroundColor: "#f9fafb" },
            }}
            onClick={() => onAppointmentClick && onAppointmentClick(appt)}
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
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {new Date(appt.startTime).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {showPatientInfo && appt.patient && (
                    <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      Patient:{" "}
                      {appt.patient?.name ||
                        appt.patient?.username ||
                        appt.patient?.email ||
                        "N/A"}{" "}
                    </div>
                  )}

                  <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                    Doctor: {appt.doctor?.name || "N/A"}
                  </div>

                  {appt.clinic && (
                    <div style={{ fontSize: 14, color: "#666" }}>
                      Clinic: {appt.clinic.name}
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 4,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      {appt.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                    ID: {appt.id}
                  </div>
                </div>

                {showActions && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {appt.status === "BOOKED" && onCheckIn && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => onCheckIn(appt.id)}
                      >
                        Check In
                      </Button>
                    )}
                    {appt.status === "BOOKED" && onCancel && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => onCancel(appt.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
