'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Box, Typography, Paper, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Checkbox, FormControlLabel, CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import { authFetch } from '../../../lib/api'
import WarningBanner from '../../../components/WarningBanner'

export default function DoctorsTab({ selectedClinic, onDoctorCountChange }) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    specialization: '',
    morning: true,
    afternoon: true
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const specializations = [
    'Family Medicine', 'General Practice', 'Internal Medicine',
    'Pediatrician', 'Cardiologist', 'Dermatologist',
    'Orthopedic Surgeon', 'Psychiatrist', 'Gynecologist',
    'Neurologist', 'Ophthalmologist', 'ENT Specialist',
    'Dentist', 'Oncologist', 'Emergency Medicine',
    'Sports Medicine', 'Advanced Cardiology', 'Other'
  ]

  async function loadDoctors() {
    if (!selectedClinic || !selectedClinic.id) {
      setDoctors([])
      onDoctorCountChange?.(0)
      return
    }
    
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await authFetch(`/api/clinics/${selectedClinic.id}/doctors`)
      
      if (response.ok) {
        const data = await response.json()
        const list = Array.isArray(data) ? data : []
        setDoctors(list)
        onDoctorCountChange?.(list.length)
      } else {
        setMessage({ type: 'error', text: 'Failed to load doctors. Please try again.' })
        setDoctors([])
        onDoctorCountChange?.(0)
      }
    } catch (error) {
      console.error('Error loading doctors:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to load doctors' })
      setDoctors([])
      onDoctorCountChange?.(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [selectedClinic?.id])

  const handleOpenDialog = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor)
      // Remove "Dr. " prefix when editing
      const nameWithoutPrefix = doctor.name.replace(/^Dr\.\s*/i, '')
      setFormData({ 
        name: nameWithoutPrefix, 
        specialization: doctor.specialization,
        morning: doctor.morning ?? true,
        afternoon: doctor.afternoon ?? true
      })
    } else {
      setEditingDoctor(null)
      setFormData({ name: '', specialization: '', morning: true, afternoon: true })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingDoctor(null)
    setFormData({ name: '', specialization: '', morning: true, afternoon: true })
    setMessage({ type: '', text: '' })
  }

  const handleSaveDoctor = async () => {
    const trimmedName = formData.name.trim()

    if (!trimmedName || !formData.specialization) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    // Check if name is just spaces or empty
    if (trimmedName.length === 0) {
      setMessage({ type: 'error', text: 'Doctor name cannot be empty' })
      return
    }

    // Validation: Check availability based on whether we're creating or editing
    if (editingDoctor) {
      // EDITING: Check OTHER doctors' availability
      const otherDoctors = doctors.filter(d => d.id !== editingDoctor.id)
      
      // Count other doctors available for each session
      const morningCount = otherDoctors.filter(d => d.morning === true).length
      const afternoonCount = otherDoctors.filter(d => d.afternoon === true).length
      
      // Validate morning availability
      if (!formData.morning && morningCount === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Cannot disable morning availability. At least one doctor must be available for morning sessions.' 
        })
        return
      }
      
      // Validate afternoon availability
      if (!formData.afternoon && afternoonCount === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Cannot disable afternoon availability. At least one doctor must be available for afternoon sessions.' 
        })
        return
      }
    } else {
      // CREATING: Check if this is the first doctor or if sessions will have coverage
      if (doctors.length === 0) {
        // First doctor must have both sessions available
        if (!formData.morning || !formData.afternoon) {
          setMessage({ 
            type: 'error', 
            text: 'The first doctor must be available for both morning and afternoon sessions.' 
          })
          return
        }
      } else {
        // Check if at least one session will have coverage after adding this doctor
        const morningCount = doctors.filter(d => d.morning === true).length
        const afternoonCount = doctors.filter(d => d.afternoon === true).length
        
        // If no morning availability after adding this doctor
        if (!formData.morning && morningCount === 0) {
          setMessage({ 
            type: 'error', 
            text: 'At least one doctor must be available for morning sessions. Please enable morning availability.' 
          })
          return
        }
        
        // If no afternoon availability after adding this doctor
        if (!formData.afternoon && afternoonCount === 0) {
          setMessage({ 
            type: 'error', 
            text: 'At least one doctor must be available for afternoon sessions. Please enable afternoon availability.' 
          })
          return
        }
      }
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const doctorData = {
        name: `Dr. ${formData.name.trim()}`,  // Add "Dr." prefix here
        specialization: formData.specialization,
        clinicId: selectedClinic.id,
        morning: formData.morning,
        afternoon: formData.afternoon
      }

      if (editingDoctor) {
        await authFetch(`/api/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          body: JSON.stringify(doctorData)
        })
        setMessage({ type: 'success', text: 'Doctor updated successfully' })
      } else {
        await authFetch('/api/doctors', {
          method: 'POST',
          body: JSON.stringify(doctorData)
        })
        setMessage({ type: 'success', text: 'Doctor added successfully' })
      }
      
      handleCloseDialog()
      await loadDoctors()
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Save doctor error:', error)
      
      // Handle 401 specifically
      if (error.status === 401) {
        setMessage({ 
          type: 'error', 
          text: 'Authentication failed. Your session may have expired. Please log out and log in again.' 
        })
      } else {
        // Try to parse error response for backend validation messages
        try {
          const errorData = await error.response?.json()
          if (errorData?.message) {
            setMessage({ type: 'error', text: errorData.message })
          } else {
            setMessage({ type: 'error', text: error.message || 'Failed to save doctor' })
          }
        } catch {
          setMessage({ type: 'error', text: error.message || 'Failed to save doctor' })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDoctor = async (doctorId) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return

    try {
      await authFetch(`/api/doctors/${doctorId}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: 'Doctor deleted successfully' })
      loadDoctors()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete doctor' })
    }
  }

  if (!selectedClinic) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Please select a clinic first</Typography>
      </Paper>
    )
  }

  return (
    <Box>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {doctors.length === 0 && !loading && (
        <WarningBanner
          title="No doctors available"
          message='This clinic has no doctors. Use the "Add Doctor" button below to get started.'
        />
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Doctors for {selectedClinic.name}
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            sx={{ 
              backgroundColor: '#2563EB',
              color: 'white',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: '#1D4ED8'
              }
            }}
          >
            Add Doctor
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </Box>
        ) : doctors.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography>No doctors added yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
          <Table
            sx={{
              '& .MuiTableRow-root:hover': {
                backgroundColor: 'action.hover'
              },
              '& .MuiTableRow-root:not(:last-of-type) td': {
                borderBottom: '1px solid',
                borderColor: 'divider'
              }
            }}
          >
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell align="center">Morning</TableCell>
                  <TableCell align="center">Afternoon</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell align="center">
                      {doctor.morning ? (
                        <CheckCircleRoundedIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <CancelRoundedIcon sx={{ color: 'text.disabled' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {doctor.afternoon ? (
                        <CheckCircleRoundedIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <CancelRoundedIcon sx={{ color: 'text.disabled' }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(doctor)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteDoctor(doctor.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Doctor Name *
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, minWidth: '35px' }}>
                  Dr.
                </Typography>
                <TextField
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  error={!formData.name.trim() && formData.name !== ''}
                  helperText={!formData.name.trim() && formData.name !== '' ? 'Name cannot be empty' : ''}
                />
              </Box>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Specialization *</InputLabel>
              <Select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                label="Specialization *"
              >
                {specializations.map((spec) => (
                  <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Clinic"
              value={selectedClinic.name}
              disabled
              helperText="Doctor will be assigned to the selected clinic"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Availability
              </Typography>
              {(() => {
                // Calculate if checkboxes should be disabled
                const isFirstDoctor = !editingDoctor && doctors.length === 0
                const otherDoctors = editingDoctor ? doctors.filter(d => d.id !== editingDoctor.id) : doctors
                const morningCount = otherDoctors.filter(d => d.morning === true).length
                const afternoonCount = otherDoctors.filter(d => d.afternoon === true).length
                
                // When editing: can uncheck if other doctors have that session available
                // When creating: can uncheck if existing doctors have that session available
                const canUncheckMorning = morningCount > 0
                const canUncheckAfternoon = afternoonCount > 0
                
                // Disable unchecking if:
                // - First doctor: both must be checked
                // - Otherwise: can't uncheck if no other doctors have that session
                const disableMorningUncheck = isFirstDoctor || (!canUncheckMorning && formData.morning)
                const disableAfternoonUncheck = isFirstDoctor || (!canUncheckAfternoon && formData.afternoon)
                
                return (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.morning}
                          onChange={(e) => setFormData({ ...formData, morning: e.target.checked })}
                          disabled={disableMorningUncheck}
                        />
                      }
                      label="Morning Session Available"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.afternoon}
                          onChange={(e) => setFormData({ ...formData, afternoon: e.target.checked })}
                          disabled={disableAfternoonUncheck}
                        />
                      }
                      label="Afternoon Session Available"
                    />
                    {isFirstDoctor && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: 4 }}>
                        The first doctor must be available for both sessions.
                      </Typography>
                    )}
                    {editingDoctor && (morningCount === 0 || afternoonCount === 0) && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: 4 }}>
                        Note: {morningCount === 0 && "Morning"}{morningCount === 0 && afternoonCount === 0 && " and "}{afternoonCount === 0 && "Afternoon"} session availability cannot be disabled. At least one doctor must remain available.
                      </Typography>
                    )}
                    {!editingDoctor && doctors.length > 0 && (morningCount === 0 || afternoonCount === 0) && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: 4 }}>
                        Note: {morningCount === 0 && "Morning"}{morningCount === 0 && afternoonCount === 0 && " and "}{afternoonCount === 0 && "Afternoon"} session availability must be enabled to ensure coverage.
                      </Typography>
                    )}
                  </>
                )
              })()}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleSaveDoctor} 
            variant="contained"
            disabled={!formData.name || !formData.specialization || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {editingDoctor ? 'Update' : 'Add'} Doctor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
