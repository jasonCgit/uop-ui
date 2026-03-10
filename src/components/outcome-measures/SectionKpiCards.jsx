import { Grid, Card, Typography, Box, Chip } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'

const fLabel = { fontSize: 'clamp(0.7rem, 0.85vw, 0.78rem)' }
const fValue = { fontSize: 'clamp(1rem, 1.6vw, 1.4rem)', fontWeight: 700 }
const fSmall = { fontSize: 'clamp(0.58rem, 0.72vw, 0.65rem)' }

const METRIC_LABELS = {
  // Adoption
  total_users_week: 'Total Users / Week',
  mcp_requests: 'MCP Requests (FinOps)',
  uop_chat_prompts: 'UOP Chat Prompts',
  clicks_blast_radius: 'Clicks — Blast Radius',
  clicks_cuj: 'Clicks — CUJ',
  clicks_slo_agent: 'Clicks — SLO Agent',
  clicks_aura: 'Clicks — AURA',
  devgpt_executions: 'DevGPT Executions (Zero-Touch)',
  simulation_executions: 'Simulation Executions',
  // SRE Coverage
  sre_telemetry_coverage: 'SRE Telemetry Coverage (SLOs)',
  uop_coverage: 'UOP Coverage',
  dynatrace_coverage: 'Dynatrace Coverage',
  golden_signals_coverage: 'Golden Signals Coverage',
  // Results
  incidents_avoided: 'Incidents Avoided → Code Updates in DevGPT',
  incidents_avoided_uat: 'Incidents Avoided — UAT',
  incidents_avoided_prod: 'Incidents Avoided — Prod',
  p1_incidents: 'P1 Incidents',
  p2_incidents: 'P2 Incidents',
  p3_incidents: 'P3 Incidents',
  p4_incidents: 'P4 Incidents',
  p5_incidents: 'P5 Incidents',
  mttr_p1: 'MTTR — P1',
  mttr_p2: 'MTTR — P2',
  mttr_p3: 'MTTR — P3',
  ai_impact_duration: 'AI Driven Impact Duration',
  anomaly_rate: 'Anomalies per 100 Changes',
  change_aware_anomaly_rate: 'Change Aware Anomaly Rate',
  alert_response_time: 'Alert Response Time',
  response_type_breakdown: 'Response Type (AIOps/UOP/AURA)',
  response_time_by_type: 'Response Time by Type',
  pct_p1p2_detected_by_alerts: '% P1/P2 Detected by Alerts',
  actionable_alerts_reduction: 'Actionable Alerts / Escalation Reduction',
  cost_reduction_zero_touch: 'Cost Reduction — Zero Touch',
  cost_reduction_techsupport: 'Cost Reduction — TechSupport Agent',
  alert_noise_reduction: 'Alert Noise Reduction',
  suppression_rate: 'Suppression Rate',
}

function MiniSparkline({ data, color, width = 56, height = 22 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) =>
    `${2 + (i / (data.length - 1)) * (width - 4)},${2 + (1 - (v - min) / range) * (height - 4)}`
  ).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

export default function SectionKpiCards({ data }) {
  if (!data?.metrics) return null
  const metrics = data.metrics

  const cards = Object.entries(metrics).map(([key, m]) => ({
    key,
    label: METRIC_LABELS[key] || key.replace(/_/g, ' '),
    ...m,
  }))

  return (
    <Grid container spacing={1} sx={{ mb: 1 }}>
      {cards.map(card => {
        const improved = card.lower_is_better ? card.pct_change < 0 : card.pct_change > 0
        const accentColor = card.pct_change === 0 ? '#78909c' : improved ? '#4caf50' : '#f44336'
        const Icon = card.pct_change === 0 ? TrendingFlatIcon : card.pct_change > 0 ? TrendingUpIcon : TrendingDownIcon
        return (
          <Grid item xs={6} sm={4} md={3} key={card.key}>
            <Card variant="outlined" sx={{
              p: 1.5, height: '100%',
              borderColor: `${accentColor}25`,
              background: (t) => t.palette.mode === 'dark' ? `${accentColor}06` : `${accentColor}04`,
            }}>
              <Typography sx={{ ...fLabel, color: 'text.secondary', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {card.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography sx={{ ...fValue, color: accentColor }}>
                  {typeof card.current === 'number' ? card.current.toLocaleString() : card.current}
                </Typography>
                {card.unit && (
                  <Typography sx={{ ...fSmall, color: 'text.secondary' }}>{card.unit}</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Chip
                  size="small"
                  icon={<Icon sx={{ fontSize: 13 }} />}
                  label={`${card.pct_change > 0 ? '+' : ''}${card.pct_change}%`}
                  color={card.pct_change === 0 ? 'default' : improved ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ height: 18, ...fSmall, '& .MuiChip-icon': { ml: 0.3 } }}
                />
                <MiniSparkline data={card.trend} color={accentColor} />
              </Box>
              <Typography sx={{ ...fSmall, color: 'text.disabled', mt: 0.3 }}>
                Baseline: {card.baseline.toLocaleString()}{card.unit ? ` ${card.unit}` : ''}
              </Typography>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}
