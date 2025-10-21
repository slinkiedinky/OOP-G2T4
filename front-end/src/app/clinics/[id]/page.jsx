import { use } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
export default async function Clinic({ params }){
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const res = await fetch(`${apiBase}/api/clinics/${params.id}/doctors`);
  const doctors = await res.json();
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
