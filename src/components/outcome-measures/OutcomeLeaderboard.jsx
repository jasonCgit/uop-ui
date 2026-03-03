import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Chip } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

const fTitle = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fBody = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fSmall = { fontSize: 'clamp(0.58rem, 0.72vw, 0.65rem)' }

const SORT_OPTIONS = {
  usage: ['prompts', 'dau', 'uop_views', 'feature_adoption'],
  sre: ['mttr', 'p1_incidents', 'p2_incidents', 'noise_events', 'true_impact_dur', 'slo_compliance'],
  support: ['service_requests', 'self_service_pct', 'escalations'],
  workstreams: [],
  baselines: [],
}

const METRIC_SHORT = {
  prompts: 'Prompts',
  dau: 'DAU',
  uop_views: 'Views',
  feature_adoption: 'Adoption',
  mttr: 'MTTR',
  p1_incidents: 'P1s',
  p2_incidents: 'P2s',
  noise_events: 'Noise',
  true_impact_dur: 'Impact Dur',
  slo_compliance: 'SLO',
  error_budget: 'Err Budget',
  service_requests: 'SRs',
  self_service_pct: 'Self-Serve',
  escalations: 'Escalations',
}

function MiniSparkline({ data, color, width = 50, height = 16 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  )
}

function RankBadge({ rank }) {
  if (rank > 3) return <Typography sx={{ ...fBody, fontWeight: 600, color: 'text.secondary', width: 24, textAlign: 'center' }}>{rank}</Typography>
  const colors = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' }
  return <EmojiEventsIcon sx={{ fontSize: 18, color: colors[rank] }} />
}

export default function OutcomeLeaderboard({ data, sectionKey, onSortChange, activeSortBy }) {
  if (!data?.rows?.length) return null

  const rows = data.rows
  const isWorkstreams = sectionKey === 'workstreams'
  const isBaselines = sectionKey === 'baselines'
  const sortOptions = SORT_OPTIONS[sectionKey] || []

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
          <Typography sx={{ ...fTitle, fontWeight: 600 }}>
            CTO / CBT Leaderboard
          </Typography>
          {sortOptions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {sortOptions.map(opt => (
                <Chip
                  key={opt}
                  label={METRIC_SHORT[opt] || opt}
                  size="small"
                  variant={activeSortBy === opt ? 'filled' : 'outlined'}
                  color={activeSortBy === opt ? 'primary' : 'default'}
                  onClick={() => onSortChange(opt)}
                  sx={{ ...fSmall, height: 22, cursor: 'pointer' }}
                />
              ))}
            </Box>
          )}
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...fSmall, fontWeight: 700, width: 32 }}>#</TableCell>
                <TableCell sx={{ ...fSmall, fontWeight: 700 }}>CTO</TableCell>
                <TableCell sx={{ ...fSmall, fontWeight: 700 }}>CBT</TableCell>
                <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="center">Apps</TableCell>
                {isWorkstreams ? (
                  <>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="right">Adoption</TableCell>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="right">Maturity</TableCell>
                  </>
                ) : isBaselines ? (
                  <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="right">Coverage</TableCell>
                ) : (
                  <>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="right">Current</TableCell>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="right">Baseline</TableCell>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="right">Change</TableCell>
                    <TableCell sx={{ ...fSmall, fontWeight: 700 }} align="center">Trend</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => {
                const pct = row.pct_change || 0
                const lib = row.lower_is_better
                const improved = lib ? pct < 0 : pct > 0
                const changeColor = pct === 0 ? 'text.secondary' : improved ? '#4caf50' : '#f44336'

                return (
                  <TableRow key={i} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell><RankBadge rank={row.rank} /></TableCell>
                    <TableCell sx={fBody}>{row.cto}</TableCell>
                    <TableCell sx={fBody}>{row.cbt}</TableCell>
                    <TableCell sx={fBody} align="center">{row.app_count}</TableCell>
                    {isWorkstreams ? (
                      <>
                        <TableCell sx={fBody} align="right">
                          <Chip label={`${row.avg_adoption}%`} size="small" color={row.avg_adoption > 70 ? 'success' : row.avg_adoption > 40 ? 'warning' : 'error'} variant="outlined" sx={{ ...fSmall, height: 20 }} />
                        </TableCell>
                        <TableCell sx={fBody} align="right">
                          <Chip label={`${row.avg_maturity}%`} size="small" variant="outlined" sx={{ ...fSmall, height: 20 }} />
                        </TableCell>
                      </>
                    ) : isBaselines ? (
                      <TableCell sx={fBody} align="right">
                        <Chip
                          label={`${row.coverage_pct}%`}
                          size="small"
                          color={row.coverage_pct > 75 ? 'success' : row.coverage_pct > 50 ? 'warning' : 'error'}
                          variant="outlined"
                          sx={{ ...fSmall, height: 20 }}
                        />
                      </TableCell>
                    ) : (
                      <>
                        <TableCell sx={{ ...fBody, fontWeight: 600 }} align="right">
                          {typeof row.current === 'number' ? row.current.toLocaleString() : row.current}
                        </TableCell>
                        <TableCell sx={{ ...fBody, color: 'text.secondary' }} align="right">
                          {typeof row.baseline === 'number' ? row.baseline.toLocaleString() : row.baseline}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.3 }}>
                            {pct !== 0 && (pct > 0 ? <TrendingUpIcon sx={{ fontSize: 14, color: changeColor }} /> : <TrendingDownIcon sx={{ fontSize: 14, color: changeColor }} />)}
                            <Typography sx={{ ...fSmall, fontWeight: 600, color: changeColor }}>
                              {pct > 0 ? '+' : ''}{pct}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <MiniSparkline data={row.trend} color={changeColor} />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
