import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Chip, Divider,
  LinearProgress, Grid, CircularProgress,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import { API_URL } from '../../config'

const STATUS_ICON = { healthy: CheckCircleIcon, critical: ErrorIcon, warning: WarningIcon, down: ErrorIcon, degraded: WarningIcon, no_data: WarningIcon }
const STATUS_COLOR = { healthy: '#4caf50', critical: '#f44336', warning: '#ff9800', down: '#f44336', degraded: '#ff9800', no_data: '#9e9e9e' }

export default function CustomerJourneyWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/customer-journeys/health-dashboard`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
  if (!data) return null

  const { kpis, segments } = data
  // Flatten all journeys and take top 6 by criticality
  const allJourneys = segments.flatMap(s => s.journeys)
    .sort((a, b) => {
      const critOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const statusOrder = { critical: 0, warning: 1, healthy: 2 }
      return (critOrder[a.criticality] || 3) - (critOrder[b.criticality] || 3)
        || (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2)
    })
    .slice(0, 6)

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 1.5 }}>
      {/* KPI bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        {[
          { label: 'Journeys', value: kpis.total_journeys, color: '#1565c0' },
          { label: 'Healthy', value: kpis.healthy, color: '#4caf50' },
          { label: 'Degraded', value: kpis.degraded, color: '#ff9800' },
          { label: 'Down', value: kpis.down, color: '#f44336' },
        ].map(k => (
          <Box key={k.label} sx={{ flex: 1, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary', textTransform: 'uppercase' }}>{k.label}</Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: k.color }}>{k.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Journey cards */}
      {allJourneys.map(j => {
        const statusColor = STATUS_COLOR[j.status] || '#9e9e9e'
        const StatusIcon = STATUS_ICON[j.status] || STATUS_ICON.no_data
        return (
          <Card key={j.id} sx={{ mb: 1, border: `1px solid ${statusColor}30` }}>
            <CardContent sx={{ py: '6px !important', px: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <StatusIcon sx={{ fontSize: 12, color: statusColor }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, flex: 1 }} noWrap>{j.name}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>SLO {j.slo_current}%</Typography>
                {j.change_freeze_recommended && <AcUnitIcon sx={{ fontSize: 12, color: '#e65100' }} />}
              </Box>
              {/* Mini step flow */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                {j.steps.map((step, i) => (
                  <Box key={step.name} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      width: 8, height: 8, borderRadius: '50%',
                      bgcolor: STATUS_COLOR[step.status] || '#9e9e9e',
                    }} />
                    {i < j.steps.length - 1 && (
                      <Box sx={{ width: 12, height: 1, bgcolor: 'text.disabled', mx: 0.25 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}
