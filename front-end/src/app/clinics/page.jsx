import Link from 'next/link'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
export default async function Clinics(){
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const res = await fetch(`${apiBase}/api/clinics`);
  const clinics = await res.json();
  return (
    <div>
      <h2>Clinics</h2>
      <div className="grid-cards">
        {clinics.map(c => (
          <Card key={c.id} className="card">
            <CardContent>
              <h3 className="card-title">{c.name}</h3>
              <p className="card-sub">{c.address}</p>
              <div style={{marginTop:12}}>
                <Link href={`/clinics/${c.id}`}><Button variant="contained" size="small">View doctors</Button></Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
