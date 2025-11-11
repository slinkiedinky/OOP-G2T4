"use client";
import { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

/**
 * ForgotPasswordPage
 *
 * Allows users to request a password reset by entering their email.
 * Handles validation and triggers backend to send reset link.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("api/password/i-forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("✅ A reset email has been sent if the account exists.");
      } else {
        const err = await res.text();
        setMessage(`❌ ${err || "Something went wrong"}`);
      }
    } catch (err) {
      setMessage("❌ Failed to send request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card sx={{ width: 400, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <h2 style={{ textAlign: "center", marginBottom: 16 }}>Forgot Password</h2>

          <TextField
            label="Email"
            fullWidth
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="dense"
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          />

          <Button
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          >
            {loading ? "Processing..." : "Send Reset Link"}
          </Button>

          {message && (
            <p style={{ marginTop: 10, textAlign: "center", color: "#4b5563" }}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
