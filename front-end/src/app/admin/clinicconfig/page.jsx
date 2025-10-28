'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Select, MenuItem, Paper, Tabs, Tab } from '@mui/material'
import { authFetch } from '../../../lib/api'
import ScheduleSettings from './schedule-settings'
import AppointmentsTab from './appointments-tab'

export default function ClinicConfigPage() {
  const [clinics, setClinics] = useState([])
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [currentTab, setCurrentTab] = useState(0)

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Clinic Configuration</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Select Clinic</Typography>
        <Select
          fullWidth
          value={selectedClinic?.id ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value)
            const clinic = clinics.find(c => c.id === id)
            setSelectedClinic(clinic || null)
          }}
        >
          {clinics.map(clinic => (
            <MenuItem key={clinic.id} value={clinic.id}>{clinic.name}</MenuItem>
          ))}
        </Select>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Schedule Settings" />
          <Tab label="Appointments" />
        </Tabs>
      </Paper>

      {currentTab === 0 && <ScheduleSettings selectedClinic={selectedClinic} />}
      {currentTab === 1 && <AppointmentsTab selectedClinic={selectedClinic} />}
    </Box>
  )
}

