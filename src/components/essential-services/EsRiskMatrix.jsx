import { Box, Typography, Tooltip } from '@mui/material'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const CRITICALITY_LEVELS = ['critical', 'high', 'medium']
const STATUS_LEVELS = ['healthy', 'degraded', 'down']

const CRIT_LABELS = { critical: 'Critical', high: 'High', medium: 'Medium' }
const STATUS_LABELS = { healthy: 'Healthy', degraded: 'Degraded', down: 'Down' }

const CELL_COLORS = {
  // criticality_status → background intensity
  critical_down:     { bg: 'rgba(239,68,68,0.35)',  text: '#fca5a5' },
  critical_degraded: { bg: 'rgba(239,68,68,0.20)',  text: '#fca5a5' },
  critical_healthy:  { bg: 'rgba(34,197,94,0.15)',   text: '#86efac' },
  high_down:         { bg: 'rgba(245,158,11,0.30)', text: '#fde68a' },
  high_degraded:     { bg: 'rgba(245,158,11,0.18)', text: '#fde68a' },
  high_healthy:      { bg: 'rgba(34,197,94,0.12)',   text: '#86efac' },
  medium_down:       { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5' },
  medium_degraded:   { bg: 'rgba(245,158,11,0.12)', text: '#fde68a' },
  medium_healthy:    { bg: 'rgba(34,197,94,0.08)',   text: '#86efac' },
}

export default function EsRiskMatrix({ services = [], riskMatrix = {}, selectedEs, onSelect }) {
  // Group services into matrix cells
  const cellServices = {}
  for (const svc of services) {
    const key = `${svc.criticality}_${svc.status}`
    if (!cellServices[key]) cellServices[key] = []
    cellServices[key].push(svc)
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography fontWeight={700} color="text.secondary" sx={{ ...fSmall, mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Risk Matrix
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '80px repeat(3, 1fr)',
        gridTemplateRows: 'auto repeat(3, 1fr)',
        gap: 0.5,
      }}>
        {/* Header row */}
        <Box /> {/* empty corner */}
        {STATUS_LEVELS.map(s => (
          <Box key={s} sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography fontWeight={700} color="text.secondary" sx={fTiny}>
              {STATUS_LABELS[s]}
            </Typography>
          </Box>
        ))}

        {/* Matrix rows */}
        {CRITICALITY_LEVELS.map(crit => (
          <Box key={crit} sx={{ display: 'contents' }}>
            {/* Row label */}
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1,
            }}>
              <Typography fontWeight={700} color="text.secondary" sx={fTiny}>
                {CRIT_LABELS[crit]}
              </Typography>
            </Box>

            {/* Cells */}
            {STATUS_LEVELS.map(status => {
              const cellKey = `${crit}_${status}`
              const count = riskMatrix[cellKey] || 0
              const svcs = cellServices[cellKey] || []
              const colors = CELL_COLORS[cellKey] || { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8' }

              return (
                <Tooltip
                  key={cellKey}
                  title={svcs.length > 0 ? svcs.map(s => s.name).join(', ') : 'None'}
                  arrow
                >
                  <Box sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: (t) => t.palette.mode === 'dark' ? colors.bg : colors.bg,
                    border: '1px solid',
                    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    minHeight: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: svcs.length > 0 ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    '&:hover': svcs.length > 0 ? {
                      transform: 'scale(1.02)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    } : {},
                  }}>
                    <Typography fontWeight={800} sx={{ fontSize: '1.2rem', color: count > 0 ? 'text.primary' : 'text.disabled' }}>
                      {count}
                    </Typography>
                    {svcs.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, justifyContent: 'center', mt: 0.5 }}>
                        {svcs.map(svc => (
                          <Box
                            key={svc.id}
                            onClick={() => onSelect(svc.id)}
                            sx={{
                              px: 0.5, py: 0.1,
                              borderRadius: 0.5,
                              bgcolor: selectedEs === svc.id ? 'primary.main' : 'rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'primary.main' },
                            }}
                          >
                            <Typography sx={{ ...fTiny, fontSize: '0.55rem', fontWeight: 600, color: selectedEs === svc.id ? '#fff' : 'text.secondary' }} noWrap>
                              {svc.name.length > 12 ? svc.name.slice(0, 12) + '..' : svc.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
