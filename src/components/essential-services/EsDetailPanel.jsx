import { Box, Typography, Chip, IconButton, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'

const fBody  = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const STATUS_CONFIG = {
  healthy:  { Icon: CheckCircleIcon, color: '#22c55e', label: 'Healthy' },
  degraded: { Icon: WarningIcon,     color: '#f59e0b', label: 'Degraded' },
  down:     { Icon: ErrorIcon,       color: '#ef4444', label: 'Down' },
}

const CRIT_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.healthy
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <cfg.Icon sx={{ fontSize: 12, color: cfg.color }} />
      <Typography sx={{ ...fTiny, color: cfg.color, fontWeight: 600 }}>{cfg.label}</Typography>
    </Box>
  )
}

export default function EsDetailPanel({ detail, onClose }) {
  const { service, mapped_apps = [], cto_coverage = [], cbt_coverage = [] } = detail

  if (!service) return null

  const critColor = CRIT_COLORS[service.criticality] || '#94a3b8'
  const stCfg = STATUS_CONFIG[service.status] || STATUS_CONFIG.healthy

  return (
    <Box sx={{
      mt: 2, p: 2,
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography fontWeight={800} sx={fBody}>{service.name}</Typography>
            <Chip
              label={service.criticality.toUpperCase()}
              size="small"
              sx={{
                ...fTiny, height: 20, fontWeight: 800,
                bgcolor: `${critColor}18`, color: critColor,
                border: `1px solid ${critColor}40`,
                borderRadius: 1,
              }}
            />
            <Chip
              icon={<stCfg.Icon sx={{ fontSize: 12, color: `${stCfg.color} !important` }} />}
              label={stCfg.label}
              size="small"
              sx={{
                ...fTiny, height: 20, fontWeight: 700,
                bgcolor: `${stCfg.color}18`, color: stCfg.color,
                border: `1px solid ${stCfg.color}40`,
                borderRadius: 1,
              }}
            />
          </Box>
          <Typography color="text.secondary" sx={fSmall}>
            #{service.id} &middot; {service.app_count} applications &middot; {service.description}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Mapped Applications Table */}
      <Typography fontWeight={700} color="text.secondary" sx={{ ...fSmall, mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Mapped Applications ({mapped_apps.length})
      </Typography>
      <Box sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 1.5,
        overflow: 'hidden', mb: 2,
      }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={fTiny}>Application</TableCell>
              <TableCell sx={fTiny}>SEAL</TableCell>
              <TableCell sx={fTiny}>Status</TableCell>
              <TableCell sx={fTiny}>Deployments</TableCell>
              <TableCell sx={fTiny}>CTO</TableCell>
              <TableCell sx={fTiny}>CBT</TableCell>
              <TableCell sx={fTiny} align="center">P1 (30d)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mapped_apps.map(app => (
              <TableRow key={app.seal} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell sx={{ ...fSmall, fontWeight: 600 }}>{app.name}</TableCell>
                <TableCell sx={{ ...fTiny, color: 'text.secondary' }}>{app.seal}</TableCell>
                <TableCell><StatusPill status={app.status} /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    {app.deploymentTypes.map(dt => (
                      <Chip key={dt} label={dt.toUpperCase()} size="small" sx={{
                        ...fTiny, height: 18, fontWeight: 600,
                        borderRadius: 0.5,
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      }} />
                    ))}
                  </Box>
                </TableCell>
                <TableCell sx={fTiny}>{app.cto}</TableCell>
                <TableCell sx={fTiny}>{app.cbt}</TableCell>
                <TableCell align="center" sx={{
                  ...fTiny, fontWeight: 700,
                  color: app.p1_30d > 0 ? '#ef4444' : 'text.disabled',
                }}>
                  {app.p1_30d}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* CTO / CBT Coverage */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {/* CTO Coverage */}
        <Box>
          <Typography fontWeight={700} color="text.secondary" sx={{ ...fTiny, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            CTO Coverage
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {cto_coverage.map(c => (
              <Box key={c.cto} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1, py: 0.5, borderRadius: 1,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
              }}>
                <StatusPill status={c.status} />
                <Typography sx={{ ...fSmall, flex: 1 }} noWrap>{c.cto}</Typography>
                <Typography sx={{ ...fTiny, color: 'text.disabled' }}>{c.app_count} apps</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* CBT Coverage */}
        <Box>
          <Typography fontWeight={700} color="text.secondary" sx={{ ...fTiny, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            CBT Coverage
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {cbt_coverage.map(c => (
              <Box key={c.cbt} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1, py: 0.5, borderRadius: 1,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
              }}>
                <StatusPill status={c.status} />
                <Typography sx={{ ...fSmall, flex: 1 }} noWrap>{c.cbt}</Typography>
                <Typography sx={{ ...fTiny, color: 'text.disabled' }}>{c.app_count} apps</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
