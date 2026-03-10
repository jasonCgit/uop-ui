import { Card, CardContent, Typography, Box, Chip, LinearProgress } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import InsightsIcon from '@mui/icons-material/Insights'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import SpeedIcon from '@mui/icons-material/Speed'
import ShieldIcon from '@mui/icons-material/Shield'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PsychologyIcon from '@mui/icons-material/Psychology'
import HubIcon from '@mui/icons-material/Hub'

const ICON_MAP = {
  MonitorHeart: MonitorHeartIcon, Speed: SpeedIcon, Shield: ShieldIcon,
  AccountTree: AccountTreeIcon, SmartToy: SmartToyIcon, Insights: InsightsIcon,
  Psychology: PsychologyIcon, Hub: HubIcon,
}

const fTitle = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fBody = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fSmall = { fontSize: 'clamp(0.58rem, 0.72vw, 0.65rem)' }

function WorkstreamInsight({ ws }) {
  const Icon = ICON_MAP[ws.icon] || InsightsIcon
  const statusConfig = {
    strong: { color: '#4caf50', label: 'Strong', icon: CheckCircleOutlineIcon },
    moderate: { color: '#ffa726', label: 'Moderate', icon: WarningAmberIcon },
    needs_attention: { color: '#f44336', label: 'Needs Attention', icon: ErrorOutlineIcon },
  }
  const cfg = statusConfig[ws.status] || statusConfig.moderate
  const StatusIcon = cfg.icon

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1, py: 0.5,
      borderBottom: '1px solid', borderColor: 'divider',
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Icon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ ...fBody, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ws.label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
          <Box sx={{ flex: 1, maxWidth: 80 }}>
            <LinearProgress
              variant="determinate"
              value={ws.effectiveness}
              sx={{
                height: 4, borderRadius: 2,
                bgcolor: `${cfg.color}20`,
                '& .MuiLinearProgress-bar': { bgcolor: cfg.color, borderRadius: 2 },
              }}
            />
          </Box>
          <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
            {ws.adoption_pct}% adopt
          </Typography>
        </Box>
      </Box>
      <Chip
        size="small"
        icon={<StatusIcon sx={{ fontSize: 13 }} />}
        label={cfg.label}
        sx={{ ...fSmall, height: 20, color: cfg.color, borderColor: `${cfg.color}60` }}
        variant="outlined"
      />
    </Box>
  )
}

export default function ExecutiveSummary({ data }) {
  if (!data) return null

  const { workstream_insights = [] } = data
  const strong = workstream_insights.filter(w => w.status === 'strong')
  const needsAttention = workstream_insights.filter(w => w.status === 'needs_attention')

  if (!workstream_insights.length) return null

  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderColor: 'primary.main', borderWidth: 1, borderStyle: 'solid' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <InsightsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography sx={{ ...fTitle, fontWeight: 700 }}>
            Workstream Effectiveness
          </Typography>
          {strong.length > 0 && (
            <Chip
              icon={<CheckCircleOutlineIcon sx={{ fontSize: 13 }} />}
              label={`${strong.length} strong`}
              size="small" color="success" variant="outlined"
              sx={{ ...fSmall, height: 20 }}
            />
          )}
          {needsAttention.length > 0 && (
            <Chip
              icon={<ErrorOutlineIcon sx={{ fontSize: 13 }} />}
              label={`${needsAttention.length} need attention`}
              size="small" color="error" variant="outlined"
              sx={{ ...fSmall, height: 20 }}
            />
          )}
        </Box>
        <Typography sx={{ ...fSmall, color: 'text.secondary', mb: 1 }}>
          Ranked by adoption, maturity, and value score
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 0 }}>
          {workstream_insights.map(ws => (
            <WorkstreamInsight key={ws.id} ws={ws} />
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
