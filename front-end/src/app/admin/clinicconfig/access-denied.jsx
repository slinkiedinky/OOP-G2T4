'use client'

import { Box, Typography, Button, Paper } from '@mui/material'
import { useRouter } from 'next/navigation'
import LockIcon from '@mui/icons-material/Lock'

/**
 * AccessDenied — simple client page shown when a user lacks permissions to access
 * the clinic configuration UI. Provides a button to return to the home page.
 *
 * @returns {JSX.Element}
 */
export default function AccessDenied() {
  const router = useRouter()

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      p: 3
    }}>
      <Paper sx={{ 
        p: 6, 
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <LockIcon sx={{ fontSize: 80, color: '#ff6b6b', mb: 2 }} />
        
        <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
          Access Denied
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          You don't have permission to access this page.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Only administrators can configure clinic settings.
        </Typography>
        
        <Button 
          variant="contained" 
          size="large"
          onClick={() => router.push('/')}
        >
          ← Back to Home
        </Button>
      </Paper>
    </Box>
  )
}

