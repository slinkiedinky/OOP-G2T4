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
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
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
      setSuccessMessage('')
      setErrorMessage('')
      
      // Save default interval on clinic
      await authFetch('/api/appointment-slots/update-interval', {
        method: 'PUT',
        body: JSON.stringify({ clinicId: selectedClinic.id, intervalMinutes: interval })
      })
      
      setSuccessMessage('✅ Settings saved successfully!')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (e) {
      setErrorMessage('Failed to save settings: ' + e.message)
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
    try {
      // Build dates to generate
      const datesToGenerate = []
      let currentDate = new Date(startDate)
      const end = new Date(endDate)
      
      while (currentDate <= end) {
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // Filter 1: Check working days (USE workingDays STATE)
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { 
          weekday: 'long' 
        }).toUpperCase()
        
        if (!workingDays[dayOfWeek]) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }
        
        // Filter 2: Check exception dates
        const isException = exceptionDates.some(ed => ed.date === dateStr)
        if (isException) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }
        
        datesToGenerate.push(dateStr)
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // SEQUENTIAL PROCESSING - Two requests per day (morning + afternoon) with delays
      const results = []
      
      for (const dateStr of datesToGenerate) {
        // Morning session
        console.log(`=== GENERATING SLOTS FOR ${dateStr} ===`)
        console.log('Morning session:', { openTime: morningStart, closeTime: morningEnd })
        console.log('Afternoon session:', { openTime: afternoonStart, closeTime: afternoonEnd })
        
        try {
          const morningResponse = await authFetch('/api/appointment-slots/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinicId: selectedClinic.id,
              date: dateStr,
              interval: parseInt(interval, 10),
              slotDuration: parseInt(slotDuration, 10),
              openTime: morningStart,
              closeTime: morningEnd
            })
          })
          
          if (morningResponse.ok) {
            const morningSlots = await morningResponse.json()
            results.push({ status: 'fulfilled', value: morningSlots })
          } else {
            const errorText = await morningResponse.text()
            throw new Error(`Morning failed: ${errorText}`)
          }
        } catch (error) {
          console.error(`Morning session error for ${dateStr}:`, error)
          results.push({ status: 'rejected', reason: error })
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Afternoon session
        try {
          const afternoonResponse = await authFetch('/api/appointment-slots/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinicId: selectedClinic.id,
              date: dateStr,
              interval: parseInt(interval, 10),
              slotDuration: parseInt(slotDuration, 10),
              openTime: afternoonStart,
              closeTime: afternoonEnd
            })
          })
          
          if (afternoonResponse.ok) {
            const afternoonSlots = await afternoonResponse.json()
            results.push({ status: 'fulfilled', value: afternoonSlots })
          } else {
            const errorText = await afternoonResponse.text()
            throw new Error(`Afternoon failed: ${errorText}`)
          }
        } catch (error) {
          console.error(`Afternoon session error for ${dateStr}:`, error)
          results.push({ status: 'rejected', reason: error })
        }
        
        // Small delay between days
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Calculate results
      const successful = results.filter(r => r.status === 'fulfilled')
      const failures = results.filter(r => r.status === 'rejected')
      
      const totalSlots = successful.reduce((sum, result) => 
        sum + (result.value?.length || 0), 0
      )
      
      if (failures.length > 0) {
        console.error('Some slots failed to generate:', failures)
        setErrorMessage(`Generated ${totalSlots} slots, but ${failures.length} sessions failed.`)
      } else {
        setSuccessMessage(`✅ Successfully generated ${totalSlots} appointment slots!`)
        setTimeout(() => setSuccessMessage(''), 4000)
      }
      
    } catch (error) {
      console.error('Generation error:', error)
      setErrorMessage('Failed to generate slots: ' + error.message)
    }
  }

  const handleGenerateSlots = async () => {
    setGenerating(true)
    setStatus('')
    setSuccessMessage('')
    setErrorMessage('')

    try {
      if (!selectedClinic) {
        setErrorMessage('Please select a clinic first')
        setGenerating(false)
        return
      }

      if (!startDate || !endDate) {
        setErrorMessage('Please select start and end dates')
        setGenerating(false)
        return
      }

      if (!interval || !slotDuration) {
        setErrorMessage('Please set default interval and slot duration')
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
          setConflictDates(existingDates)
          setShowConflictDialog(true)
          setGenerating(false)
          return
        }
      } catch (error) {
        console.error('Error checking for existing slots:', error)
        // Continue with generation if check fails
      }

      // No conflicts, generate normally
      await generateAllSlots()

    } catch (error) {
      console.error('Generate slots error:', error)
      setErrorMessage('Failed to generate slots: ' + error.message)
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
      
      // Now generate fresh slots for all dates
      await generateAllSlots()
      
      setSuccessMessage('✅ Successfully replaced all slots!')
      setTimeout(() => setSuccessMessage(''), 4000)
      
    } catch (error) {
      console.error('Replace all error:', error)
      setErrorMessage(error.message)
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
      
      // Generate slots only for new dates using morning/afternoon sessions
      const requestFunctions = []
      for (const { date, dateStr } of datesToGenerate) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
        
        // Check if this is a working day
        if (!workingDays[dayOfWeek]) {
          continue
        }
        
        // Check if this date is an exception date
        const isException = exceptionDates.some(ed => ed.date === dateStr)
        if (isException) {
          continue
        }
        
        // Morning session - wrap in function
        requestFunctions.push(() =>
          authFetch('/api/appointment-slots/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinicId: selectedClinic.id,
              date: dateStr,
              interval: parseInt(interval, 10),
              slotDuration: parseInt(slotDuration, 10),
              openTime: morningStart,
              closeTime: morningEnd
            })
          }).then(async res => {
            if (!res.ok) throw new Error(`Morning session failed for ${dateStr}`)
            return res.json()
          }).catch(err => {
            console.error(`Morning session failed for ${dateStr}:`, err)
            throw err
          })
        )
        
        // Afternoon session - wrap in function
        requestFunctions.push(() =>
          authFetch('/api/appointment-slots/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinicId: selectedClinic.id,
              date: dateStr,
              interval: parseInt(interval, 10),
              slotDuration: parseInt(slotDuration, 10),
              openTime: afternoonStart,
              closeTime: afternoonEnd
            })
          }).then(async res => {
            if (!res.ok) throw new Error(`Afternoon session failed for ${dateStr}`)
            return res.json()
          }).catch(err => {
            console.error(`Afternoon session failed for ${dateStr}:`, err)
            throw err
          })
        )
      }
      
      if (requestFunctions.length === 0) {
        setErrorMessage('No new dates to generate slots for.')
        setGenerating(false)
        return
      }
      
      // Execute requests sequentially to avoid database conflicts
      const results = []
      
      for (let i = 0; i < requestFunctions.length; i++) {
        try {
          const result = await requestFunctions[i]()  // Execute one at a time
          results.push({ status: 'fulfilled', value: result })
        } catch (error) {
          results.push({ status: 'rejected', reason: error })
          console.error(`Request ${i + 1} failed:`, error)
        }
      }
      
      const successful = results.filter(r => r.status === 'fulfilled')
      const failures = results.filter(r => r.status === 'rejected')
      
      const totalSlots = successful.reduce((sum, result) => sum + (result.value?.length || 0), 0)
      
      if (failures.length > 0) {
        setErrorMessage(`Generated ${totalSlots} new slots. ${failures.length} sessions failed.`)
      } else {
        setSuccessMessage(`✅ Success! Generated ${totalSlots} new slots. Kept ${conflictDates.length} existing days unchanged.`)
        setTimeout(() => setSuccessMessage(''), 4000)
      }
      
    } catch (error) {
      console.error('Keep existing error:', error)
      setErrorMessage(error.message)
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

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage('')}
          style={{ marginTop: '32px', marginBottom: '16px' }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert 
          severity="error" 
          onClose={() => setErrorMessage('')}
          style={{ marginTop: '32px', marginBottom: '16px' }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Conflict Dialog */}
      <Dialog 
        open={showConflictDialog} 
        onClose={() => setShowConflictDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <span>Existing Slots Found</span>
          </div>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" paragraph>
            Appointment slots already exist for the following dates:
          </Typography>
          
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {conflictDates.map(date => (
              <div key={date} style={{ 
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📅</span>
                <span>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            ))}
          </div>
          
          <Typography variant="body2" color="textSecondary">
            What would you like to do?
          </Typography>
        </DialogContent>
        
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button 
            onClick={handleCancel}
            variant="outlined"
            disabled={generating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleKeepExisting}
            variant="outlined"
            color="primary"
            disabled={generating}
          >
            Keep Existing
          </Button>
          <Button 
            onClick={handleReplaceAll}
            variant="contained"
            color="error"
            disabled={generating}
          >
            Replace All
          </Button>
        </DialogActions>
      </Dialog>

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

