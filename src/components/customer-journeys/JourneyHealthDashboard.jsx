import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, LinearProgress,
  ToggleButtonGroup, ToggleButton, CircularProgress, Alert, Divider,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import { API_URL } from '../../config'

const STATUS_ICON = { healthy: CheckCircleIcon, critical: ErrorIcon, warning: WarningIcon, down: ErrorIcon, degraded: WarningIcon, no_data: WarningIcon }
const STATUS_COLOR = { healthy: '#4caf50', critical: '#f44336', warning: '#ff9800', down: '#f44336', degraded: '#ff9800', no_data: '#9e9e9e' }

const fLabel = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fValue = { fontSize: 'clamp(1.4rem, 2.4vw, 2rem)', fontWeight: 700 }
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }

export default function JourneyHealthDashboard({ filterQs, refreshTick }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setError(null)
    fetch(`${API_URL}/api/customer-journeys/health-dashboard${filterQs || ''}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filterQs, refreshTick])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">Failed to load health dashboard: {error}</Alert>
  if (!data) return null

  const { kpis, segments } = data

  return (
    <Box>
      {/* KPI Banner */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {[
          { label: 'Total Journeys', value: kpis.total_journeys, color: '#1565c0' },
          { label: 'Healthy', value: kpis.healthy, color: '#4caf50' },
          { label: 'Degraded', value: kpis.degraded, color: '#ff9800' },
          { label: 'Down', value: kpis.down, color: '#f44336' },
          { label: 'Avg SLO', value: `${kpis.avg_slo_compliance}%`, color: '#00695c' },
          { label: 'Change Freeze', value: kpis.change_freeze_recommended, color: '#e65100' },
        ].map(kpi => (
          <Card key={kpi.label} sx={{ flex: '1 1 130px', minWidth: 120, border: `1px solid ${kpi.color}25` }}>
            <CardContent sx={{ py: '10px !important', px: 1.5, textAlign: 'center' }}>
              <Typography sx={{ ...fSmall, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</Typography>
              <Typography sx={{ ...fValue, color: kpi.color }}>{kpi.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Status filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography sx={{ ...fLabel, fontWeight: 600 }}>Filter:</Typography>
        <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, v) => v && setStatusFilter(v)} size="small">
          <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.25 }}>All</ToggleButton>
          <ToggleButton value="down" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.25, color: '#f44336' }}>Down</ToggleButton>
          <ToggleButton value="degraded" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.25, color: '#ff9800' }}>Degraded</ToggleButton>
          <ToggleButton value="healthy" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.25, color: '#4caf50' }}>Healthy</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Journey cards grouped by segment */}
      {segments.map(seg => {
        const filteredJourneys = statusFilter === 'all'
          ? seg.journeys
          : seg.journeys.filter(j => {
              if (statusFilter === 'down') return j.status === 'critical'
              if (statusFilter === 'degraded') return j.status === 'warning'
              return j.status === statusFilter
            })

        if (filteredJourneys.length === 0) return null

        return (
          <Box key={seg.segment} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography sx={{ ...fLabel, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {seg.segment}
              </Typography>
              <Chip label={`${filteredJourneys.length} journeys`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            </Box>

            <Grid container spacing={2}>
              {filteredJourneys.map(journey => (
                <Grid item xs={12} md={6} key={journey.id}>
                  <JourneyHealthCard journey={journey} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )
      })}
    </Box>
  )
}


function JourneyHealthCard({ journey }) {
  const statusColor = STATUS_COLOR[journey.status] || STATUS_COLOR.no_data
  const StatusIcon = STATUS_ICON[journey.status] || STATUS_ICON.no_data

  return (
    <Card sx={{ border: `1px solid ${statusColor}30`, height: '100%' }}>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <StatusIcon sx={{ fontSize: 16, color: statusColor }} />
          <Typography sx={{ ...fLabel, fontWeight: 700, flex: 1 }}>{journey.name}</Typography>
          <Chip
            label={journey.criticality}
            size="small"
            sx={{
              height: 18, fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase',
              bgcolor: journey.criticality === 'critical' ? '#f443361a' : journey.criticality === 'high' ? '#ff98001a' : '#9e9e9e1a',
              color: journey.criticality === 'critical' ? '#f44336' : journey.criticality === 'high' ? '#ff9800' : 'text.secondary',
            }}
          />
        </Box>

        {/* Step flow mini */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mb: 1.5, flexWrap: 'wrap', rowGap: 0.5 }}>
          {journey.steps.map((step, i) => (
            <Box key={step.name} sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip
                label={step.name}
                size="small"
                sx={{
                  height: 22, fontSize: '0.62rem', fontWeight: 600,
                  bgcolor: `${STATUS_COLOR[step.status] || '#9e9e9e'}18`,
                  color: STATUS_COLOR[step.status] || '#9e9e9e',
                  border: `1px solid ${STATUS_COLOR[step.status] || '#9e9e9e'}30`,
                }}
              />
              {i < journey.steps.length - 1 && (
                <ArrowForwardIcon sx={{ fontSize: 10, color: 'text.disabled', mx: 0.25 }} />
              )}
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Metrics row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>SLO</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: journey.slo_current >= 99.9 ? '#4caf50' : journey.slo_current >= 99 ? '#ff9800' : '#f44336' }}>
              {journey.slo_current}%
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Error Budget</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: journey.error_budget_remaining > 50 ? '#4caf50' : journey.error_budget_remaining > 15 ? '#ff9800' : '#f44336' }}>
              {journey.error_budget_remaining}%
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Apps</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>{journey.app_count}</Typography>
          </Box>
          <Box>
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Steps</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>{journey.step_count}</Typography>
          </Box>
          {journey.change_freeze_recommended && (
            <Chip
              icon={<AcUnitIcon sx={{ fontSize: 12 }} />}
              label="Change Freeze"
              size="small"
              sx={{
                height: 22, fontSize: '0.62rem', fontWeight: 600,
                bgcolor: '#e651001a', color: '#e65100', border: '1px solid #e6510030',
              }}
            />
          )}
        </Box>

        {/* SLO bar */}
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, journey.error_budget_remaining)}
            sx={{
              height: 4, borderRadius: 2,
              bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: journey.error_budget_remaining > 50 ? '#4caf50' : journey.error_budget_remaining > 15 ? '#ff9800' : '#f44336',
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}
