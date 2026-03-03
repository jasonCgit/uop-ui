import { Grid, Card, CardContent, Typography, Box, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material'

const fTitle = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fLabel = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fValue = { fontSize: 'clamp(1rem, 1.4vw, 1.2rem)', fontWeight: 700 }
const fSmall = { fontSize: 'clamp(0.58rem, 0.72vw, 0.65rem)' }

const COV_LABELS = {
  golden_signals: 'Golden Signals',
  slo_defined: 'SLO Defined',
  incident_zero: 'Incident Zero',
  blast_radius: 'Blast Radius',
  runbooks: 'Runbooks',
  day1_complete: 'Day 1 Complete',
}

function CoverageGauge({ label, pct, covered, total }) {
  const color = pct > 75 ? '#4caf50' : pct > 50 ? '#ffa726' : '#f44336'
  return (
    <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
      <Typography sx={{ ...fLabel, color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex', width: 64, height: 64, mb: 0.5 }}>
        <svg width={64} height={64} viewBox="0 0 64 64">
          <circle cx={32} cy={32} r={28} fill="none" stroke={`${color}20`} strokeWidth={5} />
          <circle
            cx={32} cy={32} r={28} fill="none"
            stroke={color} strokeWidth={5}
            strokeDasharray={`${pct * 1.76} 176`}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ ...fValue, color }}>{Math.round(pct)}%</Typography>
        </Box>
      </Box>
      <Typography sx={{ ...fSmall, color: 'text.secondary' }}>{covered} / {total} apps</Typography>
    </Card>
  )
}

function HeatmapCell({ pct }) {
  const color = pct > 75 ? '#4caf50' : pct > 50 ? '#ffa726' : pct > 25 ? '#ff7043' : '#f44336'
  const bgAlpha = Math.min(0.25, pct / 400 + 0.05)
  return (
    <Tooltip title={`${pct}%`} arrow placement="top">
      <Box sx={{
        width: 40, height: 24, borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: `${color}${Math.round(bgAlpha * 255).toString(16).padStart(2, '0')}`,
        border: `1px solid ${color}40`,
      }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color }}>{pct}%</Typography>
      </Box>
    </Tooltip>
  )
}

export default function CoverageSection({ sectionData, coverage }) {
  const baselines = sectionData?.metrics || {}
  const heatmap = coverage?.heatmap || []
  const covKeys = coverage?.coverage_keys || Object.keys(COV_LABELS)

  // Baselines summary gauges
  const gauges = Object.entries(baselines)
    .filter(([k]) => k !== 'overall')
    .map(([k, v]) => ({ key: k, label: COV_LABELS[k] || k, ...v }))
  const overall = baselines.overall || {}

  return (
    <Box>
      {/* Coverage Gauges */}
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ ...fTitle, fontWeight: 600, mb: 1 }}>Coverage Overview</Typography>
        <Grid container spacing={1}>
          {/* Overall */}
          <Grid item xs={6} sm={4} md={2}>
            <CoverageGauge label="Overall" pct={overall.pct || 0} covered={overall.covered || 0} total={overall.total || 0} />
          </Grid>
          {gauges.map(g => (
            <Grid item xs={6} sm={4} md={2} key={g.key}>
              <CoverageGauge label={g.label} pct={g.pct} covered={g.covered} total={g.total} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTO Heatmap */}
      {heatmap.length > 0 && (
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography sx={{ ...fTitle, fontWeight: 600, mb: 1 }}>Coverage by CTO</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }}>CTO</TableCell>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="center">Apps</TableCell>
                    {covKeys.map(ck => (
                      <TableCell key={ck} sx={{ ...fSmall, fontWeight: 700 }} align="center">
                        {(coverage?.coverage_labels?.[ck] || ck).replace(/ /g, '\n')}
                      </TableCell>
                    ))}
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="center">Overall</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {heatmap.map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={fLabel}>{row.cto}</TableCell>
                      <TableCell sx={fLabel} align="center">{row.app_count}</TableCell>
                      {covKeys.map(ck => (
                        <TableCell key={ck} align="center" sx={{ p: 0.5 }}>
                          <HeatmapCell pct={row.cells[ck]?.pct || 0} />
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ p: 0.5 }}>
                        <HeatmapCell pct={row.overall_pct} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
