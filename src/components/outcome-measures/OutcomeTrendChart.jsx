import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const fTitle = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }

const METRIC_LABELS = {
  prompts: 'AI Prompts',
  dau: 'Daily Active Users',
  uop_views: 'UOP Page Views',
  feature_adoption: 'Feature Adoption',
  mttr: 'Mean Time to Resolve',
  p1_incidents: 'P1 Incidents',
  p2_incidents: 'P2 Incidents',
  noise_events: 'Noise Events',
  true_impact_dur: 'True Impact Duration',
  slo_compliance: 'SLO Compliance',
  error_budget: 'Error Budget',
  service_requests: 'Service Requests',
  self_service_pct: 'Self-Service Rate',
  escalations: 'Escalations',
}

const COLORS = ['#42a5f5', '#66bb6a', '#ff7043', '#ab47bc', '#ffa726', '#26c6da', '#ef5350']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
      borderRadius: 1, p: '6px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <Typography sx={{ color: 'text.secondary', ...fSmall, mb: 0.3 }}>{label}</Typography>
      {payload.map(p => (
        <Typography key={p.dataKey} sx={{ color: p.color, fontWeight: 600, ...fSmall }}>
          {METRIC_LABELS[p.dataKey] || p.dataKey}: {p.value?.toLocaleString()}
        </Typography>
      ))}
    </Box>
  )
}

export default function OutcomeTrendChart({ data, monthLabels }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const metrics = data?.metrics || {}
  const metricKeys = Object.keys(metrics).filter(k => metrics[k]?.trend)

  const [selectedMetrics, setSelectedMetrics] = useState(() => metricKeys.slice(0, 2))

  // Reset selection when the section (and therefore metricKeys) changes
  const metricKeysStr = metricKeys.join(',')
  useEffect(() => {
    setSelectedMetrics(metricKeys.slice(0, 2))
  }, [metricKeysStr]) // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = useMemo(() => {
    if (!monthLabels?.length || !metricKeys.length) return []
    return monthLabels.map((label, i) => {
      const point = { month: label }
      for (const mk of metricKeys) {
        const trend = metrics[mk]?.trend
        if (trend && trend.length > i) {
          point[mk] = trend[i]
        }
      }
      return point
    })
  }, [monthLabels, metrics, metricKeys])

  const handleToggle = (_, newSelection) => {
    if (newSelection?.length > 0) {
      setSelectedMetrics(newSelection)
    }
  }

  if (!chartData.length) return null

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
          <Typography sx={{ ...fTitle, fontWeight: 600 }}>12-Month Trend</Typography>
          <ToggleButtonGroup
            size="small"
            value={selectedMetrics}
            onChange={handleToggle}
            sx={{ flexWrap: 'wrap' }}
          >
            {metricKeys.map((mk, i) => (
              <ToggleButton
                key={mk}
                value={mk}
                sx={{
                  ...fSmall, py: 0.2, px: 0.8, textTransform: 'none',
                  '&.Mui-selected': { color: COLORS[i % COLORS.length], borderColor: COLORS[i % COLORS.length] + '60' },
                }}
              >
                {METRIC_LABELS[mk] || mk}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
            <XAxis dataKey="month" tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 10 }} />
            <YAxis tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 10 }} width={45} />
            <Tooltip content={<CustomTooltip />} />
            {selectedMetrics.map((mk, i) => {
              const baseline = metrics[mk]?.baseline
              return [
                <Line
                  key={mk}
                  type="monotone"
                  dataKey={mk}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />,
                baseline != null && (
                  <ReferenceLine
                    key={`bl-${mk}`}
                    y={baseline}
                    stroke={COLORS[i % COLORS.length]}
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    label={{ value: `Baseline`, fill: COLORS[i % COLORS.length], fontSize: 9, position: 'right' }}
                  />
                ),
              ]
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
