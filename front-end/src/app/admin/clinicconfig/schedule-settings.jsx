'use client'

import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react'
import { Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert, FormGroup, FormControlLabel, Checkbox, Divider, Select, MenuItem, FormControl, InputLabel, Stack } from '@mui/material'
import WarningBanner from '../../../components/WarningBanner'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { authFetch } from '../../../lib/api'

const ScheduleSettings = forwardRef(function ScheduleSettings({
  selectedClinic,
  onOpenAddDoctor,
  onScheduleSaved,
  onScheduleUnsaved,
  onSlotsGenerated,
  settingsSaved: externalSettingsSaved = false,
  slotsGenerated: externalSlotsGenerated = false,
  isLocked = false
}, ref) {
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
  const [doctors, setDoctors] = useState([])
  const [openDoctorDialog, setOpenDoctorDialog] = useState(false)
  const [newDoctor, setNewDoctor] = useState({ name: '', specialization: '', morning: true, afternoon: true })
  const [exceptionDates, setExceptionDates] = useState([])
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false)
  const [newExceptionDate, setNewExceptionDate] = useState('')
  const [newExceptionReason, setNewExceptionReason] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(externalSettingsSaved)
  const [slotsGeneratedState, setSlotsGeneratedState] = useState(externalSlotsGenerated)

  useEffect(() => {
    checkDoctors()
    // Reset settings saved state when clinic changes
    setSettingsSaved(false)
    setSlotsGeneratedState(false)
    onScheduleUnsaved?.()
  }, [selectedClinic?.id])

  useEffect(() => {
    setSettingsSaved(externalSettingsSaved)
  }, [externalSettingsSaved])

  useEffect(() => {
    setSlotsGeneratedState(externalSlotsGenerated)
  }, [externalSlotsGenerated])

  const markUnsaved = useCallback(() => {
    setSettingsSaved(false)
    setSlotsGeneratedState(false)
    onScheduleUnsaved?.()
  }, [onScheduleUnsaved])

  const markSlotsGenerated = useCallback(() => {
    setSlotsGeneratedState(true)
    onSlotsGenerated?.()
  }, [onSlotsGenerated])

  const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

  async function checkDoctors() {
    if (!selectedClinic) return
    try {
      const res = await authFetch(`/api/clinics/${selectedClinic.id}/doctors`)
      const doctorList = await res.json()
      const doctorArray = Array.isArray(doctorList) ? doctorList : []
      setDoctors(doctorArray)
      setHasDoctors(doctorArray.length > 0)
    } catch (e) {
      console.error('Failed to check doctors:', e)
      setHasDoctors(false)
      setDoctors([])
    }
  }

  // Generate time options with 30-minute intervals
  const generateTimeOptions = (startHour, endHour, startMinutes = 0, endMinutes = 0) => {
    const options = []
    const startTotal = startHour * 60 + startMinutes
    const endTotal = endHour * 60 + endMinutes
    
    for (let totalMinutes = startTotal; totalMinutes <= endTotal; totalMinutes += 30) {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      options.push(timeStr)
    }
    
    return options
  }

  // Format time for display (e.g., "09:00" -> "09:00 AM", "14:00" -> "02:00 PM")
  const formatTimeDisplay = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    let displayHours = hours
    if (hours === 0) {
      displayHours = 12
    } else if (hours > 12) {
      displayHours = hours - 12
    }
    const displayTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    return `${displayTime} ${period}`
  }

  // Calculate duration in minutes between two time strings (HH:MM format)
  const calculateDuration = (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    return endTotalMinutes - startTotalMinutes
  }

  // Generate options for morning session start (06:00 - 11:30)
  const morningStartOptions = generateTimeOptions(6, 11, 0, 30)
  
  // Generate options for morning session end (depends on start time, max 12:00)
  const getMorningEndOptions = (startTime = morningStart) => {
    if (!startTime) return generateTimeOptions(7, 12, 0, 0)
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const startTotal = startHours * 60 + startMinutes
    const minEndTotal = startTotal + 30 // Minimum 30 minutes after start
    const maxEndTotal = 12 * 60 // Maximum 12:00
    
    const options = []
    for (let totalMinutes = minEndTotal; totalMinutes <= maxEndTotal; totalMinutes += 30) {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      // Don't exceed 12:00
      if (hours === 12 && minutes > 0) break
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      options.push(timeStr)
    }
    return options
  }

  // Generate options for afternoon session start (12:00 - 17:00)
  const afternoonStartOptions = generateTimeOptions(12, 17, 0, 0)
  
  // Generate options for afternoon session end (depends on start time, max 23:00)
  const getAfternoonEndOptions = (startTime = afternoonStart) => {
    if (!startTime) return generateTimeOptions(13, 23, 0, 0)
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const startTotal = startHours * 60 + startMinutes
    const minEndTotal = startTotal + 30 // Minimum 30 minutes after start
    const maxEndTotal = 23 * 60 // Maximum 23:00
    
    const options = []
    for (let totalMinutes = minEndTotal; totalMinutes <= maxEndTotal; totalMinutes += 30) {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      options.push(timeStr)
    }
    return options
  }

  // Validate schedule times
  const validateSchedule = () => {
    // Validate morning session
    if (morningStart >= morningEnd) {
      setErrorMessage('Morning session end time must be after start time')
      return false
    }
    
    if (morningEnd > '12:00') {
      setErrorMessage('Morning session must end by 12:00 PM')
      return false
    }
    
    if (morningStart < '06:00' || morningStart > '11:59') {
      setErrorMessage('Morning session start time must be between 06:00 AM and 11:59 AM')
      return false
    }
    
    const morningDuration = calculateDuration(morningStart, morningEnd)
    if (morningDuration < 60) {
      setErrorMessage('Morning session must be at least 1 hour long')
      return false
    }
    
    // Validate afternoon session
    if (afternoonStart < '12:00') {
      setErrorMessage('Afternoon session must start at or after 12:00 PM')
      return false
    }
    
    if (afternoonStart >= afternoonEnd) {
      setErrorMessage('Afternoon session end time must be after start time')
      return false
    }
    
    if (afternoonStart > '17:00') {
      setErrorMessage('Afternoon session start time should not exceed 17:00 (5:00 PM)')
      return false
    }
    
    const afternoonDuration = calculateDuration(afternoonStart, afternoonEnd)
    if (afternoonDuration < 60) {
      setErrorMessage('Afternoon session must be at least 1 hour long')
      return false
    }
    
    // Check for overlap (though they shouldn't overlap with the above constraints)
    if (morningEnd > afternoonStart) {
      setErrorMessage('Morning and afternoon sessions cannot overlap')
      return false
    }
    
    return true
  }

  const handleSaveSettings = async () => {
    if (!selectedClinic) return false
    setSaving(true)
    try {
      setSuccessMessage('')
      setErrorMessage('')
      
      // Validate schedule times
      if (!validateSchedule()) {
        return false
      }
      
      // Save default interval on clinic
      await authFetch('/api/appointment-slots/update-interval', {
        method: 'PUT',
        body: JSON.stringify({ clinicId: selectedClinic.id, intervalMinutes: interval })
      })
      
      setSuccessMessage('✅ Settings saved successfully!')
      setSettingsSaved(true)
      onScheduleSaved?.()
      setTimeout(() => setSuccessMessage(''), 4000)
      return true
    } catch (e) {
      setErrorMessage('Failed to save settings: ' + e.message)
      return false
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
            let errorMessage = errorText
            try {
              const errorJson = JSON.parse(errorText)
              errorMessage = errorJson.message || errorText
            } catch (e) {
              // If not JSON, use the text as is
            }
            throw new Error(`Morning session: ${errorMessage}`)
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
            let errorMessage = errorText
            try {
              const errorJson = JSON.parse(errorText)
              errorMessage = errorJson.message || errorText
            } catch (e) {
              // If not JSON, use the text as is
            }
            throw new Error(`Afternoon session: ${errorMessage}`)
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
        const errorMessages = failures.map(f => f.reason?.message || 'Unknown error').join('; ')
        setErrorMessage(`Generated ${totalSlots} slots, but ${failures.length} session(s) failed: ${errorMessages}`)
        return false
      }

      setSuccessMessage(`✅ Successfully generated ${totalSlots} appointment slots!`)
      setTimeout(() => setSuccessMessage(''), 4000)
      return true
      
    } catch (error) {
      console.error('Generation error:', error)
      setErrorMessage('Failed to generate slots: ' + error.message)
      return false
    }
  }

  const checkExistingSlots = useCallback(async () => {
    if (!selectedClinic || !startDate || !endDate) {
      return []
    }

    try {
      const startFormatted = dayjs(startDate).format('YYYY-MM-DD')
      const endFormatted = dayjs(endDate).format('YYYY-MM-DD')
      const checkUrl = `/api/appointment-slots/check-existing?clinicId=${selectedClinic.id}&startDate=${startFormatted}&endDate=${endFormatted}`
      const response = await authFetch(checkUrl)

      if (!response.ok) {
        throw new Error('Failed to check existing slots')
      }

      const existingDates = await response.json()
      if (!Array.isArray(existingDates)) {
        return []
      }

      return existingDates
    } catch (error) {
      console.error('Error checking existing slots:', error)
      setErrorMessage('Unable to verify existing slots. Please try again.')
      return null
    }
  }, [selectedClinic?.id, startDate, endDate])

  const generateSlots = async ({
    replaceExisting = false,
    conflictDates = [],
    skipSaveCheck = false
  } = {}) => {
    setGenerating(true)
    setStatus('')
    setSuccessMessage('')
    setErrorMessage('')

    try {
      let skippedDuringDelete = 0

      if (!skipSaveCheck && !settingsSaved) {
        setErrorMessage('Please save your schedule settings before generating appointment slots.')
        return { success: false, reason: 'unsaved' }
      }

      await checkDoctors()

      if (!doctors || doctors.length === 0) {
        setErrorMessage('Cannot generate appointment slots. This clinic has no doctors. Please add at least one doctor first.')
        return { success: false, reason: 'noDoctors' }
      }

      const morningDoctors = doctors.filter(d => d.morning === true)
      const afternoonDoctors = doctors.filter(d => d.afternoon === true)

      if (morningDoctors.length === 0 && afternoonDoctors.length === 0) {
        setErrorMessage('Cannot generate slots. No doctors are available for morning or afternoon sessions.')
        return { success: false, reason: 'noAvailability' }
      }

      if (!selectedClinic) {
        setErrorMessage('Please select a clinic first')
        return { success: false, reason: 'noClinic' }
      }

      if (!startDate || !endDate) {
        setErrorMessage('Please select start and end dates')
        return { success: false, reason: 'noDates' }
      }

      if (!interval || !slotDuration) {
        setErrorMessage('Please set default interval and slot duration')
        return { success: false, reason: 'missingDefaults' }
      }

      if (!validateSchedule()) {
        return { success: false, reason: 'invalidSchedule' }
      }

      if (!replaceExisting) {
        const existingDates = await checkExistingSlots()
        if (existingDates === null) {
          return { success: false, reason: 'checkFailed' }
        }
        if (existingDates.length > 0) {
          return { success: false, conflicts: existingDates }
        }
      } else if (conflictDates.length > 0) {
        const deleteResponse = await authFetch(
          `/api/appointment-slots/delete-by-dates?clinicId=${selectedClinic.id}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conflictDates)
          }
        )

        let deletePayload = null
        try {
          deletePayload = await deleteResponse.json()
        } catch (err) {
          deletePayload = null
        }

        if (!deleteResponse.ok) {
          const deleteMessage = typeof deletePayload === 'object' && deletePayload !== null
            ? (deletePayload.message || JSON.stringify(deletePayload))
            : 'Failed to delete existing slots'
          throw new Error(deleteMessage)
        }

        skippedDuringDelete = deletePayload?.skipped ?? 0
        if (skippedDuringDelete > 0) {
          setStatus(`Skipped ${skippedDuringDelete} slot(s) that already have appointment history. They remain unchanged.`)
        }
      }

      const success = await generateAllSlots()
      if (success) {
        markSlotsGenerated()
        return { success: true, skipped: skippedDuringDelete }
      }

      return { success: false }
    } catch (error) {
      console.error('Generate slots error:', error)
      setErrorMessage('Failed to generate slots: ' + error.message)
      return { success: false, error }
    } finally {
      setGenerating(false)
    }
  }

  useImperativeHandle(ref, () => ({
    saveSettings: handleSaveSettings,
    generateSlots,
    checkExistingSlots,
    isGenerating: () => generating
  }));

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
          name: `Dr. ${newDoctor.name}`,
          specialization: newDoctor.specialization,
          clinicId: selectedClinic.id,
          morning: newDoctor.morning,
          afternoon: newDoctor.afternoon
        })
      })
      setStatus('Doctor created successfully. You can now generate appointment slots.')
      setNewDoctor({ name: '', specialization: '', morning: true, afternoon: true })
      await checkDoctors()
    } catch (e) {
      setStatus(e.message || 'Failed to create doctor')
    }
  }


  const handleAddException = () => {
    if (!newExceptionDate) return
    markUnsaved()
    setExceptionDates([...exceptionDates, { 
      date: newExceptionDate, 
      reason: newExceptionReason || 'Closed' 
    }])
    setNewExceptionDate('')
    setNewExceptionReason('')
    setShowAddExceptionModal(false)
  }

  const removeExceptionDate = (index) => {
    markUnsaved()
    setExceptionDates(exceptionDates.filter((_, i) => i !== index))
  }

  const handleDayToggle = (day, checked) => {
    markUnsaved()
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

  if (isLocked) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Add doctors before configuring schedules
        </Typography>
        <Typography color="text.secondary">
          This step unlocks after at least one doctor is assigned to the clinic.
        </Typography>
      </Paper>
    )
  }

  return (
    <Box>
      {!hasDoctors && (
        <WarningBanner
          title="No doctors available"
          message="This clinic has no doctors. Add at least one doctor before configuring schedules."
          actionText="Add Doctor"
          onAction={() => {
            if (onOpenAddDoctor) {
              onOpenAddDoctor()
            } else {
              setOpenDoctorDialog(true)
            }
          }}
        />
      )}

      {status && <Alert severity={status.includes('error') || status.includes('Failed') ? 'error' : 'info'} sx={{ mb: 2 }}>{status}</Alert>}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ mb: '16px', fontWeight: 500 }}>
            Default Settings
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}
          >
            <TextField
              fullWidth
              label="Default Interval (minutes)"
              type="number"
              value={interval}
              onChange={(e) => {
                markUnsaved()
                const val = parseInt(e.target.value, 10)
                setInterval(Number.isNaN(val) ? 0 : val)
              }}
            />
            <TextField
              fullWidth
              label="Default Slot Duration (minutes)"
              type="number"
              value={slotDuration}
              onChange={(e) => {
                markUnsaved()
                const val = parseInt(e.target.value, 10)
                setSlotDuration(Number.isNaN(val) ? 0 : val)
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: '8px' }} />

        <Box>
          <Typography variant="h6" sx={{ mb: '12px', fontWeight: 500 }}>
            Session Windows
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ mb: '12px', fontWeight: 500 }}>
                Morning Session
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Start Time</InputLabel>
                  <Select
                    value={morningStart}
                    onChange={(e) => {
                      markUnsaved()
                      const newStart = e.target.value
                      setMorningStart(newStart)
                      setErrorMessage('')
                      const endOptions = getMorningEndOptions(newStart)
                      if (!endOptions.includes(morningEnd) || newStart >= morningEnd) {
                        if (endOptions.length > 0) {
                          setMorningEnd(endOptions[0])
                        }
                      }
                    }}
                    label="Start Time"
                  >
                    {morningStartOptions.map(time => (
                      <MenuItem key={time} value={time}>
                        {formatTimeDisplay(time)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="h6" sx={{ color: '#666' }}>—</Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>End Time</InputLabel>
                  <Select
                    value={morningEnd}
                    onChange={(e) => {
                      markUnsaved()
                      setMorningEnd(e.target.value)
                      setErrorMessage('')
                    }}
                    label="End Time"
                  >
                    {getMorningEndOptions().map(time => (
                      <MenuItem key={time} value={time}>
                        {formatTimeDisplay(time)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: '12px', fontWeight: 500 }}>
                Afternoon Session
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Start Time</InputLabel>
                  <Select
                    value={afternoonStart}
                    onChange={(e) => {
                      markUnsaved()
                      const newStart = e.target.value
                      setAfternoonStart(newStart)
                      setErrorMessage('')
                      const endOptions = getAfternoonEndOptions(newStart)
                      if (!endOptions.includes(afternoonEnd) || newStart >= afternoonEnd) {
                        if (endOptions.length > 0) {
                          setAfternoonEnd(endOptions[0])
                        }
                      }
                    }}
                    label="Start Time"
                  >
                    {afternoonStartOptions.map(time => (
                      <MenuItem key={time} value={time}>
                        {formatTimeDisplay(time)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="h6" sx={{ color: '#666' }}>—</Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>End Time</InputLabel>
                  <Select
                    value={afternoonEnd}
                    onChange={(e) => {
                      markUnsaved()
                      setAfternoonEnd(e.target.value)
                      setErrorMessage('')
                    }}
                    label="End Time"
                  >
                    {getAfternoonEndOptions().map(time => (
                      <MenuItem key={time} value={time}>
                        {formatTimeDisplay(time)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: '8px' }} />

        <Box>
          <Typography variant="h6" sx={{ mb: '12px', fontWeight: 500 }}>
            Schedule Period
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(value) => {
                  markUnsaved()
                  setStartDate(value)
                }}
                sx={{ flex: 1 }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(value) => {
                  markUnsaved()
                  setEndDate(value)
                }}
                sx={{ flex: 1 }}
              />
            </Box>
          </LocalizationProvider>
        </Box>

        <Divider sx={{ my: '8px' }} />

        <Box>
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
        </Box>

        <Divider sx={{ my: '8px' }} />

        <Box>
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
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                padding: 2,
                marginBottom: 1,
                border: '1px solid #ddd',
                borderRadius: 1
              }}
            >
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
        </Box>
      </Stack>

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
              placeholder="Enter name (Dr. prefix will be added)"
            />
            <TextField
              fullWidth
              label="Specialization"
              value={newDoctor.specialization}
              onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Availability
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newDoctor.morning}
                    onChange={(e) => setNewDoctor({ ...newDoctor, morning: e.target.checked })}
                  />
                }
                label="Morning Session Available"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newDoctor.afternoon}
                    onChange={(e) => setNewDoctor({ ...newDoctor, afternoon: e.target.checked })}
                  />
                }
                label="Afternoon Session Available"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDoctorDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateDoctor} 
            variant="contained"
            disabled={!newDoctor.name || !newDoctor.specialization}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage('')}
          sx={{ mt: 4 }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage('')}
          sx={{ mt: 4 }}
        >
          {errorMessage}
        </Alert>
      )}
    </Box>
  );
});

export default ScheduleSettings;

