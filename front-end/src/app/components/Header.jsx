"use client";
import { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import Container from "@mui/material/Container";
import { getToken, removeToken } from "../../lib/api";
import { useRouter } from "next/navigation";

/**
 * Header
 *
 * Application header containing navigation actions and role-aware
 * links. Decodes token to determine UI for patients, staff and admin.
 */
export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      if (token) {
        setIsLoggedIn(true);
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserRole(payload.role);
        } catch (e) {
          console.error("Failed to decode token:", e);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };
    checkAuth();
    window.addEventListener("focus", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  function handleLogout() {
    removeToken();
    setIsLoggedIn(false);
    setUserRole(null);
    router.push("/auth/login");
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      color="transparent"
      sx={{ borderBottom: "1px solid rgba(15,23,42,0.04)" }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ height: 64, display: "flex", justifyContent: "space-between" }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            <span style={{ fontWeight: 800 }}>Clinic</span>{" "}
            <span style={{ color: "#2563eb", fontWeight: 800 }}>System</span>
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Link href="/clinics">
              <Button color="primary">Clinics</Button>
            </Link>
            {userRole === "PATIENT" && (
              <>
                <Link href="/patient/calendar">
                  <Button color="primary">Book Appointment</Button>
                </Link>
                <Link href="/my-appointments">
                  <Button color="primary">My Appointments</Button>
                </Link>
              </>
            )}
            {userRole === "STAFF" && (
              <>
                <Link href="/staff/calendar">
                  <Button color="primary">Book Appointment</Button>
                </Link>
                <Link href="/staff">
                  <Button color="primary">Upcoming Appointments</Button>
                </Link>
                <Link href="/staff/queue">
                  <Button color="primary">Queue Management</Button>
                </Link>
              </>
            )}
            {userRole === "ADMIN" && (
              <>
                <Link href="/admin/manageusers">
                  <Button color="primary">Manage Users</Button>
                </Link>
                {/* <Link href="/admin/manageappts">
                  <Button color="primary">Appointments</Button>
                </Link> */}
                <Link href="/admin/clinicconfig">
                  <Button color="primary">Clinic Configuration</Button>
                </Link>
              </>
            )}
            {isLoggedIn ? (
              <Button
                variant="outlined"
                sx={{ borderRadius: 8 }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button variant="outlined" sx={{ borderRadius: 8 }}>
                  Login
                </Button>
              </Link>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
