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

export default function TimeSlotPicker({
  open,
  onClose,
  selectedDate,
  slots,
  loading,
  onBookSlot,
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Available Time Slots
        <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
          {formatDate(selectedDate)}
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
            {slots.map((slot) => (
              <Card
                key={slot.id}
                sx={{
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
                onClick={() => onBookSlot(slot)}
              >
                <CardContent sx={{ padding: "12px !important" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </div>
                      <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                        Dr. {slot.doctor?.name || "Unknown"}
                      </div>
                    </div>
                    <Button variant="contained" size="small">
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}