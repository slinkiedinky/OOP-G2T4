"use client";
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

/**
 * TimeSlotPicker
 *
 * Dialog that lists available time slots for a selected date and allows
 * booking a slot. Renders a loading state, empty state, and highlights
 * already-booked slots.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback to close the dialog
 * @param {string} props.selectedDate - ISO date (YYYY-MM-DD) being viewed
 * @param {Array<Object>} props.slots - Array of slot objects
 * @param {boolean} props.loading - Loading indicator for slots
 * @param {Function} props.onBookSlot - Callback when user chooses to book a slot
 * @param {Array<Object>} [props.bookedAppointments=[]] - Appointments already booked by user
 * @returns {JSX.Element|null}
 */
export default function TimeSlotPicker({
  open,
  onClose,
  selectedDate,
  slots,
  loading,
  onBookSlot,
  bookedAppointments = [],
}) {
  if (!selectedDate) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if user already has a booking on this date
  const hasBookingOnDate = bookedAppointments.some(
    (appt) => appt.startTime.split("T")[0] === selectedDate
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            Available Time Slots
            <div
              style={{
                fontSize: 14,
                color: "#666",
                marginTop: 4,
                fontWeight: 400,
              }}
            >
              {formatDate(selectedDate)}
            </div>
          </div>
          {hasBookingOnDate && (
            <Chip
              icon={<CheckCircleIcon />}
              label="You have a booking on this date"
              color="success"
              size="small"
            />
          )}
        </div>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <CircularProgress />
          </div>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#666" }}>
            No available time slots for this date
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {slots.map((slot) => {
              const isBooked = bookedAppointments.some(
                (appt) => appt.id === slot.id
              );

              return (
                <Card
                  key={slot.id}
                  sx={{
                    cursor: isBooked ? "default" : "pointer",
                    transition: "all 0.2s",
                    border: isBooked
                      ? "2px solid #10b981"
                      : "1px solid #e2e8f0",
                    backgroundColor: isBooked ? "#f0fdf4" : "white",
                    "&:hover": isBooked
                      ? {}
                      : {
                          transform: "translateY(-2px)",
                          boxShadow: 3,
                        },
                  }}
                  onClick={() => !isBooked && onBookSlot(slot)}
                >
                  <CardContent sx={{ padding: "16px !important" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 16 }}>
                            {formatTime(slot.startTime)} -{" "}
                            {formatTime(slot.endTime)}
                          </div>
                          {isBooked && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Your Booking"
                              color="success"
                              size="small"
                            />
                          )}
                        </div>
                        <div
                          style={{ fontSize: 14, color: "#666", marginTop: 6 }}
                        >
                          <strong>Doctor:</strong>{" "}
                          {slot.doctor?.name || "Unknown"}
                        </div>
                        {slot.clinic && (
                          <div
                            style={{
                              fontSize: 14,
                              color: "#666",
                              marginTop: 2,
                            }}
                          >
                            <strong>Clinic:</strong> {slot.clinic.name}
                          </div>
                        )}
                      </div>
                      {!isBooked && (
                        <Button variant="contained" size="large">
                          Book Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
