"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../lib/api";
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
        body: JSON.stringify({ username: u.trim(), password: p }),
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
        setError(`Request failed (${res.status}): ${msg}`);
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
              width: 84,
              height: 84,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f4f7fb",
            }}
          >
            {/* Simple logo */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 12c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"
                fill="#3f51b5"
              />
              <path
                d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6H6z"
                fill="#90caf9"
              />
            </svg>
          </div>

          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            MyHealth Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome to MyHealthAccess. Please login or create an account to
            connect with your healthcare providers and manage your appointments
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
              placeholder="Please enter your email address"
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
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => handleAction("/api/auth/register-patient")}
              disabled={loading}
            >
              Sign Up
            </Button>

            <Button
              variant="text"
              sx={{ textTransform: "none", color: "text.secondary" }}
              onClick={() => alert("Password reset flow not implemented")}
            >
              I Don't Know My Password
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </div>
  );
}
