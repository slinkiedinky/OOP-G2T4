'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Paper, Tabs, Tab, TextField, RadioGroup, Radio, InputAdornment, IconButton, Collapse } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { authFetch } from '../../../lib/api'
import RequireAuth from '../../components/RequireAuth'
import ScheduleSettings from './schedule-settings'
import DoctorsTab from './doctors-tab'
import AppointmentsTab from './appointments-tab'

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export default function ClinicConfigPage() {
  const [clinics, setClinics] = useState([])
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [currentTab, setCurrentTab] = useState(0)
  const [clinicSearchQuery, setClinicSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const [openAddDoctorDialog, setOpenAddDoctorDialog] = useState(false)

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

  const filteredClinics = clinicSearchQuery.trim() === ''
    ? clinics
    : clinics.filter(clinic =>
        clinic.name.toLowerCase().includes(clinicSearchQuery.toLowerCase()) ||
        (clinic.location && clinic.location.toLowerCase().includes(clinicSearchQuery.toLowerCase()))
      )

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

  return (
    <RequireAuth>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Clinic Configuration</Typography>

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
            placeholder="Search by name or location..."
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
          
          {/* Results Count - only show when dropdown is open */}
          {dropdownOpen && (
            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
              {filteredClinics.length} {filteredClinics.length === 1 ? 'result' : 'results'}
            </Typography>
          )}
          
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
                            padding: '8px', 
                            cursor: 'pointer',
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
                          <div style={{ marginLeft: 8 }}>
                            <Typography variant="body1">{clinic.name}</Typography>
                            {clinic.location && (
                              <Typography variant="body2" color="text.secondary">{clinic.location}</Typography>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </RadioGroup>
                ) : (
                  <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                    No clinics found matching "{clinicSearchQuery}"
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

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="DOCTORS" />
          <Tab label="SCHEDULE SETTINGS" />
          <Tab label="APPOINTMENTS" />
        </Tabs>
      </Paper>

        {currentTab === 0 && <DoctorsTab selectedClinic={selectedClinic} openAddDoctorDialog={openAddDoctorDialog} onAddDoctorDialogClose={() => setOpenAddDoctorDialog(false)} />}
        {currentTab === 1 && <ScheduleSettings selectedClinic={selectedClinic} onOpenAddDoctor={() => { setCurrentTab(0); setOpenAddDoctorDialog(true); }} />}
        {currentTab === 2 && <AppointmentsTab selectedClinic={selectedClinic} setActiveTab={setCurrentTab} onOpenAddDoctor={() => { setCurrentTab(0); setOpenAddDoctorDialog(true); }} />}
      </Box>
    </RequireAuth>
  )
}

