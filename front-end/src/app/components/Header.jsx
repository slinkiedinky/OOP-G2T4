"use client"
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Link from 'next/link'
import Container from '@mui/material/Container'

export default function Header(){
  return (
    <AppBar position="static" elevation={0} color="transparent" sx={{borderBottom:'1px solid rgba(15,23,42,0.04)'}}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{height:64,display:'flex',justifyContent:'space-between'}}>
          <Typography variant="h6" sx={{fontWeight:800}}>
            <span style={{fontWeight:800}}>Clinic</span>{' '}
            <span style={{color:'#2563eb',fontWeight:800}}>System</span>
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Link href="/clinics"><Button color="primary">Clinics</Button></Link>
            <Link href="/appointments"><Button color="primary">Appointments</Button></Link>
            <Link href="/auth"><Button variant="outlined" sx={{borderRadius:8}}>Login</Button></Link>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
