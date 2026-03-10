import { Grid, Card, Typography, Box, Chip } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'

const fTitle = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fValue = { fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', fontWeight: 700 }
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)' }

const BUCKET_CONFIG = {
  adoption:     { label: 'ADOPTION',     color: '#1976d2' },
  sre_coverage: { label: 'SRE COVERAGE', color: '#7b1fa2' },
  results:      { label: 'RESULTS',      color: '#2e7d32' },
}

function MiniSparkline({ data, color, width = 48, height = 18 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

function TrendBadge({ pct, lowerIsBetter }) {
  const improved = lowerIsBetter ? pct < 0 : pct > 0
  const color = pct === 0 ? 'default' : improved ? 'success' : 'error'
  const Icon = pct === 0 ? TrendingFlatIcon : pct > 0 ? TrendingUpIcon : TrendingDownIcon
  return (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: 14 }} />}
      label={`${pct > 0 ? '+' : ''}${pct}%`}
      color={color}
      variant="outlined"
      sx={{ height: 20, ...fSmall, '& .MuiChip-icon': { ml: 0.3 } }}
    />
  )
}

function KpiCard({ kpi }) {
  const improved = kpi.lower_is_better ? kpi.pct_change < 0 : kpi.pct_change > 0
  const accentColor = kpi.pct_change === 0 ? '#78909c' : improved ? '#4caf50' : '#f44336'
  return (
    <Card variant="outlined" sx={{
      p: 1.5, height: '100%',
      borderColor: `${accentColor}30`,
      background: (t) => t.palette.mode === 'dark' ? `${accentColor}08` : `${accentColor}05`,
    }}>
      <Typography sx={{ ...fTitle, color: 'text.secondary', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {kpi.label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography sx={{ ...fValue, color: accentColor }}>
          {typeof kpi.current === 'number' ? kpi.current.toLocaleString() : kpi.current}
        </Typography>
        {kpi.unit && (
          <Typography sx={{ ...fSmall, color: 'text.secondary' }}>{kpi.unit}</Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <TrendBadge pct={kpi.pct_change} lowerIsBetter={kpi.lower_is_better} />
        {kpi.spark?.length > 1 && (
          <MiniSparkline data={kpi.spark} color={accentColor} />
        )}
      </Box>
      <Typography sx={{ ...fSmall, color: 'text.disabled', mt: 0.3 }}>
        Baseline: {typeof kpi.baseline === 'number' ? kpi.baseline.toLocaleString() : kpi.baseline}{kpi.unit ? ` ${kpi.unit}` : ''}
      </Typography>
    </Card>
  )
}

export default function ExecutiveKpiBar({ kpis, appCount }) {
  if (!kpis?.length) return null

  const bucketOrder = ['adoption', 'sre_coverage', 'results']
  const grouped = {}
  for (const kpi of kpis) {
    const b = kpi.bucket || 'adoption'
    if (!grouped[b]) grouped[b] = []
    grouped[b].push(kpi)
  }

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }}>
          Outcome Measures
        </Typography>
        <Chip label={`${appCount} apps`} size="small" variant="outlined" sx={{ height: 20, ...fSmall }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {bucketOrder.map(bucketKey => {
          const items = grouped[bucketKey]
          if (!items?.length) return null
          const cfg = BUCKET_CONFIG[bucketKey] || { label: bucketKey.toUpperCase(), color: '#78909c' }
          return (
            <Box key={bucketKey}>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', mb: 0.5, px: 1, py: 0.25,
                borderRadius: 1, background: `${cfg.color}15`, borderLeft: `3px solid ${cfg.color}`,
              }}>
                <Typography sx={{ fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)', fontWeight: 700, color: cfg.color, letterSpacing: '0.05em' }}>
                  {cfg.label}
                </Typography>
              </Box>
              <Grid container spacing={1}>
                {items.map((kpi, i) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
                    <KpiCard kpi={kpi} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
