import { Grid, Card, CardContent, Typography, Box, Chip, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

const fLabel = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fValue = { fontSize: 'clamp(1.4rem, 2.4vw, 2rem)', fontWeight: 700 }
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }
const fHeader = { fontSize: 'clamp(0.76rem, 0.95vw, 0.88rem)', fontWeight: 600 }
// AURA card fonts — match AIHealthPanel on home page
const fAuraTitle   = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }
const fAuraBody    = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fAuraCaption = { fontSize: 'clamp(0.68rem, 0.9vw, 0.78rem)' }

const BUCKET_CONFIG = {
  adoption: {
    title: 'People are using our tools more and more',
    subtitle: 'Adoption',
    accent: '#1565c0',
    bg: '#e3f2fd',
    bgDark: '#0d47a110',
  },
  sre_coverage: {
    title: 'Using our tools accelerates SRE coverage',
    subtitle: 'SRE Coverage',
    accent: '#00695c',
    bg: '#e0f2f1',
    bgDark: '#00695c10',
  },
  results: {
    title: 'You achieve reliability, cost and efficiency results',
    subtitle: 'Results',
    accent: '#e65100',
    bg: '#fff3e0',
    bgDark: '#e6510010',
  },
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
      sx={{ height: 22, ...fSmall, '& .MuiChip-icon': { ml: 0.3 } }}
    />
  )
}

function HeroKpi({ kpi }) {
  const improved = kpi.lower_is_better ? kpi.pct_change < 0 : kpi.pct_change > 0
  const accentColor = kpi.pct_change === 0 ? '#78909c' : improved ? '#2e7d32' : '#c62828'
  return (
    <Card variant="outlined" sx={{
      p: 1.5, height: '100%',
      display: 'flex', flexDirection: 'column', gap: 0.75,
      background: (t) => t.palette.mode === 'dark' ? '#ffffff08' : '#ffffff90',
      borderColor: (t) => t.palette.mode === 'dark' ? '#ffffff15' : '#00000012',
    }}>
      <Typography sx={{ ...fLabel, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {kpi.label}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center', rowGap: 0.5, columnGap: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography sx={{ ...fValue, color: accentColor, lineHeight: 1.2 }}>
            {typeof kpi.current === 'number' ? kpi.current.toLocaleString() : kpi.current}
          </Typography>
          {kpi.unit && (
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>{kpi.unit}</Typography>
          )}
        </Box>
        <TrendBadge pct={kpi.pct_change} lowerIsBetter={kpi.lower_is_better} />
        <Typography sx={{ ...fSmall, color: 'text.disabled' }}>
          Baseline: {typeof kpi.baseline === 'number' ? kpi.baseline.toLocaleString() : kpi.baseline}{kpi.unit ? ` ${kpi.unit}` : ''}
        </Typography>
        {kpi.spark?.length > 1 ? (
          <MiniSparkline data={kpi.spark} color={accentColor} />
        ) : <Box />}
      </Box>
    </Card>
  )
}

function BucketCard({ bucketKey, items, sx }) {
  const cfg = BUCKET_CONFIG[bucketKey]
  const isResults = bucketKey === 'results'
  return (
    <Card
      variant="outlined"
      sx={{
        p: 1.75,
        borderLeft: `4px solid ${cfg.accent}`,
        borderColor: (t) => t.palette.mode === 'dark' ? `${cfg.accent}30` : undefined,
        borderLeftColor: cfg.accent,
        background: (t) => t.palette.mode === 'dark' ? cfg.bgDark : cfg.bg,
        height: '100%',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.75 }}>
        <Typography sx={{
          ...fHeader,
          color: cfg.accent,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {cfg.subtitle}
        </Typography>
        <Typography sx={{ ...fHeader, color: 'text.primary', whiteSpace: 'nowrap' }}>
          {cfg.title}
        </Typography>
      </Box>
      <Grid container spacing={2} justifyContent="center">
        {items.map((kpi, i) => (
          <Grid item xs={6} key={i}>
            <HeroKpi kpi={kpi} />
          </Grid>
        ))}
      </Grid>
    </Card>
  )
}

export default function ExecutiveKpiBar({ kpis, appCount, baselinePeriod, onBaselinePeriodChange }) {
  if (!kpis?.length) return null

  const grouped = {}
  for (const kpi of kpis) {
    const b = kpi.bucket || 'adoption'
    if (!grouped[b]) grouped[b] = []
    grouped[b].push(kpi)
  }

  // Build AURA-style verbal insights from KPI data
  const buildInsights = (bucketKpis, bucketName) => {
    if (!bucketKpis?.length) return null
    const improving = bucketKpis.filter(k => k.lower_is_better ? k.pct_change < 0 : k.pct_change > 0)
    const declining = bucketKpis.filter(k => k.lower_is_better ? k.pct_change > 0 : k.pct_change < 0)
    const top = [...bucketKpis].sort((a, b) => Math.abs(b.pct_change) - Math.abs(a.pct_change))[0]
    if (improving.length === bucketKpis.length) {
      return { status: 'positive', text: `All ${bucketName} metrics trending positively — ${top.label} leads at ${top.pct_change > 0 ? '+' : ''}${top.pct_change}%.` }
    } else if (declining.length > improving.length) {
      return { status: 'warning', text: `${declining.length} of ${bucketKpis.length} ${bucketName} metrics declining — ${top.label} at ${top.pct_change > 0 ? '+' : ''}${top.pct_change}%.` }
    } else {
      return { status: 'mixed', text: `${improving.length} of ${bucketKpis.length} ${bucketName} metrics improving — ${top.label} at ${top.pct_change > 0 ? '+' : ''}${top.pct_change}%.` }
    }
  }
  const insights = [
    buildInsights(grouped.adoption, 'Adoption'),
    buildInsights(grouped.sre_coverage, 'SRE Coverage'),
    buildInsights(grouped.results, 'Results'),
  ].filter(Boolean)

  // Build recommendations
  const recommendations = []
  for (const kpi of kpis) {
    const declining = kpi.lower_is_better ? kpi.pct_change > 0 : kpi.pct_change < 0
    if (declining && Math.abs(kpi.pct_change) > 10) {
      recommendations.push(`Investigate ${kpi.label} — ${kpi.pct_change > 0 ? '+' : ''}${kpi.pct_change}% change needs attention.`)
    }
  }
  if (recommendations.length === 0) {
    recommendations.push('All metrics are within expected ranges. Continue monitoring current trajectory.')
  }

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 'clamp(0.95rem, 1.3vw, 1.1rem)' }}>
          Executive Summary
        </Typography>
        <Chip label={`${appCount} apps`} size="small" variant="outlined" sx={{ height: 20, ...fSmall }} />
        <Box sx={{ ml: 'auto' }}>
          <ToggleButtonGroup
            size="small"
            value={baselinePeriod || '12m'}
            exclusive
            onChange={(_, v) => v && onBaselinePeriodChange?.(v)}
          >
            <ToggleButton value="3m" sx={{ ...fSmall, py: 0.2, px: 0.8, textTransform: 'none' }}>3-month</ToggleButton>
            <ToggleButton value="6m" sx={{ ...fSmall, py: 0.2, px: 0.8, textTransform: 'none' }}>6-month</ToggleButton>
            <ToggleButton value="12m" sx={{ ...fSmall, py: 0.2, px: 0.8, textTransform: 'none' }}>12-month</ToggleButton>
            <ToggleButton value="ytd" sx={{ ...fSmall, py: 0.2, px: 0.8, textTransform: 'none' }}>YTD</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      {insights.length > 0 && (
        <Card
          sx={{
            mb: 1.5,
            border: '2px solid transparent',
            backgroundImage: (t) => {
              const bg = t.palette.background.paper
              return `linear-gradient(${bg}, ${bg}), linear-gradient(135deg, #1565C0, #0ea5e9)`
            },
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoAwesomeIcon sx={{ color: (t) => t.palette.mode === 'dark' ? '#60a5fa' : '#1565C0', fontSize: 20, mt: 0.2 }} />
              <Tooltip
                title="Agentic, Unified Personas, Reliability, Automation"
                arrow
                placement="top"
                slotProps={{
                  tooltip: { sx: { bgcolor: 'rgba(30,41,59,0.95)', color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 500, px: 1.5, py: 0.75, borderRadius: 1.5 } },
                  arrow: { sx: { color: 'rgba(30,41,59,0.95)' } },
                }}
              >
                <Typography fontWeight={700} sx={{ ...fAuraTitle, cursor: 'default', borderBottom: '1px dashed rgba(148,163,184,0.4)' }}>
                  AURA
                </Typography>
              </Tooltip>
              <Typography fontWeight={700} sx={fAuraTitle}>— Outcome Insights</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {insights.map((ins, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0, mt: '7px',
                    bgcolor: ins.status === 'positive' ? '#4caf50' : ins.status === 'warning' ? '#f44336' : '#ffa726',
                  }} />
                  <Typography sx={{ ...fAuraBody, color: 'text.primary', lineHeight: 1.6 }}>{ins.text}</Typography>
                </Box>
              ))}
            </Box>
            {recommendations.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, ...fAuraCaption }}>
                  Recommendations:
                </Typography>
                <Box component="ul" sx={{ mt: 0.3, mb: 0, pl: 2, listStyle: 'none' }}>
                  {recommendations.slice(0, 3).map((rec, i) => (
                    <Box component="li" key={i} sx={{ display: 'flex', gap: 1, py: 0.2 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1565C0', flexShrink: 0, mt: '7px' }} />
                      <Typography sx={{ ...fAuraBody, color: 'text.primary', lineHeight: 1.6 }}>{rec}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      <Grid container spacing={1}>
        {/* Left column: Adoption stacked over SRE Coverage */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
            {grouped.adoption?.length > 0 && (
              <BucketCard bucketKey="adoption" items={grouped.adoption} />
            )}
            {grouped.sre_coverage?.length > 0 && (
              <BucketCard bucketKey="sre_coverage" items={grouped.sre_coverage} />
            )}
          </Box>
        </Grid>
        {/* Right column: Results spanning full height */}
        {grouped.results?.length > 0 && (
          <Grid item xs={12} md={6}>
            <BucketCard bucketKey="results" items={grouped.results} />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
