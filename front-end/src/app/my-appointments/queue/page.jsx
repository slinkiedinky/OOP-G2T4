"use client";
import React, { useEffect, useState, useRef } from "react";
import RequireAuth from "../../components/RequireAuth";
import { getPatientQueue } from "../../../lib/api";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import { useSearchParams } from "next/navigation";

export default function PatientQueuePage() {
  const [queueInfo, setQueueInfo] = useState(null); // { entry, queueStarted }
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const appointmentId = params ? params.get("appointmentId") : null;
  const pollRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
  const data = await getPatientQueue(appointmentId);
  if (data) setQueueInfo(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 5000);
    return () => clearInterval(pollRef.current);
  }, [appointmentId]);

  // notify on status changes like CALLED for the entry
  const prevStatus = useRef(null);
  useEffect(() => {
    if (!queueInfo || !queueInfo.entry) return;
    const status = queueInfo.entry.status;
    if (prevStatus.current && prevStatus.current !== status) {
      if (status === "CALLED" || status === "SERVING") {
        if (Notification && Notification.permission === "granted") {
          new Notification("Clinic: You're being called", {
            body: `Q#: ${queueInfo.entry.queueNumber} - ${queueInfo.entry.doctorName || ""}`,
          });
        }
      }
    }
    prevStatus.current = status;
  }, [queueInfo]);

  async function requestNotifications() {
    if (!("Notification" in window)) return alert("Notifications not supported");
    if (Notification.permission !== "granted") await Notification.requestPermission();
  }

  return (
    <RequireAuth role="PATIENT">
      <div>
        <h2>My Queue Progress</h2>
        <p style={{ color: "#666" }}>Track your place in the clinic queue in real time.</p>

        <div style={{ marginBottom: 12 }}>
          <Button variant="outlined" onClick={requestNotifications}>
            Enable Notifications
          </Button>
        </div>

        <Card>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : !queueInfo || !queueInfo.entry ? (
              <div style={{ color: "#666" }}>No queue information available.</div>
            ) : (
              <div>
                {/* show queue started/paused */}
                <div style={{ marginBottom: 12 }}>
                  {queueInfo.queueStarted ? (
                    queueInfo.queuePaused ? (
                      <div style={{ color: "#a76a00" }}>The queue is currently paused.</div>
                    ) : (
                      <div style={{ color: "#2e7d32" }}>The queue is running.</div>
                    )
                  ) : (
                    <div style={{ color: "#c66" }}>The queue for this clinic has not started yet. Please continue checking your queue progress.</div>
                  )}
                </div>

                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  Q# {queueInfo.entry.queueNumber || "-"}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Status:</strong> {queueInfo.entry.status}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Appointment:</strong> {queueInfo.entry.appointmentId || queueInfo.entry.slot?.id}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Patient:</strong> {queueInfo.entry.patientName || queueInfo.entry.slot?.patient?.name || "-"}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Doctor:</strong> {queueInfo.entry.doctorName || "-"}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Now Serving:</strong> {queueInfo.currentCalledNumber ? `Q# ${queueInfo.currentCalledNumber}` : "-"}
                </div>
                {/* 'People ahead' and 'Total in queue' intentionally omitted per product decision. Only show now serving number. */}
                <div style={{ marginTop: 12 }}>
                  <Button onClick={load}>Refresh</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
