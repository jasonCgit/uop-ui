import { Box, Typography, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const STATUS_ICON = {
  healthy:  { Icon: CheckCircleIcon, color: '#22c55e' },
  degraded: { Icon: WarningIcon,     color: '#f59e0b' },
  down:     { Icon: ErrorIcon,       color: '#ef4444' },
}

export default function EsServiceList({ services = [], selectedEs, onSelect }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {services.map(svc => {
        const st = STATUS_ICON[svc.status] || STATUS_ICON.healthy
        const isSelected = selectedEs === svc.id

        return (
          <Box
            key={svc.id}
            onClick={() => onSelect(svc.id)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 0.75,
              borderRadius: 1.5,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: isSelected ? 'primary.main' : 'transparent',
              bgcolor: isSelected
                ? (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.1)' : 'rgba(21,101,192,0.05)'
                : 'transparent',
              '&:hover': {
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              },
            }}
          >
            <st.Icon sx={{ fontSize: 14, color: st.color }} />
            <Typography fontWeight={isSelected ? 700 : 500} sx={{ ...fSmall, flex: 1, lineHeight: 1.3, wordBreak: 'break-word' }}>
              {svc.name}
            </Typography>
            <Chip
              label={svc.criticality}
              size="small"
              sx={{
                ...fTiny, height: 18, fontWeight: 700, textTransform: 'uppercase',
                bgcolor: svc.criticality === 'critical' ? 'rgba(239,68,68,0.12)' :
                         svc.criticality === 'high' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                color: svc.criticality === 'critical' ? '#ef4444' :
                       svc.criticality === 'high' ? '#f59e0b' : '#3b82f6',
                borderRadius: 0.75,
              }}
            />
            <Typography color="text.disabled" sx={fTiny}>{svc.app_count}</Typography>
          </Box>
        )
      })}
    </Box>
  )
}
