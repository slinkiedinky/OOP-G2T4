'use client'

import { useState, useEffect } from 'react'
import { 
  Box, Typography, Paper, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { authFetch } from '../../../lib/api'

export default function DoctorsTab({ selectedClinic }) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    specialization: '' 
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  const specializations = [
    'Family Medicine', 'General Practice', 'Internal Medicine',
    'Pediatrician', 'Cardiologist', 'Dermatologist',
    'Orthopedic Surgeon', 'Psychiatrist', 'Gynecologist',
    'Neurologist', 'Ophthalmologist', 'ENT Specialist',
    'Dentist', 'Oncologist', 'Emergency Medicine',
    'Sports Medicine', 'Advanced Cardiology', 'Other'
  ]

  useEffect(() => {
    if (selectedClinic) {
      loadDoctors()
    }
  }, [selectedClinic])

  const loadDoctors = async () => {
    if (!selectedClinic) return
    
    console.log('Loading doctors for clinic:', selectedClinic.id)
    setLoading(true)
    
    try {
      // Use the correct endpoint that's working in the backend
      const response = await authFetch(`/api/clinic-management/${selectedClinic.id}/doctors`)
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Doctors loaded:', data)
        setDoctors(data)
      } else {
        console.error('Failed to load doctors:', response.status)
        // Try alternative endpoint as fallback
        console.log('Trying alternative endpoint...')
        const altResponse = await authFetch(`/api/clinics/${selectedClinic.id}/doctors`)
        console.log('Alt response status:', altResponse.status)
        if (altResponse.ok) {
          const altData = await altResponse.json()
          console.log('Doctors loaded from alt endpoint:', altData)
          setDoctors(altData)
        }
      }
    } catch (error) {
      console.error('Error loading doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor)
      // Remove "Dr. " prefix when editing
      const nameWithoutPrefix = doctor.name.replace(/^Dr\.\s*/i, '')
      setFormData({ name: nameWithoutPrefix, specialization: doctor.specialization })
    } else {
      setEditingDoctor(null)
      setFormData({ name: '', specialization: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingDoctor(null)
    setFormData({ name: '', specialization: '' })
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

    try {
      const doctorData = {
        name: `Dr. ${formData.name.trim()}`,  // Add "Dr." prefix here
        specialization: formData.specialization,
        clinicId: selectedClinic.id
      }

      if (editingDoctor) {
        console.log('Updating doctor:', editingDoctor.id)
        await authFetch(`/api/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          body: JSON.stringify(doctorData)
        })
        setMessage({ type: 'success', text: 'Doctor updated successfully' })
      } else {
        console.log('Creating new doctor:', formData)
        const response = await authFetch('/api/doctors', {
          method: 'POST',
          body: JSON.stringify(doctorData)
        })
        
        console.log('Doctor created, response:', response.status)
        setMessage({ type: 'success', text: 'Doctor added successfully' })
      }
      
      handleCloseDialog()
      
      console.log('About to reload doctors...')
      await loadDoctors()  // Make sure this is called
      console.log('Doctors reloaded')
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Save doctor error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save doctor' })
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

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Doctors for {selectedClinic.name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Doctor
          </Button>
        </Box>

        {doctors.length === 0 ? (
          <Alert severity="info">
            No doctors added yet. Add at least one doctor to start assigning appointments.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveDoctor} 
            variant="contained"
            disabled={!formData.name || !formData.specialization}
          >
            {editingDoctor ? 'Update' : 'Add'} Doctor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
