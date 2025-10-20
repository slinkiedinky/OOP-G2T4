"use client"
import RequireAuth from '../components/RequireAuth'
import React from 'react'

export default function Appts(){
  return (
    <RequireAuth>
      <div>
        <h2>Appointments</h2>
        <div className="card">
          <div className="form-row"><label>Clinic ID <input type="number" /></label><label>Date <input type="date" /></label></div>
          <div style={{marginTop:8}}><button className="primary">Search Available</button></div>
        </div>
        <div id="appts-list" className="card">No results yet</div>
      </div>
    </RequireAuth>
  )
}
