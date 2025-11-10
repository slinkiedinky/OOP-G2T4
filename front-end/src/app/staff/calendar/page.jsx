"use client";

import React from "react";
import Link from "next/link";
import RequireAuth from "../../components/RequireAuth";
import StaffCalendar from "../../../components/StaffCalendar";

import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

export default function StaffCalendarPage() {
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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={600}
              gutterBottom
            >
              Book Appointment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View available slots and manage patient bookings directly from the
              calendar
            </Typography>
          </Box>

          <Button
            component={Link}
            href="/staff"
            variant="outlined"
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Back to List View
          </Button>
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
            <StaffCalendar clinicId={22} />
          </CardContent>
        </Card>
      </Container>
    </RequireAuth>
  );
}
