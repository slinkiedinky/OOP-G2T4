'use client'

import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, Paper, Alert, Button, Select, MenuItem, Chip, Table, TableHead, TableRow, TableCell, TableBody, ToggleButtonGroup, ToggleButton, Stack, Divider } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { authFetch } from '../../../lib/api'
import WarningBanner from '../../../components/WarningBanner'

/**
 * AppointmentsTab — displays appointment slots for the selected clinic and
 * allows assigning doctors to slots, deleting slots, and filtering by availability.
 *
 * Props:
 * - selectedClinic: the clinic object to display slots for
 * - setActiveTab: (index) => void to switch parent tab
 * - onOpenAddDoctor: () => void callback to open add-doctor dialog
 * - isLocked: boolean to render a locked placeholder
 * - lockReason: optional string explaining why the view is locked
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function AppointmentsTab({ selectedClinic, setActiveTab, onOpenAddDoctor, isLocked = false, lockReason }) {
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

  function addDays(date, delta) {
    const next = new Date(date)
    next.setDate(next.getDate() + delta)
    return next
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

  if (isLocked) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {lockReason || 'Complete earlier steps first'}
        </Typography>
        <Typography color="text.secondary">
          Finish configuring the clinic schedule and generating slots to access this view.
        </Typography>
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
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center'
        }}
        elevation={0}
        variant="outlined"
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems="center"
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          >
            Previous
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ChevronRightIcon />}
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            Next
          </Button>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

        <Typography
          variant="subtitle1"
          sx={{ flexGrow: 1, minWidth: 200 }}
        >
          {dayLabel}
        </Typography>

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(e, v) => v && setFilter(v)}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="available">Available</ToggleButton>
          <ToggleButton value="booked">Booked</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      <Box sx={{ width: '100%', maxWidth: 960 }}>
        <Paper sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
          ) : (
            <Table size="small">
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
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5 }}>{fmt12(slot.startTime)} - {fmt12(slot.endTime)}</TableCell>
                      <TableCell sx={{ minWidth: 200, px: 1.5 }}>
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
                      </TableCell>
                      <TableCell sx={{ minWidth: 180, px: 1.5 }}>
                        {slot.patientId ? (
                          <Box>
                            <Typography fontWeight={600}>{slot.patientName || `Patient #${slot.patientId}`}</Typography>
                            <Typography variant="body2" color="text.secondary">ID: {slot.patientId}</Typography>
                          </Box>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell sx={{ px: 1.5 }}>
                        <Chip
                          label={slot.patientId ? 'BOOKED' : 'AVAILABLE'}
                          size="small"
                          sx={{
                            bgcolor: slot.patientId ? '#3b82f6' : '#10b981',
                            color: '#fff'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ px: 1.5 }}>
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
    </Box>
  )
}
