"use client"
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

export default function MuiProvider({ children }){
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#2563eb' },
      secondary: { main: '#06b6d4' },
      background: { default: '#f4f6fb' }
    },
    typography: {
      fontFamily: 'Inter, system-ui, Arial',
      h5: { fontWeight: 800 }
    }
  })

  theme.components = {
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
