"use client";
import RequireAuth from "../../components/RequireAuth";
import React, { useState, useEffect } from "react";
import { authFetch } from "../../../lib/api";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import Chip from "@mui/material/Chip";
import DeleteIcon from "@mui/icons-material/Delete";



/**
 * ManageUsers (admin)
 *
 * Admin UI to list, create, edit and delete users. Supports searching
 * and role filtering and provides quick actions such as sending password
 * reset emails.
 */
export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");


  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedUser, setEditedUser] = useState({ email: "", fullname: "", role: ""});

  const [openCreate, setOpenCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", fullname: "", password: "", role: "PATIENT"});
  const [showPassword, setShowPassword] = useState(false);

  async function sendResetPasswordEmail(userId) {
    const user = users.find(u => u.id === userId);
    if (!user || !user.email) {
      alert("User email not found.");
      return;
    }
  
    if (!confirm(`Send password reset email to ${user.email}?`)) return;
  
    try {
      const res = await authFetch(`/api/email/password/request-reset?email=${encodeURIComponent(user.email)}`, {
        method: "POST",
      });
  
      if (!res.ok) throw new Error("Failed to send password reset email");
      alert("Password reset email sent successfully!");
    } catch (err) {
      alert(err.message);
    }
  }
  

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const res = await authFetch("/api/admin/users/all");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally { 
      setLoading(false);
    }
  }

  async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      alert("User deleted successfully");
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleEditClick(user) {
    setSelectedUser(user);
    setEditedUser({
      email: user.email,
      fullname: user.fullname,
      password: "",
      role: user.role,
    });
    setOpenEdit(true);
  }

  async function saveChanges() {
    if (!selectedUser) return;
  
    if (!confirm("Are you sure you want to save these changes?")) return;
  
    const payload = { ...editedUser };
    delete payload.password;
  
    try {
      const res = await authFetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) throw new Error("Failed to update user");
  
      alert("User updated successfully!");
      setOpenEdit(false);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }
  

  async function createUser() {
    if (!newUser.fullname || !newUser.password || !newUser.email ) {
      alert("Full name, email and password are required");
      return;
    }

    if (!confirm("Create this new user?")) return;

    try {
      const res = await authFetch(`/api/admin/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error("Failed to create user");
      alert("User created successfully!");
      setOpenCreate(false);
      setNewUser({ fullname: "", password: "", role: "PATIENT", email: ""});
      loadUsers();
    } catch (err) {
      alert(err.message);
    }

    try {
      const res = await authFetch(`/api/email/password/newaccount-reset?email=${encodeURIComponent(newUser.email)}`, {
        method: "POST",
      });
  
      if (!res.ok) throw new Error("Email not sent")
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <RequireAuth>
      <div style={{ width: "100%", alignSelf: "flex-start" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ marginbottom: 16 }}>Manage All Users</h2>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style = {{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
           }}>
            <h3>All Users ({users
                .filter((user) => {
                  const matchesRole =
                    filterRole === "ALL" || user.role === filterRole;
                  const matchesSearch =
                    user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                  return matchesRole && matchesSearch;
                }).length})</h3>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap"}}>
              <TextField
                label="Search User"
                size="small"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx= {{
                  background:"white",
                  borderRadius:1,
                }}
              />
              <TextField
                label="Filter by Role"
                select
                size="small"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                sx= {{
                  background:"white",
                  borderRadius:1,
                }}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="STAFF">Staff</MenuItem>
                <MenuItem value="PATIENT">Patient</MenuItem>
              </TextField>
              
              <IconButton color="primary" onClick={loadUsers} disabled={loading}>
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreate(true)}
              >
                Create User
              </Button>
            </div>

           </div>
          {users
                .filter((user) => {
                  const matchesRole =
                    filterRole === "ALL" || user.role === filterRole;
                  const matchesSearch =
                    user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                  return matchesRole && matchesSearch;
                }).length === 0 ? (
            <p style={{ color: "#666",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "150px",
              textAlign: "center",}}>No users found.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {users
                .filter((user) => {
                  const matchesRole =
                    filterRole === "ALL" || user.role === filterRole;
                  const matchesSearch =
                    user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                  return matchesRole && matchesSearch;
                })
                .map((user) => (
                <Card key={user.id}>
                  <CardContent>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          cursor: "pointer",
                          flexGrow: 1,
                        }}
                        onClick={() => handleEditClick(user)}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {user.fullname}
                        </div>
                        <div style={{ fontSize: 14, color: "#999" }}>
                          ID: {user.id}
                        </div>
                        <div style={{ fontSize: 14, color: "#999" }}>
                          Email: {user.email}
                        </div>
                      </div>
                      <div style={{ display: "flex",flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                          <Chip
                            label={user.role}
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              textTransform: "capitalize",
                              color: "#fff",
                              backgroundColor:
                                user.role === "ADMIN"
                                  ? "#1e3a8a" 
                                  : user.role === "STAFF"
                                  ? "#10b981" 
                                  : "#9ca3af", 
                            }}
                          />
                          <div style = {{display: "flex", alignItems: "center"}}>
                          <IconButton
                            size="small"
                            color="primary"
                            sx={{ marginLeft: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(user);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
     
                          <IconButton
                            color="#9ca3af"
                            onClick={() => deleteUser(user.id)}
                            sx={{
                              "&:hover": { color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" },
                              transition: "all 0.2s ease",
                            }}
                          >
                            <DeleteIcon />
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

        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent dividers>
          <TextField
              label="Email"
              fullWidth
              margin="dense"
              value={editedUser.email}
              onChange={(e) =>
                setEditedUser({ ...editedUser, email: e.target.value })
              }
            />

            <TextField
              label="Full Name"
              fullWidth
              margin="dense"
              value={editedUser.fullname}
              onChange={(e) =>
                setEditedUser({ ...editedUser, fullname: e.target.value })
              }
            />

            <TextField
              label="Role"
              select
              fullWidth
              margin="dense"
              value={editedUser.role}
              onChange={(e) =>
                setEditedUser({ ...editedUser, role: e.target.value })
              }
            >
              <MenuItem value="PATIENT">PATIENT</MenuItem>
              <MenuItem value="STAFF">STAFF</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
            </TextField>

            <TextField
              label="Password"
              value="********"
              fullWidth
              margin="dense"
              disabled
              InputProps={{
                readOnly: true,
                sx: { backgroundColor: "#f5f5f5" },
                endAdornment: (
                  <IconButton disabled>
                    <LockIcon color="disabled" />
                  </IconButton>
                ),
              }}
            />

            <div style={{ marginTop: 8, textAlign: "right" }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<EmailIcon />}
                onClick={() => sendResetPasswordEmail(selectedUser.id)}
              >
                Send Reset Email
              </Button>
            </div>

          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveChanges}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent dividers>
          <TextField
              label="Email"
              fullWidth
              margin="dense"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
            <TextField
              label="Full Name"
              fullWidth
              margin="dense"
              value={newUser.fullname}
              onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="dense"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <TextField
              label="Role"
              select
              fullWidth
              margin="dense"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="PATIENT">PATIENT</MenuItem>
              <MenuItem value="STAFF">STAFF</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button variant="contained" onClick={createUser}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
