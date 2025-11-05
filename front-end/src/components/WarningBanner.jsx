'use client'

import { Button, Box, Typography } from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'

export default function WarningBanner({ title, message, actionText, onAction }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        padding: '14px 16px',
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderLeft: '3px solid #F59E0B',
        borderRadius: '6px',
        mb: 2
      }}
    >
      <WarningIcon
        sx={{
          color: '#F59E0B',
          fontSize: '20px',
          flexShrink: 0
        }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography
          component="strong"
          sx={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            mb: 0.25,
            lineHeight: 1.4
          }}
        >
          {title || 'Warning'}
        </Typography>
        <Typography
          component="p"
          sx={{
            fontSize: '13px',
            color: '#6B7280',
            margin: 0,
            lineHeight: 1.5
          }}
        >
          {message}
        </Typography>
      </Box>
      {onAction && (
        <Button
          size="small"
          variant="contained"
          onClick={onAction}
          sx={{
            backgroundColor: '#2563EB',
            color: 'white',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            '&:hover': {
              backgroundColor: '#1D4ED8'
            }
          }}
        >
          {actionText || 'Take Action'}
        </Button>
      )}
    </Box>
  )
}

