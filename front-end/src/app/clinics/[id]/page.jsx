// This code was modified from an output by Gemini 2.5 Pro.

import { use } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
export default async function Clinic({ params }){
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
let doctors = [];
try {
 const res = await fetch(`${apiBase}/api/clinics/${params.id}/doctors`);
  // check for successful response
  if (res.ok) {
    // parse the json (if body empty, it fails)
    doctors = await res.json();
   } else {
    // in case of api fail, log error
    console.error(`API request failed: ${res.status} ${res.statusText}`);
   }
  } catch (error) {
  // catch network errors
   console.error("Failed to fetch or parse doctors data:", error);
  }

  return (
    <div>
      <h2>Doctors for clinic {params.id}</h2>
      <div className="grid-cards">
        {doctors.map(d=> (
          <Card className="card" key={d.id}>
            <CardContent>
              <div className="doctor-meta">{d.name || d.fullName || 'Doctor'}</div>
              <div className="doctor-specialty">Specialty: {d.specialty || 'General'}</div>
              <div style={{marginTop:8,fontSize:12,color:'#8892a6'}}>id: {d.id}</div>
              <div style={{marginTop:12}}>
                <Button size="small" variant="outlined">View schedule</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}