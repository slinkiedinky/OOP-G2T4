"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../../lib/api";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * Login page
 *
 * Provides a login form that authenticates the user and stores the JWT
 * token for subsequent API requests.
 */
export default function Auth() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [showP, setShowP] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();

  function validate() {
    if (!u || u.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!p || p.length < 4) {
      setError("Password must be at least 4 characters");
      return false;
    }
    return true;
  }

  async function handleAction(path) {
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.trim(), password: p }),
      });
      const text = await res.text();
      if (res.ok) {
        try {
          const j = JSON.parse(text);
          setToken(j.token);
          document.cookie = `aqms_token=${j.token}; path=/; max-age=${
            60 * 60 * 24
          }`;
          window.location.href = "/clinics";
        } catch (e) {
          window.location.href = "/clinics";
        }
      } else {
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed.message || JSON.stringify(parsed);
        } catch (e) {}
        // User-friendly error messages
        if (res.status === 400 && msg.includes("Bad credentials")) {
          setError(
            "Invalid username or password. Please check your credentials and try again."
          );
        } else if (res.status === 400 && msg.includes("Account disabled")) {
          setError("Your account has been disabled. Please contact support.");
        } else if (res.status === 400 && msg.includes("Username taken")) {
          setError(
            "This username is already taken. Please choose a different one."
          );
        } else {
          setError(`Login failed: ${msg}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error: " + (err.message || err));
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <Paper elevation={4} sx={{ width: 360, p: 4, borderRadius: 3 }}>
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Simple logo */}
            <img src="/QmeNow.svg" alt="QmeNow" style={{ height: 100}} />
          </div>
          <Typography variant="body2" color="text.secondary">
            Welcome. Please login to QmeNow to manage your 
            appointments, or create an account to begin queueing yourself.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ width: "100%", whiteSpace: "pre-wrap" }}
            >
              {error}
            </Alert>
          )}

          <Stack
            component="form"
            spacing={1}
            sx={{ width: "100%" }}
            onSubmit={(e) => {
              e.preventDefault();
              handleAction("/api/auth/login");
            }}
          >
            <TextField
              placeholder="Email"
              label=""
              value={u}
              onChange={(e) => setU(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
            <TextField
              placeholder="Password"
              label=""
              type={showP ? "text" : "password"}
              value={p}
              onChange={(e) => setP(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowP((s) => !s)}
                      edge="end"
                    >
                      {showP ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : null
              }
            >
              Login
            </Button>

            <Button
                variant="text"
                fullWidth
                onClick={() => router.push("/auth/signup")}
              >
                Don't have an account? Sign up
              </Button>

            <Button
              variant="text"
              sx={{ textTransform: "none", color: "text.secondary" }}
              onClick={() => router.push("/forgot-password")}
            >
              Forgot Password?
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </div>
  );
}
