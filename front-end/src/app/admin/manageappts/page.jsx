"use client";
import RequireAuth from "../../components/RequireAuth";
import React, { useState, useEffect } from "react";
import { authFetch } from "../../../lib/api";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    clinicId: "",
    doctorId: "",
    date: "",
    status: "",
  });

  const [openEdit, setOpenEdit] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [editedAppt, setEditedAppt] = useState({
    doctorName: "",
    patientName: "",
    date: "",
    time: "",
    status: "",
  });
  const [newAppt, setNewAppt] = useState({
    doctorName: "",
    patientName: "",
    date: "",
    time: "",
    status: "BOOKED",
  });

  // --- Load appointments ---
  async function loadAppointments() {
    setLoading(true);
    try {
      let url = "/api/appointments/all";

      const params = new URLSearchParams();
      if (filters.clinicId) params.append("clinicId", filters.clinicId);
      if (filters.doctorId) params.append("doctorId", filters.doctorId);
      if (filters.date) params.append("date", filters.date);
      if (filters.status) params.append("status", filters.status);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await authFetch(url);
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  // --- Handle Edit ---
  function handleEditClick(appt) {
    setSelectedAppt(appt);
    setEditedAppt(appt);
    setOpenEdit(true);
  }

  async function saveChanges() {
    if (!selectedAppt) return;
    if (!confirm("Save changes to this appointment?")) return;

    try {
      const res = await authFetch(`/api/appointments/${selectedAppt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedAppt),
      });
      if (!res.ok) throw new Error("Failed to update appointment");
      alert("Appointment updated successfully!");
      setOpenEdit(false);
      loadAppointments();
    } catch (err) {
      alert(err.message);
    }
  }

  // --- Delete ---
  async function deleteAppointment(id) {
    if (!confirm("Delete this appointment?")) return;
    try {
      const res = await authFetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete appointment");
      alert("Appointment deleted!");
      loadAppointments();
    } catch (err) {
      alert(err.message);
    }
  }

  // --- Create ---
  async function createAppointment() {
    if (!newAppt.doctorName || !newAppt.patientName || !newAppt.date || !newAppt.time) {
      alert("Please fill in all required fields.");
      return;
    }
    if (!confirm("Create this new appointment?")) return;

    try {
      const res = await authFetch("/api/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppt),
      });
      if (!res.ok) throw new Error("Failed to create appointment");
      alert("Appointment created!");
      setOpenCreate(false);
      setNewAppt({ doctorName: "", patientName: "", date: "", time: "", status: "BOOKED" });
      loadAppointments();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Appointments Management</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <IconButton color="primary" onClick={loadAppointments} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreate(true)}
            >
              Create Appointment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <TextField
            label="Clinic ID"
            type="number"
            value={filters.clinicId}
            onChange={(e) => setFilters({ ...filters, clinicId: e.target.value })}
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            label="Doctor ID"
            type="number"
            value={filters.doctorId}
            onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            label="Date"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            label="Status"
            select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ backgroundColor: "white" }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="BOOKED">Booked</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
        </div>

        {/* List */}
        <div style={{ marginTop: 24 }}>
          {appointments.length === 0 ? (
            <p
              style={{
                color: "#666",
                textAlign: "center",
                background: "#fafafa",
                padding: "40px 0",
                borderRadius: 8,
                border: "1px dashed #ddd",
              }}
            >
              No appointments found.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {appointments.map((appt) => (
                <Card key={appt.id}>
                  <CardContent>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                          {appt.patientName} with {appt.doctorName}
                        </div>
                        <div style={{ fontSize: 14, color: "#666" }}>
                          {appt.date} — {appt.time}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <Chip
                          label={appt.status}
                          sx={{
                            fontWeight: 600,
                            color: "#fff",
                            backgroundColor:
                              appt.status === "BOOKED"
                                ? "#3b82f6"
                                : appt.status === "COMPLETED"
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        />
                        <div style={{ display: "flex", gap: 4 }}>
                          <IconButton size="small" color="primary" onClick={() => handleEditClick(appt)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteAppointment(appt.id)}
                            sx={{ color: "#9ca3af", "&:hover": { color: "#ef4444" } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Doctor Name"
              fullWidth
              margin="dense"
              value={editedAppt.doctorName}
              onChange={(e) => setEditedAppt({ ...editedAppt, doctorName: e.target.value })}
            />
            <TextField
              label="Patient Name"
              fullWidth
              margin="dense"
              value={editedAppt.patientName}
              onChange={(e) => setEditedAppt({ ...editedAppt, patientName: e.target.value })}
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              margin="dense"
              value={editedAppt.date}
              onChange={(e) => setEditedAppt({ ...editedAppt, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              margin="dense"
              value={editedAppt.time}
              onChange={(e) => setEditedAppt({ ...editedAppt, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Status"
              select
              fullWidth
              margin="dense"
              value={editedAppt.status}
              onChange={(e) => setEditedAppt({ ...editedAppt, status: e.target.value })}
            >
              <MenuItem value="BOOKED">BOOKED</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveChanges}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Modal */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth>
          <DialogTitle>Create Appointment</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Doctor Name"
              fullWidth
              margin="dense"
              value={newAppt.doctorName}
              onChange={(e) => setNewAppt({ ...newAppt, doctorName: e.target.value })}
            />
            <TextField
              label="Patient Name"
              fullWidth
              margin="dense"
              value={newAppt.patientName}
              onChange={(e) => setNewAppt({ ...newAppt, patientName: e.target.value })}
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              margin="dense"
              value={newAppt.date}
              onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              margin="dense"
              value={newAppt.time}
              onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button variant="contained" onClick={createAppointment}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
