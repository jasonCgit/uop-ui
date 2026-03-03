import { Box, Typography, Chip, Tooltip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const STATUS_CONFIG = {
  healthy:  { Icon: CheckCircleIcon, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  degraded: { Icon: WarningIcon,     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  down:     { Icon: ErrorIcon,       color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  no_data:  { Icon: CheckCircleIcon, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

function ProcessCard({ process, selectedEs, onSelectEs }) {
  const cfg = STATUS_CONFIG[process.status] || STATUS_CONFIG.no_data
  const hasSelectedService = selectedEs && process.services.some(s => s.id === selectedEs)

  return (
    <Box sx={{
      p: 1.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: hasSelectedService ? cfg.color : 'divider',
      bgcolor: hasSelectedService ? cfg.bg : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fff',
      transition: 'all 0.15s',
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <cfg.Icon sx={{ fontSize: 14, color: cfg.color }} />
        <Typography fontWeight={700} sx={{ ...fSmall, lineHeight: 1.3, wordBreak: 'break-word' }}>{process.name}</Typography>
      </Box>

      {/* Step flow */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 1, flexWrap: 'wrap' }}>
        {process.steps.map((step, i) => (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{
              px: 0.75, py: 0.25,
              borderRadius: 0.75,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}>
              <Typography sx={{ ...fTiny, fontWeight: 500 }}>{step}</Typography>
            </Box>
            {i < process.steps.length - 1 && (
              <ArrowForwardIcon sx={{ fontSize: 10, color: 'text.disabled', mx: 0.25 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* Linked services */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {process.services.map(svc => {
          const sCfg = STATUS_CONFIG[svc.status] || STATUS_CONFIG.no_data
          const isSelected = selectedEs === svc.id
          return (
            <Tooltip key={svc.id} title={svc.name} arrow>
              <Chip
                icon={<sCfg.Icon sx={{ fontSize: 10, color: `${sCfg.color} !important` }} />}
                label={svc.name.length > 15 ? svc.name.slice(0, 15) + '..' : svc.name}
                size="small"
                onClick={() => onSelectEs(svc.id)}
                sx={{
                  ...fTiny, height: 20, fontWeight: isSelected ? 700 : 500,
                  borderRadius: 0.75,
                  bgcolor: isSelected ? `${sCfg.color}25` : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected ? sCfg.color : 'divider',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: `${sCfg.color}15`, borderColor: sCfg.color },
                }}
              />
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}

export default function EsBusinessProcesses({ processes = [], selectedEs, onSelectEs }) {
  if (processes.length === 0) return null

  // Sort: processes with selected ES first, then by status severity
  const statusRank = { down: 0, degraded: 1, no_data: 2, healthy: 3 }
  const sorted = [...processes].sort((a, b) => {
    const aHas = selectedEs && a.services.some(s => s.id === selectedEs) ? 0 : 1
    const bHas = selectedEs && b.services.some(s => s.id === selectedEs) ? 0 : 1
    if (aHas !== bHas) return aHas - bHas
    return (statusRank[a.status] || 3) - (statusRank[b.status] || 3)
  })

  return (
    <Box sx={{ mb: 2 }}>
      <Typography fontWeight={700} color="text.secondary" sx={{ ...fSmall, mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Business Processes ({processes.length})
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 1,
      }}>
        {sorted.map(bp => (
          <ProcessCard
            key={bp.id}
            process={bp}
            selectedEs={selectedEs}
            onSelectEs={onSelectEs}
          />
        ))}
      </Box>
    </Box>
  )
}
