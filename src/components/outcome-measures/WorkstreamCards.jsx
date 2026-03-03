import { Grid, Card, Typography, Box, LinearProgress, Chip } from '@mui/material'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import SpeedIcon from '@mui/icons-material/Speed'
import ShieldIcon from '@mui/icons-material/Shield'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import InsightsIcon from '@mui/icons-material/Insights'
import PsychologyIcon from '@mui/icons-material/Psychology'
import HubIcon from '@mui/icons-material/Hub'

const ICON_MAP = {
  MonitorHeart: MonitorHeartIcon,
  Speed: SpeedIcon,
  Shield: ShieldIcon,
  AccountTree: AccountTreeIcon,
  SmartToy: SmartToyIcon,
  Insights: InsightsIcon,
  Psychology: PsychologyIcon,
  Hub: HubIcon,
}

const fLabel = { fontSize: 'clamp(0.72rem, 0.88vw, 0.82rem)' }
const fValue = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)', fontWeight: 700 }
const fSmall = { fontSize: 'clamp(0.58rem, 0.72vw, 0.65rem)' }

export default function WorkstreamCards({ data }) {
  if (!data?.metrics || !data?.workstream_defs) return null

  const defs = data.workstream_defs
  const metrics = data.metrics

  return (
    <Grid container spacing={1} sx={{ mb: 1 }}>
      {defs.map(ws => {
        const m = metrics[ws.id]
        if (!m) return null
        const Icon = ICON_MAP[ws.icon] || InsightsIcon
        const adoptionColor = m.adoption_pct > 75 ? '#4caf50' : m.adoption_pct > 50 ? '#ffa726' : '#f44336'

        return (
          <Grid item xs={6} sm={4} md={3} key={ws.id}>
            <Card variant="outlined" sx={{ p: 1.5, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography sx={{ ...fLabel, fontWeight: 600, lineHeight: 1.2 }}>
                  {m.label}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Adoption</Typography>
                <Typography sx={{ ...fValue, color: adoptionColor }}>
                  {m.adoption_pct}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={m.adoption_pct}
                sx={{
                  height: 4, borderRadius: 2, mb: 1,
                  bgcolor: `${adoptionColor}20`,
                  '& .MuiLinearProgress-bar': { bgcolor: adoptionColor, borderRadius: 2 },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Apps</Typography>
                <Typography sx={fSmall}>{m.adopted_count} / {m.total_apps}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Maturity</Typography>
                <Chip label={`${m.avg_maturity}%`} size="small" variant="outlined" sx={{ ...fSmall, height: 18 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Value Score</Typography>
                <Chip label={`${m.avg_value_score}%`} size="small" variant="outlined" sx={{ ...fSmall, height: 18 }} />
              </Box>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}
