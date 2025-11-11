'use client'

import { Box, Typography } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'

/**
 * InfoBanner
 *
 * Simple informational banner used to display a short message to users.
 *
 * @param {{title?:string, message?:string}} props
 * @returns {JSX.Element}
 */
export default function InfoBanner({ title, message }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        padding: '14px 16px',
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderLeft: '3px solid #2563EB',
        borderRadius: '6px',
        mb: 2
      }}
    >
      <InfoIcon
        sx={{
          color: '#2563EB',
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
          {title || 'Info'}
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
    </Box>
  )
}

