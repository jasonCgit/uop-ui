import { Box, Typography, Chip, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

const fBody  = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const STATUS_CONFIG = {
  healthy:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  Icon: CheckCircleIcon, label: 'Healthy' },
  degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: WarningIcon,     label: 'Degraded' },
  down:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  Icon: ErrorIcon,       label: 'Down' },
  no_data:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', Icon: HelpOutlineIcon, label: 'No Data' },
}

const CRIT_BADGE = {
  critical: { color: '#ef4444', label: 'CRIT' },
  high:     { color: '#f59e0b', label: 'HIGH' },
  medium:   { color: '#3b82f6', label: 'MED' },
}

export default function EsStatusBanner({ services = [], kpis = {}, selectedEs, onSelect }) {
  return (
    <Box sx={{ mb: 2 }}>
      {/* KPI summary row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography fontWeight={800} sx={fBody}>Essential Services</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[
            { key: 'healthy', icon: CheckCircleIcon, color: '#22c55e' },
            { key: 'degraded', icon: WarningIcon, color: '#f59e0b' },
            { key: 'down', icon: ErrorIcon, color: '#ef4444' },
          ].map(({ key, icon: Icon, color }) => (
            <Chip
              key={key}
              icon={<Icon sx={{ fontSize: 14, color: `${color} !important` }} />}
              label={`${kpis[key] || 0} ${key}`}
              size="small"
              sx={{
                ...fTiny, fontWeight: 700, height: 24,
                bgcolor: `${color}10`, border: `1px solid ${color}30`,
                borderRadius: 1.5,
              }}
            />
          ))}
        </Box>
        <Typography color="text.disabled" sx={fTiny}>
          {kpis.total || 0} total services
        </Typography>
      </Box>

      {/* Table */}
      <Box sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 2,
        overflow: 'hidden',
      }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ ...fTiny, fontWeight: 700, width: 60 }}>Status</TableCell>
              <TableCell sx={{ ...fTiny, fontWeight: 700, width: 60 }}>ID</TableCell>
              <TableCell sx={{ ...fTiny, fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ ...fTiny, fontWeight: 700, width: 70 }}>Criticality</TableCell>
              <TableCell sx={{ ...fTiny, fontWeight: 700, width: 50 }} align="center">Apps</TableCell>
              <TableCell sx={{ ...fTiny, fontWeight: 700, width: 50 }} align="center">Deploys</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((svc) => {
              const cfg = STATUS_CONFIG[svc.status] || STATUS_CONFIG.no_data
              const crit = CRIT_BADGE[svc.criticality]
              const isSelected = selectedEs === svc.id

              return (
                <TableRow
                  key={svc.id}
                  onClick={() => onSelect(svc.id)}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { borderBottom: 0 },
                    ...(isSelected && {
                      bgcolor: cfg.bg,
                      '& td': { borderColor: `${cfg.color}30` },
                    }),
                  }}
                >
                  {/* Status */}
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: cfg.color,
                        boxShadow: `0 0 4px ${cfg.color}60`,
                        flexShrink: 0,
                      }} />
                      <Typography sx={{ ...fTiny, color: cfg.color, fontWeight: 600 }}>
                        {cfg.label}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* ID */}
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography color="text.secondary" sx={fTiny}>
                      {svc.id}
                    </Typography>
                  </TableCell>

                  {/* Name */}
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography fontWeight={isSelected ? 700 : 600} sx={{ ...fSmall, lineHeight: 1.3 }}>
                      {svc.name}
                    </Typography>
                  </TableCell>

                  {/* Criticality */}
                  <TableCell sx={{ py: 0.75 }}>
                    {crit && (
                      <Typography sx={{
                        ...fTiny, fontWeight: 800, color: crit.color,
                        letterSpacing: 0.5,
                      }}>
                        {crit.label}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Apps */}
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Typography sx={fTiny}>{svc.app_count}</Typography>
                  </TableCell>

                  {/* Deployments */}
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Typography sx={{ ...fTiny, color: 'text.secondary' }}>{svc.deployment_count}</Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}
