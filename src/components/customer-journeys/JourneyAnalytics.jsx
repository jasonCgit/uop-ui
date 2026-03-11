import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, ToggleButtonGroup, ToggleButton, Divider,
} from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { API_URL } from '../../config'

const COLORS = ['#1565c0', '#00695c', '#e65100', '#6a1b9a', '#c62828']
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }
const fLabel = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fValue = { fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)', fontWeight: 700 }

const METRIC_LABELS = {
  slo_compliance: 'SLO Compliance',
  error_budget_remaining: 'Error Budget',
  incident_count: 'Incidents (30d)',
  change_velocity: 'Change Velocity',
  customer_satisfaction: 'Customer Satisfaction',
}

export default function JourneyAnalytics({ filterQs, refreshTick }) {
  const [journeyList, setJourneyList] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeMetrics, setActiveMetrics] = useState(['slo_compliance', 'error_budget_remaining'])

  // Fetch journey list + summary
  useEffect(() => {
    setError(null)
    Promise.all([
      fetch(`${API_URL}/api/customer-journeys/list${filterQs || ''}`).then(r => r.json()),
      fetch(`${API_URL}/api/customer-journeys/analytics/summary${filterQs || ''}`).then(r => r.json()),
    ])
      .then(([list, summary]) => {
        setJourneyList(list.journeys || [])
        setSummaryData(summary)
        if (!selectedId && list.journeys?.length) setSelectedId(list.journeys[0].id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filterQs, refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch analytics for selected journey
  useEffect(() => {
    if (!selectedId) return
    fetch(`${API_URL}/api/customer-journeys/${selectedId}/analytics${filterQs || ''}`)
      .then(r => r.json())
      .then(setAnalytics)
      .catch(e => setError(e.message))
  }, [selectedId, filterQs])

  const chartData = useMemo(() => {
    if (!analytics) return []
    const labels = analytics.month_labels || []
    return labels.map((label, i) => {
      const point = { month: label }
      for (const mk of activeMetrics) {
        const metric = analytics.metrics[mk]
        if (metric?.trend?.[i] !== undefined) {
          point[mk] = metric.trend[i]
        }
      }
      return point
    })
  }, [analytics, activeMetrics])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  const allAlerts = summaryData?.alerts || []

  return (
    <Box>
      {/* Proactive Alerts Banner */}
      {allAlerts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...fLabel, fontWeight: 700, mb: 1 }}>Proactive Alerts</Typography>
          {allAlerts.slice(0, 5).map((alert, i) => (
            <Card key={i} sx={{
              mb: 0.75,
              border: `1px solid ${alert.severity === 'critical' ? '#f4433644' : '#ff980044'}`,
              bgcolor: alert.severity === 'critical' ? '#f443360a' : '#ff98000a',
            }}>
              <CardContent sx={{ py: '8px !important', px: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {alert.severity === 'critical'
                  ? <ErrorIcon sx={{ fontSize: 16, color: '#f44336' }} />
                  : <WarningAmberIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                }
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{alert.message}</Typography>
                  <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
                    {alert.journey_name} · {alert.metric}: {alert.current_value} (target: {alert.target_value})
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Journey selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 300 }}>
          <InputLabel>Select Journey</InputLabel>
          <Select value={selectedId || ''} label="Select Journey" onChange={e => setSelectedId(e.target.value)}
            sx={{ fontSize: '0.82rem' }}>
            {journeyList.map(j => (
              <MenuItem key={j.id} value={j.id} sx={{ fontSize: '0.82rem' }}>
                {j.name}
                <Chip label={j.status} size="small" sx={{
                  ml: 1, height: 16, fontSize: '0.55rem',
                  color: j.status === 'healthy' ? '#4caf50' : j.status === 'critical' ? '#f44336' : '#ff9800',
                }} variant="outlined" />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {analytics && (
        <>
          {/* Metric KPI cards */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {Object.entries(analytics.metrics).map(([key, metric]) => (
              <Grid item xs={6} sm={4} md key={key}>
                <Card sx={{
                  border: `1px solid ${activeMetrics.includes(key) ? '#1565c040' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: '0.2s',
                  '&:hover': { borderColor: '#1565c060' },
                }}
                  onClick={() => {
                    setActiveMetrics(prev =>
                      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
                    )
                  }}
                >
                  <CardContent sx={{ py: '10px !important', px: 1.5, textAlign: 'center' }}>
                    <Typography sx={{ ...fSmall, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {METRIC_LABELS[key] || key}
                    </Typography>
                    <Typography sx={{ ...fValue, color: activeMetrics.includes(key) ? '#1565c0' : 'text.primary' }}>
                      {metric.current}{metric.unit === '%' || metric.unit === 'score' ? '' : ` ${metric.unit || ''}`}
                      {(metric.unit === '%' || metric.unit === 'score') ? metric.unit === '%' ? '%' : '' : ''}
                    </Typography>
                    <Chip
                      label={`${metric.pct_change >= 0 ? '+' : ''}${metric.pct_change}%`}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.6rem', fontWeight: 600,
                        color: (metric.lower_is_better ? metric.pct_change <= 0 : metric.pct_change >= 0) ? '#4caf50' : '#f44336',
                      }}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Trend Chart */}
          {chartData.length > 0 && activeMetrics.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography sx={{ ...fLabel, fontWeight: 700, mb: 1 }}>12-Month Trends</Typography>
                <Box sx={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      {activeMetrics.map((mk, i) => (
                        <Line
                          key={mk}
                          type="monotone"
                          dataKey={mk}
                          name={METRIC_LABELS[mk] || mk}
                          stroke={COLORS[i % COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                      {activeMetrics.map((mk, i) => {
                        const metric = analytics.metrics[mk]
                        if (!metric?.baseline) return null
                        return (
                          <ReferenceLine
                            key={`ref-${mk}`}
                            y={metric.baseline}
                            stroke={COLORS[i % COLORS.length]}
                            strokeDasharray="5 5"
                            opacity={0.5}
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>

                {/* Metric toggle */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {Object.entries(METRIC_LABELS).map(([key, label]) => (
                    <Chip
                      key={key}
                      label={label}
                      size="small"
                      onClick={() => setActiveMetrics(prev =>
                        prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
                      )}
                      sx={{
                        height: 24, fontSize: '0.65rem', fontWeight: 600,
                        bgcolor: activeMetrics.includes(key) ? '#1565c015' : 'transparent',
                        border: activeMetrics.includes(key) ? '1px solid #1565c040' : '1px solid',
                        borderColor: activeMetrics.includes(key) ? '#1565c040' : 'divider',
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* AURA Narrative */}
          {analytics.aura_narrative && (
            <Card sx={{ border: '1px solid #1565c030', bgcolor: '#1565c005' }}>
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 16, color: '#1565c0' }} />
                  <Typography sx={{ ...fLabel, fontWeight: 700, color: '#1565c0' }}>AURA Insights</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.6, color: 'text.secondary' }}>
                  {analytics.aura_narrative.replace(/\*\*/g, '')}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* SLO Detail */}
          {analytics.slo_detail && (
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography sx={{ ...fLabel, fontWeight: 700, mb: 1 }}>SLO Details</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Target', value: `${analytics.slo_detail.target}%` },
                    { label: 'Current', value: `${analytics.slo_detail.current}%`, color: analytics.slo_detail.current >= analytics.slo_detail.target ? '#4caf50' : '#f44336' },
                    { label: 'Error Budget', value: `${analytics.slo_detail.error_budget_remaining}%`, color: analytics.slo_detail.error_budget_remaining > 50 ? '#4caf50' : '#ff9800' },
                    { label: 'Burn Rate', value: `${analytics.slo_detail.burn_rate}x`, color: analytics.slo_detail.burn_rate <= 1 ? '#4caf50' : '#f44336' },
                    { label: 'Breach ETA', value: analytics.slo_detail.breach_eta_days ? `${analytics.slo_detail.breach_eta_days} days` : 'None', color: analytics.slo_detail.breach_eta_days && analytics.slo_detail.breach_eta_days <= 7 ? '#f44336' : '#4caf50' },
                  ].map(item => (
                    <Grid item xs={6} sm key={item.label}>
                      <Typography sx={{ ...fSmall, color: 'text.secondary' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: item.color || 'text.primary' }}>{item.value}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  )
}
