"use client";

import React from "react";
import RequireAuth from "../../components/RequireAuth";
import PatientCalendar from "../../../components/PatientCalendar";
import { getUserFromToken } from "../../../lib/api";

import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

/**
 * PatientCalendarPage
 *
 * Patient-facing calendar for browsing available slots and booking
 * appointments. Wraps the PatientCalendar component and requires auth.
 */
export default function PatientCalendarPage() {
  const user = getUserFromToken();
  const patientId = user?.userId || 1;

  return (
    <RequireAuth>
      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 4, md: 6 },
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
            Book Appointment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View available appointments and book directly from the calendar
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <PatientCalendar patientId={patientId} />
          </CardContent>
        </Card>
      </Container>
    </RequireAuth>
  );
}
