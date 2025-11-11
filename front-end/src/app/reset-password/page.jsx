"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { authFetch } from "../../lib/api";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

/**
 * ResetPasswordPage
 *
 * Allows a user to set a new password using a token URL parameter. The
 * page validates input and posts the new password to the backend.
 */
export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/password/confirm-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (res.ok) {
        setMessage("✅ Password reset successful! You can now log in.");
      } else {
        const err = await res.text();
        setMessage(`❌ ${err || "Invalid or expired link"}`);
      }
    } catch (err) {
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) setMessage("❌ Invalid or missing reset token.");
  }, [token]);

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
          <h2 style={{ textAlign: "center", marginBottom: 16 }}>Reset Password</h2>

          {!token ? (
            <p style={{ color: "#ef4444", textAlign: "center" }}>{message}</p>
          ) : (
            <>
              <TextField
                label="New Password"
                fullWidth
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="dense"
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />
              <TextField
                label="Confirm Password"
                fullWidth
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="dense"
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                disabled={loading}
                onClick={handleReset}
              >
                {loading ? "Processing..." : "Reset Password"}
              </Button>

              {message && (
                <p style={{ marginTop: 10, textAlign: "center", color: "#4b5563" }}>
                  {message}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
