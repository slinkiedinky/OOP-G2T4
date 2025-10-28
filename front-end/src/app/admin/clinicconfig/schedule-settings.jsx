'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert, FormGroup, FormControlLabel, Checkbox, Divider } from '@mui/material'
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
  const [morningStart, setMorningStart] = useState('09:00')
  const [morningEnd, setMorningEnd] = useState('12:00')
  const [afternoonStart, setAfternoonStart] = useState('14:00')
  const [afternoonEnd, setAfternoonEnd] = useState('17:00')
  const [workingDays, setWorkingDays] = useState({
    MONDAY: true,
    TUESDAY: true,
    WEDNESDAY: true,
    THURSDAY: true,
    FRIDAY: true,
    SATURDAY: false,
    SUNDAY: false
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
  const [exceptionDates, setExceptionDates] = useState([])
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false)
  const [newExceptionDate, setNewExceptionDate] = useState('')
  const [newExceptionReason, setNewExceptionReason] = useState('')

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
      // Save default interval on clinic
      await authFetch('/api/appointment-slots/update-interval', {
        method: 'PUT',
        body: JSON.stringify({ clinicId: selectedClinic.id, intervalMinutes: interval })
      })
      // Settings saved successfully
      setStatus('Settings saved successfully')
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

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      if (!daySchedule || !daySchedule.open || !daySchedule.close) {
        console.log(`Skipping ${dayOfWeek} (${date.toDateString()}) - no schedule or closed`)
        continue
      }

      // Check if this date is an exception date (clinic closed)
      const isExceptionDate = exceptionDates.some(ed => ed.date === dateStr)
      if (isExceptionDate) {
        console.log(`Skipping ${dateStr} - exception date (clinic closed)`)
        continue
      }

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
      
      console.log('=== CHECKING FOR EXISTING SLOTS ===')
      console.log('Check URL:', checkUrl)
      console.log('Start date:', startFormatted)
      console.log('End date:', endFormatted)
      
      try {
        const checkResponse = await authFetch(checkUrl)
        console.log('Check response status:', checkResponse.status)
        const existingDates = await checkResponse.json()
        console.log('Existing dates found:', existingDates)
        
        if (existingDates.length > 0) {
          console.log('⚠️ CONFLICT DETECTED - Showing dialog')
          console.log('Conflict dates:', existingDates)
          // Show conflict dialog
          setConflictDates(existingDates)
          setShowConflictDialog(true)
          setGenerating(false)
          return
        } else {
          console.log('✅ No conflicts found - proceeding with generation')
        }
      } catch (error) {
        console.error('Error checking for existing slots:', error)
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

  const handleAddException = () => {
    if (!newExceptionDate) return
    setExceptionDates([...exceptionDates, { 
      date: newExceptionDate, 
      reason: newExceptionReason || 'Closed' 
    }])
    setNewExceptionDate('')
    setNewExceptionReason('')
    setShowAddExceptionModal(false)
  }

  const removeExceptionDate = (index) => {
    setExceptionDates(exceptionDates.filter((_, i) => i !== index))
  }

  const handleDayToggle = (day, checked) => {
    setWorkingDays(prev => ({
      ...prev,
      [day]: checked
    }))
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

      <Paper sx={{ p: '24px' }}>
        {/* Default Settings Section */}
        <Typography variant="h6" sx={{ mb: '16px', fontWeight: 500 }}>
          Default Settings
        </Typography>
        
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
          sx={{ mb: 3 }}
        />
        
        {/* Morning Session */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: '12px', fontWeight: 500 }}>
            Morning Session
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <TextField
              type="time"
              value={morningStart}
              onChange={(e) => setMorningStart(e.target.value)}
              size="small"
              sx={{ width: '140px' }}
            />
            <Typography variant="h6" sx={{ color: '#666' }}>—</Typography>
            <TextField
              type="time"
              value={morningEnd}
              onChange={(e) => setMorningEnd(e.target.value)}
              size="small"
              sx={{ width: '140px' }}
            />
          </Box>
        </Box>

        {/* Afternoon Session */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: '12px', fontWeight: 500 }}>
            Afternoon Session
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <TextField
              type="time"
              value={afternoonStart}
              onChange={(e) => setAfternoonStart(e.target.value)}
              size="small"
              sx={{ width: '140px' }}
            />
            <Typography variant="h6" sx={{ color: '#666' }}>—</Typography>
            <TextField
              type="time"
              value={afternoonEnd}
              onChange={(e) => setAfternoonEnd(e.target.value)}
              size="small"
              sx={{ width: '140px' }}
            />
          </Box>
        </Box>
        
        {/* Date Range */}
        <Box sx={{ mb: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker label="Start Date" value={startDate} onChange={setStartDate} sx={{ flex: 1 }} />
              <DatePicker label="End Date" value={endDate} onChange={setEndDate} sx={{ flex: 1 }} />
            </Box>
          </LocalizationProvider>
        </Box>

        <Divider sx={{ my: '32px' }} />

        {/* Working Days Section */}
        <Typography variant="h6" sx={{ mb: '8px', fontWeight: 500 }}>
          Working Days
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: '12px' }}>
          Select which days the clinic is open
        </Typography>
        
        <FormGroup row>
          <FormControlLabel
            control={<Checkbox checked={workingDays.MONDAY} onChange={(e) => handleDayToggle('MONDAY', e.target.checked)} />}
            label="Monday"
          />
          <FormControlLabel
            control={<Checkbox checked={workingDays.TUESDAY} onChange={(e) => handleDayToggle('TUESDAY', e.target.checked)} />}
            label="Tuesday"
          />
          <FormControlLabel
            control={<Checkbox checked={workingDays.WEDNESDAY} onChange={(e) => handleDayToggle('WEDNESDAY', e.target.checked)} />}
            label="Wednesday"
          />
          <FormControlLabel
            control={<Checkbox checked={workingDays.THURSDAY} onChange={(e) => handleDayToggle('THURSDAY', e.target.checked)} />}
            label="Thursday"
          />
          <FormControlLabel
            control={<Checkbox checked={workingDays.FRIDAY} onChange={(e) => handleDayToggle('FRIDAY', e.target.checked)} />}
            label="Friday"
          />
          <FormControlLabel
            control={<Checkbox checked={workingDays.SATURDAY} onChange={(e) => handleDayToggle('SATURDAY', e.target.checked)} />}
            label="Saturday"
          />
          <FormControlLabel
            control={<Checkbox checked={workingDays.SUNDAY} onChange={(e) => handleDayToggle('SUNDAY', e.target.checked)} />}
            label="Sunday"
          />
        </FormGroup>

        <Divider sx={{ my: '32px' }} />

        {/* Exception Dates Section */}
        <Typography variant="h6" sx={{ mb: '8px', fontWeight: 500 }}>
          Exception Dates (Clinic Closed)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: '16px' }}>
          Add specific dates when the clinic will be closed
        </Typography>
        
        {exceptionDates.length === 0 && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No exception dates added. Clinic will follow the weekly schedule above.
          </Typography>
        )}

        {exceptionDates.map((item, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            padding: 2,
            marginBottom: 1,
            border: '1px solid #ddd',
            borderRadius: 1
          }}>
            <Typography sx={{ fontWeight: 'bold' }}>{item.date}</Typography>
            <Typography color="text.secondary">{item.reason}</Typography>
            <Button 
              size="small" 
              color="error" 
              onClick={() => removeExceptionDate(index)}
            >
              Remove
            </Button>
          </Box>
        ))}
        
        <Button 
          variant="outlined" 
          onClick={() => setShowAddExceptionModal(true)}
          sx={{ mt: 2 }}
        >
          + Add Exception Date
        </Button>
      </Paper>

      <Dialog open={showAddExceptionModal} onClose={() => setShowAddExceptionModal(false)}>
        <DialogTitle>Add Exception Date</DialogTitle>
        <DialogContent>
          <TextField
            type="date"
            label="Date"
            value={newExceptionDate}
            onChange={(e) => setNewExceptionDate(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Reason"
            value={newExceptionReason}
            onChange={(e) => setNewExceptionReason(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder="e.g. Closed, Holiday, Maintenance"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddExceptionModal(false)}>Cancel</Button>
          <Button onClick={handleAddException} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

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

      {/* Action Buttons at the bottom */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4, mb: 4, justifyContent: 'center' }}>
        <Button variant="contained" color="primary" onClick={handleSaveSettings} disabled={saving} size="large">
          {saving ? 'Saving...' : 'SAVE SETTINGS'}
        </Button>
        <Button variant="outlined" onClick={handleGenerateSlots} disabled={generating} size="large">
          {generating ? 'Generating Slots...' : 'GENERATE SLOTS'}
        </Button>
      </Box>
    </Box>
  )
}
