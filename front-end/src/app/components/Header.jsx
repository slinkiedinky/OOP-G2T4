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

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  function handleLogout() {
    removeToken();
    setIsLoggedIn(false);
    router.push("/auth");
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
            <Link href="/appointments">
              <Button color="primary">Appointments</Button>
            </Link>
            <Link href="/my-appointments">
              <Button color="primary">My Appointments</Button>
            </Link>

            {isLoggedIn ? (
              <Button
                variant="outlined"
                sx={{ borderRadius: 8 }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <Link href="/auth">
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
