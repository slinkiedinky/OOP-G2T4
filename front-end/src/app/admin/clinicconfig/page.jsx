'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Paper, Tabs, Tab, TextField, RadioGroup, FormControlLabel, Radio, InputAdornment, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { authFetch, getToken } from '../../../lib/api'
import ScheduleSettings from './schedule-settings'
import DoctorsTab from './doctors-tab'
import AppointmentsTab from './appointments-tab'
import AccessDenied from './access-denied'

export default function ClinicConfigPage() {
  const [clinics, setClinics] = useState([])
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [currentTab, setCurrentTab] = useState(0)
  const [clinicSearchQuery, setClinicSearchQuery] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleChecked, setRoleChecked] = useState(false)

  // Check if user is admin
  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setIsAdmin(payload.role === "ADMIN")
      } catch (e) {
        console.error("Failed to decode token:", e)
        setIsAdmin(false)
      }
    } else {
      setIsAdmin(false)
    }
    setRoleChecked(true)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        // Load clinics using the same endpoint as the Clinics page
        const res = await authFetch('/api/clinics')
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setClinics(list)
        if (list.length > 0) setSelectedClinic(list[0])
      } catch (e) {
        console.error('Failed to load clinics', e)
        setClinics([])
      }
    })()
  }, [])

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(clinicSearchQuery.toLowerCase()) ||
    (clinic.location && clinic.location.toLowerCase().includes(clinicSearchQuery.toLowerCase()))
  )

  // Show loading state while checking role
  if (!roleChecked) {
    return null
  }

  // Show Access Denied if user is not admin
  if (!isAdmin) {
    return <AccessDenied />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Clinic Configuration</Typography>

      {/* Clinic Selector with Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Select Clinic
        </Typography>
        
        {/* Search Box */}
        <TextField
          fullWidth
          placeholder="Search by name or location..."
          value={clinicSearchQuery}
          onChange={(e) => setClinicSearchQuery(e.target.value)}
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
                  onClick={() => setClinicSearchQuery('')}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />
        
        {/* Results Count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Showing {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''}
        </Typography>
        
        {/* Clinic List */}
        <Box sx={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: 1,
          p: 1
        }}>
          <RadioGroup
            value={selectedClinic?.id || ''}
            onChange={(e) => {
              const clinic = clinics.find(c => c.id === parseInt(e.target.value))
              setSelectedClinic(clinic || null)
            }}
          >
            {filteredClinics.map(clinic => (
              <FormControlLabel
                key={clinic.id}
                value={clinic.id}
                control={<Radio />}
                label={clinic.name}
                sx={{ 
                  mb: 0.5,
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  borderRadius: 1,
                  px: 1
                }}
              />
            ))}
          </RadioGroup>
          
          {filteredClinics.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No clinics found matching "{clinicSearchQuery}"
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="SCHEDULE SETTINGS" />
          <Tab label="DOCTORS" />
          <Tab label="APPOINTMENTS" />
        </Tabs>
      </Paper>

      {currentTab === 0 && <ScheduleSettings selectedClinic={selectedClinic} />}
      {currentTab === 1 && <DoctorsTab selectedClinic={selectedClinic} />}
      {currentTab === 2 && <AppointmentsTab selectedClinic={selectedClinic} setActiveTab={setCurrentTab} />}
    </Box>
  )
}

