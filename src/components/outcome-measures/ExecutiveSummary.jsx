import { Grid, Card, CardContent, Typography, Box, Chip, LinearProgress, Divider } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import SpeedIcon from '@mui/icons-material/Speed'
import ShieldIcon from '@mui/icons-material/Shield'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import InsightsIcon from '@mui/icons-material/Insights'
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

function MetricChip({ label, pct, lowerIsBetter }) {
  const improved = lowerIsBetter ? pct < 0 : pct > 0
  const color = pct === 0 ? 'default' : improved ? 'success' : 'error'
  return (
    <Chip
      size="small"
      label={`${label} ${pct > 0 ? '+' : ''}${pct}%`}
      color={color}
      variant="outlined"
      sx={{ ...fSmall, height: 20 }}
    />
  )
}

function PerformerRow({ row, index, variant }) {
  const isTop = variant === 'top'
  const scoreColor = row.composite_score > 0 ? '#4caf50' : row.composite_score < 0 ? '#f44336' : '#78909c'
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1, py: 0.6,
      borderBottom: '1px solid', borderColor: 'divider',
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Typography sx={{ ...fBody, fontWeight: 700, color: scoreColor, minWidth: 20, textAlign: 'center' }}>
        {index + 1}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ ...fBody, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {row.cto}
        </Typography>
        <Typography sx={{ ...fSmall, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {row.cbt} ({row.app_count} apps)
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <MetricChip label="MTTR" pct={row.mttr_pct} lowerIsBetter />
        <MetricChip label="P1" pct={row.p1_pct} lowerIsBetter />
        <MetricChip label="SRs" pct={row.service_req_pct} lowerIsBetter />
      </Box>
    </Box>
  )
}

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

  const { top_performers = [], bottom_performers = [], workstream_insights = [] } = data
  const strong = workstream_insights.filter(w => w.status === 'strong')
  const needsAttention = workstream_insights.filter(w => w.status === 'needs_attention')

  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderColor: 'primary.main', borderWidth: 1, borderStyle: 'solid' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Typography sx={{ ...fTitle, fontWeight: 700 }}>
            Executive Summary
          </Typography>
          <Chip
            label={`${data.total_cto_cbts} CTO/CBTs`}
            size="small"
            variant="outlined"
            sx={{ ...fSmall, height: 20 }}
          />
          {strong.length > 0 && (
            <Chip
              icon={<CheckCircleOutlineIcon sx={{ fontSize: 13 }} />}
              label={`${strong.length} workstreams strong`}
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

        <Grid container spacing={1.5}>
          {/* Top Performers */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <EmojiEventsIcon sx={{ fontSize: 16, color: '#ffd700' }} />
              <Typography sx={{ ...fBody, fontWeight: 700, color: '#4caf50' }}>
                Making a Dent
              </Typography>
            </Box>
            <Typography sx={{ ...fSmall, color: 'text.secondary', mb: 0.5 }}>
              CTO/CBTs with greatest SRE & support improvements
            </Typography>
            {top_performers.map((row, i) => (
              <PerformerRow key={`${row.cto}-${row.cbt}`} row={row} index={i} variant="top" />
            ))}
          </Grid>

          {/* Bottom Performers */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <WarningAmberIcon sx={{ fontSize: 16, color: '#ff9800' }} />
              <Typography sx={{ ...fBody, fontWeight: 700, color: '#f44336' }}>
                Needs Focus
              </Typography>
            </Box>
            <Typography sx={{ ...fSmall, color: 'text.secondary', mb: 0.5 }}>
              CTO/CBTs with least improvement or regression
            </Typography>
            {bottom_performers.map((row, i) => (
              <PerformerRow key={`${row.cto}-${row.cbt}`} row={row} index={i} variant="bottom" />
            ))}
          </Grid>

          {/* Workstream Effectiveness */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <InsightsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography sx={{ ...fBody, fontWeight: 700 }}>
                Workstream Effectiveness
              </Typography>
            </Box>
            <Typography sx={{ ...fSmall, color: 'text.secondary', mb: 0.5 }}>
              Ranked by adoption, maturity, and value score
            </Typography>
            {workstream_insights.map(ws => (
              <WorkstreamInsight key={ws.id} ws={ws} />
            ))}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
