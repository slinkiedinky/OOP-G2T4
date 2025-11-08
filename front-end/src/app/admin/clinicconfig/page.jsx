'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  RadioGroup,
  Radio,
  InputAdornment,
  IconButton,
  Collapse,
  Button,
  Stack,
  Container,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import dayjs from 'dayjs'
import { authFetch } from '../../../lib/api'
import RequireAuth from '../../components/RequireAuth'
import ScheduleSettings from './schedule-settings'
import DoctorsTab from './doctors-tab'
import AppointmentsTab from './appointments-tab'

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export default function ClinicConfigPage() {
  const [clinics, setClinics] = useState([])
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [doctorCount, setDoctorCount] = useState(0)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [slotsGenerated, setSlotsGenerated] = useState(false)
  const [clinicSearchQuery, setClinicSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const scheduleRef = useRef(null)
  const [openAddDoctorDialog, setOpenAddDoctorDialog] = useState(false)
  const [clinicTypeFilter, setClinicTypeFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState('All')
  const [clinicTypes, setClinicTypes] = useState(['All'])
  const [clinicLocations, setClinicLocations] = useState(['All'])
  const [isProcessingNext, setIsProcessingNext] = useState(false)
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  const [pendingConflicts, setPendingConflicts] = useState([])

  const steps = ['Doctor Setup', 'Schedule Settings', 'Generate Slots']

  // Load clinics - add small delay to ensure Next.js is fully ready
  useEffect(() => {
    // Small delay to ensure Next.js routing is fully initialized
    // This prevents 401 errors on first navigation
    const timer = setTimeout(() => {
      loadClinics()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  async function loadClinics(retryCount = 0) {
    try {
      // Use plain fetch for /api/clinics since it's a public endpoint
      // Use absolute URL to bypass Next.js rewrite proxy and avoid timing issues
      const res = await fetch(`${apiBase}/api/clinics`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        // Ensure no credentials are sent for public endpoint
        credentials: 'omit'
      })
      
      if (!res.ok) {
        // Retry once if we get 401 on first attempt (timing issue)
        if (res.status === 401 && retryCount === 0) {
          console.log('Got 401, retrying after delay...')
          setTimeout(() => loadClinics(1), 500)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setClinics(list)
      const uniqueTypes = ['All', ...Array.from(new Set(list.map(c => c.clinicType).filter(Boolean)))]
      setClinicTypes(uniqueTypes)
      const uniqueLocations = ['All', ...Array.from(new Set(list.map(c => c.location).filter(Boolean)))]
      setClinicLocations(uniqueLocations)
      
      // Auto-select first clinic if available
      if (list.length > 0 && !selectedClinic) {
        setSelectedClinic(list[0])
      }
    } catch (e) {
      console.error('Failed to load clinics', e)
      // Retry once on error (network/timing issues)
      if (retryCount === 0) {
        setTimeout(() => loadClinics(1), 500)
      } else {
        setClinics([])
      }
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const rawQuery = clinicSearchQuery.trim()
  const searchQuery = rawQuery.toLowerCase()
  const idQuery = rawQuery.replace(/^#/, '').replace(/\D/g, '')
  const isIdOnlyQuery = idQuery.length > 0 && idQuery === rawQuery.replace(/^#/, '')
  const filteredClinics = clinics.filter((clinic) => {
    if (clinicTypeFilter !== 'All' && clinic.clinicType !== clinicTypeFilter) {
      return false
    }
    if (locationFilter !== 'All' && clinic.location !== locationFilter) {
      return false
    }

    if (!rawQuery) {
      return true
    }

    if (isIdOnlyQuery) {
      return String(clinic.id).includes(idQuery)
    }

    const nameMatch = clinic.name?.toLowerCase().includes(searchQuery)
    const locationMatch = clinic.location?.toLowerCase().includes(searchQuery)
    const addressMatch = clinic.address?.toLowerCase().includes(searchQuery)
    const idMatch = idQuery ? String(clinic.id).includes(idQuery) : false

    return nameMatch || locationMatch || addressMatch || idMatch
  })
  const filteredCount = filteredClinics.length

  const handleSearchFocus = () => {
    setDropdownOpen(true)
  }

  const handleSearchChange = (e) => {
    setClinicSearchQuery(e.target.value)
    if (!dropdownOpen) {
      setDropdownOpen(true)
    }
  }

  const handleClearSearch = () => {
    setClinicSearchQuery('')
    searchInputRef.current?.focus()
    if (!dropdownOpen) {
      setDropdownOpen(true)
    }
  }

  const handleClinicSelect = (clinic) => {
    setSelectedClinic(clinic)
    setDropdownOpen(false)
  }

  useEffect(() => {
    setActiveStep(0)
    setDoctorCount(0)
    setScheduleSaved(false)
    setSlotsGenerated(false)
  }, [selectedClinic?.id])

  const handleDoctorCountChange = (count) => {
    setDoctorCount(count)
    if (count === 0) {
      setScheduleSaved(false)
      setSlotsGenerated(false)
      setActiveStep(0)
    }
  }

  const handleScheduleSaved = () => {
    setScheduleSaved(true)
  }

  const handleScheduleUnsaved = () => {
    setScheduleSaved(false)
    setSlotsGenerated(false)
    if (activeStep > 1) {
      setActiveStep(1)
    }
  }

  const handleSlotsGenerated = () => {
    setSlotsGenerated(true)
  }

  const canProceed = () => {
    if (activeStep === 0) return doctorCount > 0 && !!selectedClinic
    if (activeStep === 1) return !!selectedClinic && doctorCount > 0 && !isProcessingNext
    return !isProcessingNext
  }

  const handleNext = async () => {
    if (activeStep >= steps.length - 1 || !selectedClinic) {
      return
    }

    if (activeStep === 0) {
      if (doctorCount > 0) {
        setActiveStep(1)
      }
      return
    }

    if (activeStep === 1) {
      if (!scheduleRef.current || isProcessingNext) {
        return
      }

      setIsProcessingNext(true)
      try {
        const saved = await scheduleRef.current.saveSettings?.()
        if (!saved) {
          return
        }

        const conflicts = await scheduleRef.current.checkExistingSlots?.()
        if (conflicts === null) {
          return
        }

        if (Array.isArray(conflicts) && conflicts.length > 0) {
          setPendingConflicts(conflicts)
          setReplaceDialogOpen(true)
          return
        }

        const generateResult = await scheduleRef.current.generateSlots?.({
          skipSaveCheck: true
        })
        if (!generateResult?.success) {
          return
        }

        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
      } finally {
        setIsProcessingNext(false)
      }
      return
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const handleCancelReplace = () => {
    setReplaceDialogOpen(false)
    setPendingConflicts([])
    setIsProcessingNext(false)
  }

  const handleConfirmReplace = async () => {
    if (!scheduleRef.current) return
    setReplaceDialogOpen(false)
    setIsProcessingNext(true)
    try {
      const replaceResult = await scheduleRef.current.generateSlots?.({
        replaceExisting: true,
        conflictDates: pendingConflicts,
        skipSaveCheck: true
      })

      if (!replaceResult?.success) {
        return
      }

      setPendingConflicts([])
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
    } finally {
      setIsProcessingNext(false)
    }
  }

  const renderActiveStep = () => {
    if (activeStep === 0) {
      return (
        <DoctorsTab
          selectedClinic={selectedClinic}
          openAddDoctorDialog={openAddDoctorDialog}
          onAddDoctorDialogClose={() => setOpenAddDoctorDialog(false)}
          onDoctorCountChange={handleDoctorCountChange}
        />
      )
    }

    if (activeStep === 1) {
      return (
        <ScheduleSettings
          ref={scheduleRef}
          selectedClinic={selectedClinic}
          onOpenAddDoctor={() => {
            setActiveStep(0)
            setOpenAddDoctorDialog(true)
          }}
          onScheduleSaved={handleScheduleSaved}
          onScheduleUnsaved={handleScheduleUnsaved}
          onSlotsGenerated={handleSlotsGenerated}
          settingsSaved={scheduleSaved}
          slotsGenerated={slotsGenerated}
          isLocked={doctorCount === 0}
        />
      )
    }

    return (
      <AppointmentsTab
        selectedClinic={selectedClinic}
        setActiveTab={() => {}}
        onOpenAddDoctor={() => {
          setActiveStep(0)
          setOpenAddDoctorDialog(true)
        }}
        isLocked={!slotsGenerated || !scheduleSaved}
        lockReason="Please generate slots before reviewing"
      />
    )
  }

  const progressItems = ['Doctor Setup', 'Schedule Settings', 'Generate Slots']
  const pendingTextColor = '#9ca3af'
  const pendingBorderColor = '#e5e7eb'
  const pendingDotColor = '#d1d5db'

  return (
    <RequireAuth>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ letterSpacing: '-0.01em', color: 'text.primary' }}
          >
            Clinic Configuration
          </Typography>
        </Box>

        {/* Clinic Selector with Search */}
        <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Select Clinic
        </Typography>
        
        <div ref={dropdownRef}>
          {/* Search Box */}
          <TextField
            inputRef={searchInputRef}
            fullWidth
            placeholder="Search by ID, name, or location..."
            value={clinicSearchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: clinicSearchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 1 }}
          />
          
          <Box
            sx={{
              mt: 2,
              mb: 2,
              p: { xs: 1.5, md: 2 },
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 1.5, md: 3 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Type
              </Typography>
              {clinicTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  color={clinicTypeFilter === type ? 'primary' : 'default'}
                  variant={clinicTypeFilter === type ? 'filled' : 'outlined'}
                  onClick={() => setClinicTypeFilter(type)}
                  sx={{
                    fontWeight: clinicTypeFilter === type ? 600 : 500,
                    px: 1.5,
                    borderRadius: 999
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Location
              </Typography>
              {clinicLocations.map((loc) => (
                <Chip
                  key={loc}
                  label={loc}
                  color={locationFilter === loc ? 'primary' : 'default'}
                  variant={locationFilter === loc ? 'filled' : 'outlined'}
                  onClick={() => setLocationFilter(loc)}
                  sx={{
                    fontWeight: locationFilter === loc ? 600 : 500,
                    px: 1.5,
                    borderRadius: 999
                  }}
                />
              ))}
            </Box>
          </Box>

          <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
            {filteredCount} {filteredCount === 1 ? 'result' : 'results'}
          </Typography>
          
          {/* Dropdown */}
          {dropdownOpen && (
            <Collapse in={dropdownOpen} timeout={200}>
              <Box sx={{ maxHeight: 300, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, mt: 1 }}>
                {filteredClinics.length > 0 ? (
                  <RadioGroup
                    value={selectedClinic?.id || ''}
                    onChange={(e) => {
                      const clinic = clinics.find(c => c.id === parseInt(e.target.value))
                      if (clinic) handleClinicSelect(clinic)
                    }}
                  >
                    {filteredClinics.map(clinic => {
                      const isSelected = selectedClinic?.id === clinic.id
                      return (
                        <div
                          key={clinic.id}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '12px', 
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)' }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                          onClick={() => handleClinicSelect(clinic)}
                        >
                          <Radio
                            checked={isSelected}
                            value={clinic.id}
                          />
                          <div style={{ marginLeft: 12, flex: 1 }}>
                            <Typography variant="body1" style={{ fontWeight: 600, color: '#111827' }}>
                              {clinic.name}
                            </Typography>
                            <div
                              style={{
                                display: 'flex',
                                gap: 12,
                                flexWrap: 'wrap',
                                marginTop: 4,
                                color: '#6b7280',
                                fontSize: 13,
                                alignItems: 'center'
                              }}
                            >
                              <span>ID: {clinic.id}</span>
                              {clinic.clinicType && <span>{clinic.clinicType}</span>}
                              {clinic.location && <span>{clinic.location}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </RadioGroup>
                ) : (
                  <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                    No matching clinics
                  </Typography>
                )}
              </Box>
            </Collapse>
          )}
          
          {/* Selected Clinic Display (when dropdown is closed) */}
          {!dropdownOpen && selectedClinic && (
            <Box sx={{ mt: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body1" fontWeight="medium">{selectedClinic.name}</Typography>
              {selectedClinic.location && (
                <Typography variant="body2" color="text.secondary">{selectedClinic.location}</Typography>
              )}
            </Box>
          )}
        </div>
      </Paper>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            alignItems: 'stretch'
          }}
        >
          <Paper
            sx={{
              width: { md: 220 },
              minWidth: { md: 220 },
              p: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              position: { md: 'sticky' },
              top: 96,
              alignSelf: { md: 'flex-start' }
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Flow
            </Typography>

            <Box sx={{ position: 'relative', mt: 0.5 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 10,
                  top: 12,
                  bottom: 12,
                  width: 2,
                  bgcolor: pendingBorderColor
                }}
              />

              <Stack spacing={3}>
                {progressItems.map((title, index) => {
                const isActive = activeStep === index
                const isCompleted =
                  (index === 0 && doctorCount > 0) ||
                  (index === 1 && scheduleSaved) ||
                  (index === 2 && slotsGenerated)
                const isPast = activeStep > index || (isCompleted && index !== activeStep)
                const isPending = !isCompleted && !isActive

                const textColor = isCompleted
                  ? 'text.primary'
                  : isActive
                    ? 'primary.main'
                    : pendingTextColor

                return (
                  <Box
                    key={title}
                    sx={{
                      position: 'relative',
                      pl: 3,
                      minHeight: 100,
                        display: 'flex',
                        alignItems: 'center',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: 10,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          bgcolor: isPast || isCompleted ? 'success.main' : 'transparent'
                        }
                    }}
                  >
                    <Box
                      sx={{
                          position: 'relative',
                          zIndex: 1,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: isCompleted
                          ? 'success.main'
                          : isActive
                            ? 'primary.main'
                            : pendingBorderColor,
                        bgcolor: isCompleted ? 'success.main' : 'background.paper',
                        color: isCompleted ? 'common.white' : textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        '&::before': !isCompleted
                          ? {
                              content: '""',
                              position: 'absolute',
                              width: isActive ? 8 : 6,
                              height: isActive ? 8 : 6,
                              borderRadius: '50%',
                              backgroundColor: isActive ? 'primary.main' : pendingDotColor
                            }
                          : undefined
                      }}
                    >
                      {isCompleted ? '✓' : ''}
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        ml: 1.5,
                        fontWeight: isCompleted || isActive ? 600 : 400,
                        color: textColor,
                        letterSpacing: 0.2
                      }}
                    >
                      {title}
                    </Typography>
                  </Box>
                )
              })}
              </Stack>
            </Box>
          </Paper>

          <Paper
            sx={{
              flex: 1,
              minWidth: 0,
              p: { xs: 2.5, md: 4 },
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <Box>{renderActiveStep()}</Box>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Button onClick={handleBack} disabled={activeStep === 0}>
                Back
              </Button>
              {activeStep < steps.length - 1 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {isProcessingNext ? 'Processing…' : 'Next'}
                </Button>
              )}
            </Stack>
          </Paper>
        </Box>
      </Container>

      <Dialog
        open={replaceDialogOpen}
        onClose={handleCancelReplace}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Existing Slots Found</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            {pendingConflicts.length} day(s) already have appointment slots in this range.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Booked appointments will be kept. Only unbooked slots will be replaced.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {pendingConflicts.map((date) => (
              <Chip key={date} label={dayjs(date).format('DD/MM/YYYY')} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReplace} disabled={isProcessingNext}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReplace}
            disabled={isProcessingNext}
            variant="contained"
          >
            Replace Open Slots
          </Button>
        </DialogActions>
      </Dialog>

    </RequireAuth>
  )
}
