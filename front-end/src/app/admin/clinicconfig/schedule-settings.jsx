'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { authFetch } from '../../../lib/api'

export default function ScheduleSettings({ selectedClinic }) {
  const [interval, setInterval] = useState(15)
  const [slotDuration, setSlotDuration] = useState(30)
  const [workingHours, setWorkingHours] = useState({
    'MONDAY': { open: '09:00', close: '17:00', interval: 15 },
    'TUESDAY': { open: '09:00', close: '17:00', interval: 15 },
    'WEDNESDAY': { open: '09:00', close: '17:00', interval: 15 },
    'THURSDAY': { open: '09:00', close: '17:00', interval: 15 },
    'FRIDAY': { open: '09:00', close: '17:00', interval: 15 },
    'SATURDAY': { open: '09:00', close: '13:00', interval: 15 },
    'SUNDAY': { open: '09:00', close: '13:00', interval: 15 },
  })
  const [startDate, setStartDate] = useState(dayjs())
  const [endDate, setEndDate] = useState(dayjs().add(7, 'day'))
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState('')
  const [hasDoctors, setHasDoctors] = useState(false)
  const [openDoctorDialog, setOpenDoctorDialog] = useState(false)
  const [newDoctor, setNewDoctor] = useState({ name: '', specialization: '' })
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictDates, setConflictDates] = useState([])

  useEffect(() => {
    checkDoctors()
  }, [selectedClinic])

  async function checkDoctors() {
    if (!selectedClinic) return
    try {
      const res = await authFetch(`/api/clinic-management/${selectedClinic.id}/doctors`)
      const doctors = await res.json()
      setHasDoctors(Array.isArray(doctors) && doctors.length > 0)
    } catch (e) {
      console.error('Failed to check doctors:', e)
      setHasDoctors(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!selectedClinic) return
    setSaving(true)
    try {
      if (!hasDoctors) {
        setStatus('Cannot generate slots: No doctors in this clinic. Please add a doctor first.')
        setSaving(false)
        return
      }
      // Save default interval on clinic
      await authFetch('/api/appointment-slots/update-interval', {
        method: 'PUT',
        body: JSON.stringify({ clinicId: selectedClinic.id, intervalMinutes: interval })
      })
      // After saving, auto-generate slots for the chosen range
      await handleGenerateSlots()
      setStatus('Settings saved and appointment slots generated')
    } catch (e) {
      setStatus(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toLocalIso = (d) => {
    const pad = (n) => String(n).padStart(2, '0')
    const dt = new Date(d)
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
  }

  const generateAllSlots = async () => {
    console.log('=== GENERATE ALL SLOTS ===')
    console.log('selectedClinic:', selectedClinic)
    console.log('startDate:', startDate)
    console.log('endDate:', endDate)
    console.log('weeklySchedule:', workingHours)
    console.log('defaultInterval:', interval)
    console.log('defaultSlotDuration:', slotDuration)
    
    const start = new Date(startDate)
    const end = new Date(endDate)

    const dates = []
    const currentDate = new Date(start)
    while (currentDate <= end) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log(`Generating slots for ${dates.length} days from ${start.toDateString()} to ${end.toDateString()}`)
    console.log('Weekly schedule:', workingHours)

    const formatTime = (timeStr) => {
      if (!timeStr) return null
      // Accept H:MM, HH:MM or HH:MM:SS and normalize
      const m = String(timeStr).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
      if (m) {
        const hh = String(parseInt(m[1], 10)).padStart(2, '0')
        const mm = m[2]
        const ss = m[3]
        return ss ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`
      }
      // Unknown format; send as-is so backend logs reveal the value
      return String(timeStr)
    }

    const promises = []
    for (const date of dates) {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      const daySchedule = workingHours[dayOfWeek]

      if (!daySchedule || !daySchedule.open || !daySchedule.close) {
        console.log(`Skipping ${dayOfWeek} (${date.toDateString()}) - no schedule or closed`)
        continue
      }

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      const requestBody = {
        clinicId: selectedClinic.id,
        date: dateStr,
        interval: parseInt(daySchedule.interval || interval, 10),
        slotDuration: parseInt(slotDuration, 10),
        openTime: formatTime(daySchedule.open),
        closeTime: formatTime(daySchedule.close)
      }

      console.log(`REQUEST for ${dayOfWeek} ${dateStr}:`, JSON.stringify(requestBody, null, 2))

      promises.push(
        authFetch('/api/appointment-slots/generate', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }).then(async res => {
          if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`Failed for ${dateStr}: ${errorText}`)
          }
          return res.json()
        })
      )
    }

    if (promises.length === 0) {
      setStatus('No days with valid schedules found. Please check your weekly schedule settings.')
      return
    }

    console.log(`Sending ${promises.length} requests...`)
    const results = await Promise.allSettled(promises)

    const successful = results.filter(r => r.status === 'fulfilled')
    const failures = results.filter(r => r.status === 'rejected')

    const totalSlots = successful.reduce((sum, result) => {
      return sum + (result.value?.length || 0)
    }, 0)

    if (failures.length > 0) {
      console.error('Some slots failed to generate:', failures)
      setStatus(
        `Generated ${totalSlots} slots across ${successful.length} days. ` +
        `${failures.length} days failed. Check console for details.`
      )
    } else {
      setStatus(`Success! Generated ${totalSlots} slots across ${successful.length} days.`)
    }
  }

  const handleGenerateSlots = async () => {
    setGenerating(true)
    setStatus('')

    try {
      console.log('=== WEEKLY SCHEDULE ===')
      console.log(JSON.stringify(workingHours, null, 2))
      if (!selectedClinic) {
        setStatus('Please select a clinic first')
        setGenerating(false)
        return
      }

      if (!startDate || !endDate) {
        setStatus('Please select start and end dates')
        setGenerating(false)
        return
      }

      if (!interval || !slotDuration) {
        setStatus('Please set default interval and slot duration')
        setGenerating(false)
        return
      }

      // Check for existing slots
      const startFormatted = startDate.format('YYYY-MM-DD')
      const endFormatted = endDate.format('YYYY-MM-DD')
      const checkUrl = `/api/appointment-slots/check-existing?clinicId=${selectedClinic.id}&startDate=${startFormatted}&endDate=${endFormatted}`
      
      try {
        const checkResponse = await authFetch(checkUrl)
        const existingDates = await checkResponse.json()
        
        if (existingDates.length > 0) {
          // Show conflict dialog
          setConflictDates(existingDates)
          setShowConflictDialog(true)
          setGenerating(false)
          return
        }
      } catch (error) {
        console.warn('Error checking for existing slots:', error)
        // Continue with generation if check fails
      }

      // No conflicts, generate normally
      await generateAllSlots()

    } catch (error) {
      console.error('Generate slots error:', error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateDoctor = async () => {
    if (!newDoctor.name || !newDoctor.specialization) {
      setStatus('Please fill in doctor name and specialization')
      return
    }
    setOpenDoctorDialog(false)
    try {
      await authFetch('/api/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: newDoctor.name,
          specialization: newDoctor.specialization,
          clinicId: selectedClinic.id
        })
      })
      setStatus('Doctor created successfully. You can now generate appointment slots.')
      setNewDoctor({ name: '', specialization: '' })
      await checkDoctors()
    } catch (e) {
      setStatus(e.message || 'Failed to create doctor')
    }
  }

  const handleReplaceAll = async () => {
    setShowConflictDialog(false)
    setGenerating(true)
    
    try {
      console.log('Deleting existing slots for dates:', conflictDates)
      
      // Delete existing slots first
      const deleteResponse = await authFetch(
        `/api/appointment-slots/delete-by-dates?clinicId=${selectedClinic.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conflictDates)
        }
      )
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to delete existing slots')
      }
      
      console.log('Existing slots deleted. Now generating fresh slots...')
      
      // Now generate fresh slots for all dates
      await generateAllSlots()
      
      alert('Successfully replaced all slots!')
      
    } catch (error) {
      console.error('Replace all error:', error)
      setError(error.message)
    } finally {
      setGenerating(false)
    }
  }
  
  const handleKeepExisting = async () => {
    setShowConflictDialog(false)
    setGenerating(true)
    
    try {
      // Build list of dates to generate (excluding conflicts)
      const datesToGenerate = []
      let currentDate = new Date(startDate)
      const end = new Date(endDate)
      
      while (currentDate <= end) {
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // Only add if NOT in conflictDates
        if (!conflictDates.includes(dateStr)) {
          datesToGenerate.push({ date: new Date(currentDate), dateStr })
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      console.log(`Generating slots for ${datesToGenerate.length} new days (keeping ${conflictDates.length} existing)`)
      
      // Generate slots only for new dates
      const promises = []
      for (const { date, dateStr } of datesToGenerate) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
        const daySchedule = weeklySchedule[dayOfWeek]
        
        if (!daySchedule || !daySchedule.open || !daySchedule.close) {
          console.log(`Skipping ${dateStr} - no schedule`)
          continue
        }
        
        const requestBody = {
          clinicId: selectedClinic.id,
          date: dateStr,
          interval: daySchedule.interval || defaultInterval,
          slotDuration: defaultSlotDuration,
          openTime: daySchedule.open,
          closeTime: daySchedule.close
        }
        
        promises.push(
          authFetch('/api/appointment-slots/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }).then(async res => {
            if (!res.ok) throw new Error(`Failed for ${dateStr}`)
            return res.json()
          })
        )
      }
      
      if (promises.length === 0) {
        alert('No new dates to generate slots for.')
        setGenerating(false)
        return
      }
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled')
      const failures = results.filter(r => r.status === 'rejected')
      
      const totalSlots = successful.reduce((sum, result) => sum + (result.value?.length || 0), 0)
      
      if (failures.length > 0) {
        setError(`Generated ${totalSlots} new slots. ${failures.length} days failed.`)
      } else {
        alert(`Success! Generated ${totalSlots} new slots. Kept ${conflictDates.length} existing days unchanged.`)
      }
      
    } catch (error) {
      console.error('Keep existing error:', error)
      setError(error.message)
    } finally {
      setGenerating(false)
      setConflictDates([])
    }
  }
  
  const handleCancel = () => {
    setShowConflictDialog(false)
    setConflictDates([])
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
      {!hasDoctors && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This clinic has no doctors. <Button size="small" onClick={() => setOpenDoctorDialog(true)}>Create a doctor</Button>
        </Alert>
      )}

      {status && <Alert severity={status.includes('error') || status.includes('Failed') ? 'error' : 'info'} sx={{ mb: 2 }}>{status}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Default Settings</Typography>
            <TextField
              fullWidth
              label="Default Interval (minutes)"
              type="number"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Default Slot Duration (minutes)"
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value))}
              sx={{ mb: 2 }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Start Date" value={startDate} onChange={setStartDate} sx={{ mr: 2, width: '100%', mb: 2 }} />
              <DatePicker label="End Date" value={endDate} onChange={setEndDate} sx={{ width: '100%' }} />
            </LocalizationProvider>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" onClick={handleSaveSettings} disabled={saving}>Save Settings</Button>
              <Button variant="outlined" onClick={handleGenerateSlots} disabled={generating}>
              {generating ? 'Generating Slots...' : 'GENERATE SLOTS'}
            </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Open Time</TableCell>
                <TableCell>Close Time</TableCell>
                <TableCell>Interval (min)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                <TableRow key={day}>
                  <TableCell>{day}</TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      value={workingHours[day].open}
                      onChange={(e) => setWorkingHours({...workingHours, [day]: {...workingHours[day], open: e.target.value}})}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      value={workingHours[day].close}
                      onChange={(e) => setWorkingHours({...workingHours, [day]: {...workingHours[day], close: e.target.value}})}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={workingHours[day].interval}
                      onChange={(e) => setWorkingHours({...workingHours, [day]: {...workingHours[day], interval: parseInt(e.target.value)}})}
                      size="small"
                      inputProps={{ min: 5, max: 60, step: 5 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDoctorDialog} onClose={() => setOpenDoctorDialog(false)}>
        <DialogTitle>Create New Doctor</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Doctor Name"
              value={newDoctor.name}
              onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Specialization"
              value={newDoctor.specialization}
              onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDoctorDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDoctor} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {showConflictDialog && (
        <Dialog open={showConflictDialog} onClose={handleCancel}>
          <DialogTitle>⚠️ Existing Slots Found</DialogTitle>
          <DialogContent>
            <Typography>The following days already have appointment slots:</Typography>
            <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
              {conflictDates.map(date => (
                <li key={date}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </li>
              ))}
            </ul>
            <Typography sx={{ mt: 2, fontWeight: 'bold' }}>What would you like to do?</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleReplaceAll}
              variant="contained"
              color="error"
              disabled={generating}
            >
              Replace All
            </Button>
            <Button
              onClick={handleKeepExisting}
              variant="contained"
              color="primary"
              disabled={generating}
            >
              Keep Existing
            </Button>
            <Button
              onClick={handleCancel}
              variant="outlined"
              disabled={generating}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
