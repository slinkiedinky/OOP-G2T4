"use client";
import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Link from "next/link";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function QueueBoard({ queue = [], display = true }) {
  const [showCompleted, setShowCompleted] = useState(false);

  if (!display) {
    return (
      <Card sx={{ padding: 2 }}>
        <CardContent>
          <div style={{ color: "#666" }}>Queue display is turned off</div>
        </CardContent>
      </Card>
    );
  }

  // categorize entries
  const calledServing = queue.filter((x) => x.status === "CALLED" || x.status === "SERVING")
    .sort((a, b) => {
      const ta = a.calledAt ? new Date(a.calledAt).getTime() : 0;
      const tb = b.calledAt ? new Date(b.calledAt).getTime() : 0;
      return tb - ta;
    });

  const fastTracked = queue.filter((x) => x.status === "QUEUED" && x.fastTracked === true)
    .sort((a, b) => {
      const ta = a.fastTrackedAt ? new Date(a.fastTrackedAt).getTime() : 0;
      const tb = b.fastTrackedAt ? new Date(b.fastTrackedAt).getTime() : 0;
      return ta - tb;
    });

  const regularQueued = queue.filter((x) => x.status === "QUEUED" && !x.fastTracked)
    .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));

  const completedStatuses = new Set(["COMPLETED", "SKIPPED", "NO_SHOW", "CANCELLED"]);
  const completed = queue.filter((x) => completedStatuses.has(x.status))
    .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));

  // next determination
  let nextEntry = null;
  if (fastTracked.length) nextEntry = fastTracked[0];
  else if (regularQueued.length) nextEntry = regularQueued[0];

  // now serving banner
  let nowServing = null;
  const serving = queue.find((x) => x.status === "SERVING");
  if (serving) nowServing = serving;
  else {
    const called = queue.filter((x) => x.status === "CALLED");
    if (called.length) {
      called.sort((a, b) => {
        const ta = a.calledAt ? new Date(a.calledAt).getTime() : 0;
        const tb = b.calledAt ? new Date(b.calledAt).getTime() : 0;
        return tb - ta;
      });
      nowServing = called[0];
    }
  }

  return (
    <Card sx={{ padding: 2, height: "100%" }}>
      <CardContent>
        <h3>Today's Queue — {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</h3>

        <Box sx={{ marginBottom: 2 }}>
          {nowServing ? (
            <div style={{ padding: 12, borderRadius: 8, background: "#e3f2fd", display: "inline-block" }}>
              <strong>Now Serving:</strong>&nbsp; Q# {nowServing.queueNumber}
            </div>
          ) : (
            <div style={{ color: "#666" }}>No patient is currently being served.</div>
          )}
        </Box>

        {calledServing.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Called / Serving</Typography>
            <div style={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Q#</TableCell>
                    <TableCell>Appointment ID</TableCell>
                    <TableCell>Slot time</TableCell>
                    <TableCell>Called At</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calledServing.map((q) => (
                    <TableRow key={`called-${q.id}`} sx={{ backgroundColor: "rgba(2,136,209,0.06)" }}>
                      <TableCell>{q.queueNumber}</TableCell>
                      <TableCell>{q.appointmentId}</TableCell>
                      <TableCell>{q.time ? new Date(q.time).toLocaleTimeString() : "-"}</TableCell>
                      <TableCell>{q.calledAt ? new Date(q.calledAt).toLocaleTimeString() : "-"}</TableCell>
                      <TableCell>{q.doctorName || "-"}</TableCell>
                      <TableCell>{q.patientName || "-"}</TableCell>
                      <TableCell>{q.status === "CALLED" || q.status === "SERVING" ? (
                        <Link href={`/staff?appointmentId=${q.appointmentId}`}><Button variant="contained" size="small">Open appointment</Button></Link>
                      ) : null}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {fastTracked.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Fast‑tracked (priority)</Typography>
            <div style={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Q#</TableCell>
                    <TableCell>Appointment ID</TableCell>
                    <TableCell>Slot time</TableCell>
                    <TableCell>Fast tracked at</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fastTracked.map((q, idx) => (
                    <TableRow key={`ft-${q.id}`} sx={{ backgroundColor: idx === 0 ? "rgba(255,249,196,0.7)" : undefined }}>
                      <TableCell>
                        {q.queueNumber} {idx === 0 ? <strong style={{ color: "#0d47a1" }}> (NEXT)</strong> : null}
                        &nbsp; <Chip label="FAST-TRACK" color="warning" size="small" />
                      </TableCell>
                      <TableCell>{q.appointmentId}</TableCell>
                      <TableCell>{q.time ? new Date(q.time).toLocaleTimeString() : "-"}</TableCell>
                      <TableCell>{q.fastTrackedAt ? new Date(q.fastTrackedAt).toLocaleTimeString() : "-"}</TableCell>
                      <TableCell>{q.doctorName || "-"}</TableCell>
                      <TableCell>{q.patientName || "-"}</TableCell>
                      <TableCell>{q.fastTrackReason ? <Tooltip title={q.fastTrackReason}><span>{q.fastTrackReason.length > 30 ? q.fastTrackReason.slice(0, 30) + '…' : q.fastTrackReason}</span></Tooltip> : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {regularQueued.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Queued</Typography>
            <div style={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Q#</TableCell>
                    <TableCell>Appointment ID</TableCell>
                    <TableCell>Slot time</TableCell>
                    <TableCell>Queued At</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Patient</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regularQueued.map((q, idx) => (
                    <TableRow key={`q-${q.id}`}>
                      <TableCell>{q.queueNumber} {nextEntry && nextEntry.id === q.id ? <strong style={{ color: "#0d47a1" }}> (NEXT)</strong> : null}</TableCell>
                      <TableCell>{q.appointmentId}</TableCell>
                      <TableCell>{q.time ? new Date(q.time).toLocaleTimeString() : "-"}</TableCell>
                      <TableCell>{q.createdAt ? new Date(q.createdAt).toLocaleTimeString() : "-"}</TableCell>
                      <TableCell>{q.doctorName || "-"}</TableCell>
                      <TableCell>{q.patientName || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <Button size="small" onClick={() => setShowCompleted(!showCompleted)}>
            {showCompleted ? 'Hide completed' : `Show completed (${completed.length})`}
          </Button>
        </div>
        {showCompleted && completed.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Completed / Other</Typography>
            <div style={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Q#</TableCell>
                    <TableCell>Appointment ID</TableCell>
                    <TableCell>Slot time</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Patient</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completed.map((q) => (
                    <TableRow key={`c-${q.id}`}>
                      <TableCell>{q.queueNumber}</TableCell>
                      <TableCell>{q.appointmentId}</TableCell>
                      <TableCell>{q.time ? new Date(q.time).toLocaleTimeString() : "-"}</TableCell>
                      <TableCell>{q.doctorName || "-"}</TableCell>
                      <TableCell>{q.patientName || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
