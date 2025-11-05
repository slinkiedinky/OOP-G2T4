'use client'

import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, Paper, Alert, Button, Select, MenuItem, Chip, Table, TableHead, TableRow, TableCell, TableBody, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { authFetch } from '../../../lib/api'
import WarningBanner from '../../../components/WarningBanner'

export default function AppointmentsTab({ selectedClinic, setActiveTab, onOpenAddDoctor }) {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [filter, setFilter] = useState('all') // all | available | booked

  useEffect(() => {
    if (selectedClinic) {
      loadDoctors()
      loadAppointmentsForDay(selectedDate)
    }
  }, [selectedClinic, selectedDate])

  function toLocalIso(dt) {
    const pad = (n) => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
  }

  async function loadAppointmentsForDay(date) {
    if (!selectedClinic) return
    setLoading(true)
    setError(null)
    try {
      const start = new Date(date); start.setHours(0,0,0,0)
      const end = new Date(date); end.setHours(23,59,59,999)
      const res = await authFetch(`/api/appointment-slots/clinic/${selectedClinic.id}/slots?startTime=${toLocalIso(start)}&endTime=${toLocalIso(end)}`)
      if (!res.ok) {
        const text = await res.text()
        console.error('API Error (slots):', text)
        setAppointments([])
        setError(`Failed to load slots (${res.status})`)
        return
      }
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadDoctors() {
    try {
      const res = await authFetch(`/api/clinics/${selectedClinic.id}/doctors`)
      const data = await res.json()
      setDoctors(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load doctors:', err)
      setDoctors([])
    }
  }

  async function handleAssignDoctor(slotId, doctorId) {
    try {
      setError(null)
      await authFetch(`/api/appointment-slots/${slotId}/assign-doctor`, {
        method: 'PUT',
        body: JSON.stringify({ doctorId: doctorId || null })
      })
      // refresh the day
      await loadAppointmentsForDay(selectedDate)
    } catch (err) {
      setError(err.message || 'Failed to assign doctor')
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }
  }

  // Get available doctors for a specific time slot based on morning/afternoon
  function getAvailableDoctorsForSlot(slot) {
    if (!slot || !slot.startTime) return doctors
    
    const slotTime = new Date(slot.startTime)
    const hour = slotTime.getHours()
    const isMorning = hour < 12
    
    return doctors.filter(doctor => {
      if (isMorning) {
        return doctor.morning === true
      } else {
        return doctor.afternoon === true
      }
    })
  }

  async function deleteAppointment(slotId) {
    if (!confirm('Delete this appointment slot?')) return
    try {
      await authFetch(`/api/appointments/${slotId}`, { method: 'DELETE' })
      loadAppointmentsForDay(selectedDate)
    } catch (err) {
      setError(err.message)
    }
  }

  function fmt12(dtStr) {
    const d = new Date(dtStr)
    let h = d.getHours(); const m = d.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12; if (h === 0) h = 12
    const mm = String(m).padStart(2, '0')
    const hh = String(h).padStart(2, '0')
    return `${hh}:${mm} ${ampm}`
  }

  const filtered = useMemo(() => {
    let result = appointments
    
    // Sort by start time first, then by doctor name
    result = [...appointments].sort((a, b) => {
      const timeA = new Date(a.startTime).getTime()
      const timeB = new Date(b.startTime).getTime()
      
      // Compare by start time first
      if (timeA !== timeB) {
        return timeA - timeB
      }
      
      // If same time, sort by doctor name
      const doctorNameA = a.doctorName || ''
      const doctorNameB = b.doctorName || ''
      return doctorNameA.localeCompare(doctorNameB)
    })
    
    // Apply filter
    if (filter === 'available') return result.filter(a => !a.patientId)
    if (filter === 'booked') return result.filter(a => !!a.patientId)
    return result
  }, [appointments, filter])

  if (!selectedClinic) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Please select a clinic first</Typography>
      </Paper>
    )
  }

  const dayLabel = selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      
      {doctors.length === 0 && !loading && (
        <WarningBanner
          title="No doctors available"
          message="This clinic has no doctors. Add at least one doctor before you can assign appointments."
          actionText="Add Doctor"
          onAction={() => {
            if (onOpenAddDoctor) {
              onOpenAddDoctor()
            } else if (setActiveTab) {
              setActiveTab(0)
            }
          }}
        />
      )}

      {/* Date navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}>{'< Previous Day'}</Button>
        <Button variant="outlined" onClick={() => setSelectedDate(new Date())}>Today</Button>
        <Button variant="outlined" onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}>{'Next Day >'}</Button>
        <Typography sx={{ ml: 2 }}>Selected: {dayLabel}</Typography>
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(e, v) => v && setFilter(v)}
          size="small"
        >
          <ToggleButton value="all">All Slots</ToggleButton>
          <ToggleButton value="available">Available Only</ToggleButton>
          <ToggleButton value="booked">Booked Only</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5}><Typography>No appointment slots for this day</Typography></TableCell></TableRow>
              ) : (
                filtered.map(slot => {
                  const availableDoctors = getAvailableDoctorsForSlot(slot)
                  const currentDoctor = doctors.find(d => d.id === slot.doctorId)
                  
                  return (
                    <TableRow key={slot.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt12(slot.startTime)} - {fmt12(slot.endTime)}</TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Select
                          size="small"
                          fullWidth
                          displayEmpty
                          value={slot.doctorId || ''}
                          onChange={(e) => handleAssignDoctor(slot.id, e.target.value || null)}
                        >
                          <MenuItem value="">
                            {availableDoctors.length ? 'Select Doctor' : 'No doctors available for this time'}
                          </MenuItem>
                          {availableDoctors.map(d => (
                            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                          ))}
                          {/* Show current doctor even if not in available list (edge case) */}
                          {slot.doctorId && currentDoctor && !availableDoctors.find(d => d.id === slot.doctorId) && (
                            <MenuItem value={slot.doctorId} disabled>
                              {currentDoctor.name} (Not available for this time)
                            </MenuItem>
                          )}
                        </Select>
                        {slot.doctorName && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {slot.doctorName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{slot.patientId ? `ID: ${slot.patientId}` : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={slot.patientId ? 'BOOKED' : 'AVAILABLE'}
                          size="small"
                          sx={{
                            bgcolor: slot.patientId ? '#3b82f6' : '#10b981',
                            color: '#fff'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button color="error" size="small" onClick={() => deleteAppointment(slot.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  )
}
