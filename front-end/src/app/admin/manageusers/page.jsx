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
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";


export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedUser, setEditedUser] = useState({ username: "", password: "", role: "", email: "", contactNum: "" });

  const [openCreate, setOpenCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "PATIENT", email: "", contactNum: "" });
  const [showPassword, setShowPassword] = useState(false);


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
      username: user.username,
      password: "",
      role: user.role,
    });
    setOpenEdit(true);
  }

  async function saveChanges() {
    if (!selectedUser) return;

    if (!confirm("Are you sure you want to save these changes?")) return;

    try {
      const res = await authFetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedUser),
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
    if (!newUser.username || !newUser.password || !newUser.email ) {
      alert("Username, email and password are required");
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
      setNewUser({ username: "", password: "", role: "PATIENT", email: "", contactNum: "" });
      loadUsers();
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
          <h2 style={{ margin: 0 }}>Manage All Users</h2>

          <div style={{ display: "flex", gap: 8 }}>
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

        <div style={{ marginTop: 24 }}>
          {users.length === 0 ? (
            <p style={{ color: "#666" }}>No users found. Try refreshing.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <h3>All Users ({users.length})</h3>
              {users.map((user) => (
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
                          {user.username}
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
                        </div>
                        <div style={{ fontSize: 14, color: "#666" }}>
                          Role: {user.role}
                        </div>
                        <div style={{ fontSize: 12, color: "#999" }}>
                          ID: {user.id}
                        </div>
                        <div style={{ fontSize: 12, color: "#999" }}>
                          Email: {user.email}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => deleteUser(user.id)}
                        >
                          Delete
                        </Button>
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
              label="Username"
              fullWidth
              margin="dense"
              value={editedUser.username}
              onChange={(e) =>
                setEditedUser({ ...editedUser, username: e.target.value })
              }
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="dense"
              value={editedUser.password_hash}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />

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
              label="Contact Number"
              fullWidth
              margin="dense"
              value={editedUser.contactNum}
              onChange={(e) =>
                setEditedUser({ ...editedUser, contactNum: e.target.value })
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
              label="Username"
              fullWidth
              margin="dense"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
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
              label="Email"
              fullWidth
              margin="dense"
              value={editedUser.email}
              onChange={(e) =>
                setEditedUser({ ...editedUser, email: e.target.value })
              }
            />
            <TextField
              label="Contact Number"
              fullWidth
              margin="dense"
              value={editedUser.contactNum}
              onChange={(e) =>
                setEditedUser({ ...editedUser, contactNum: e.target.value })
              }
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
