import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Divider, Collapse, IconButton, Tooltip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import { API_URL } from '../../config'

const STATUS_COLOR = { healthy: '#4caf50', critical: '#f44336', warning: '#ff9800', down: '#f44336', degraded: '#ff9800', no_data: '#9e9e9e' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }
const fLabel = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }

const READINESS_COLORS = { green: '#4caf50', amber: '#ff9800', red: '#f44336' }

const MATRIX_COLORS = {
  'critical_down': { bg: '#f443361a', text: '#f44336' },
  'critical_degraded': { bg: '#ff98001a', text: '#ff9800' },
  'critical_healthy': { bg: '#4caf501a', text: '#4caf50' },
  'high_down': { bg: '#f443361a', text: '#f44336' },
  'high_degraded': { bg: '#ff98001a', text: '#e65100' },
  'high_healthy': { bg: '#4caf501a', text: '#4caf50' },
  'medium_down': { bg: '#f443360d', text: '#f44336' },
  'medium_degraded': { bg: '#ff98000d', text: '#ff9800' },
  'medium_healthy': { bg: '#4caf500d', text: '#4caf50' },
  'low_down': { bg: '#f443360a', text: '#f44336' },
  'low_degraded': { bg: '#ff98000a', text: '#ff9800' },
  'low_healthy': { bg: '#4caf500a', text: '#4caf50' },
}

export default function JourneyRiskReadiness({ filterQs, refreshTick }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [blastRadius, setBlastRadius] = useState(null)

  useEffect(() => {
    setError(null)
    fetch(`${API_URL}/api/customer-journeys/risk-matrix${filterQs || ''}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filterQs, refreshTick])

  const handleExpandRow = async (journeyId) => {
    if (expandedRow === journeyId) { setExpandedRow(null); setBlastRadius(null); return }
    setExpandedRow(journeyId)
    try {
      const res = await fetch(`${API_URL}/api/customer-journeys/${journeyId}/blast-radius${filterQs || ''}`)
      const d = await res.json()
      setBlastRadius(d)
    } catch { setBlastRadius(null) }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>
  if (!data) return null

  const { risk_matrix, readiness, criticality_levels, status_levels } = data

  // Count change freezes
  const freezeCount = readiness.filter(r => r.change_freeze_recommended).length

  return (
    <Box>
      {/* Risk Matrix */}
      <Typography sx={{ ...fLabel, fontWeight: 700, mb: 1.5 }}>Risk Matrix: Criticality vs Health</Typography>
      <Card sx={{ mb: 3, overflow: 'auto' }}>
        <CardContent sx={{ py: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', gap: 1 }}>
            {/* Header row */}
            <Box />
            {status_levels.map(status => (
              <Box key={status} sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography sx={{ ...fSmall, fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLOR[status] || '#9e9e9e' }}>
                  {status}
                </Typography>
              </Box>
            ))}

            {/* Matrix cells */}
            {criticality_levels.map(crit => (
              <>
                <Box key={`label-${crit}`} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                  <Typography sx={{ ...fSmall, fontWeight: 700, textTransform: 'uppercase' }}>{crit}</Typography>
                </Box>
                {status_levels.map(status => {
                  const cellKey = `${crit}_${status}`
                  const cell = risk_matrix[cellKey]
                  const colors = MATRIX_COLORS[cellKey] || { bg: '#f5f5f5', text: '#9e9e9e' }

                  return (
                    <Box key={cellKey} sx={{
                      bgcolor: colors.bg, borderRadius: 1, p: 1, textAlign: 'center',
                      minHeight: 50, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    }}>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: colors.text }}>
                        {cell?.count || 0}
                      </Typography>
                      {cell?.journeys?.map(j => (
                        <Tooltip key={j.id} title={`SLO: ${j.slo_current}%`}>
                          <Typography sx={{ ...fSmall, color: colors.text, cursor: 'default' }} noWrap>
                            {j.name}
                          </Typography>
                        </Tooltip>
                      ))}
                    </Box>
                  )
                })}
              </>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Change Freeze Summary */}
      {freezeCount > 0 && (
        <Card sx={{ mb: 2, border: '1px solid #e6510030', bgcolor: '#e651000a' }}>
          <CardContent sx={{ py: '10px !important', px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AcUnitIcon sx={{ fontSize: 18, color: '#e65100' }} />
            <Box>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                {freezeCount} journey{freezeCount > 1 ? 's' : ''} recommended for change freeze
              </Typography>
              <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
                {readiness.filter(r => r.change_freeze_recommended).map(r => r.name).join(', ')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Release Readiness Table */}
      <Typography sx={{ ...fLabel, fontWeight: 700, mb: 1.5 }}>Release Readiness</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>Journey</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} align="center">Criticality</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} align="center">Health</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} align="center">Readiness</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} align="center">SLO Headroom</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} align="center">Error Budget</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} align="center">Apps</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} align="center">Freeze</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }} width={40} />
            </TableRow>
          </TableHead>
          <TableBody>
            {readiness.map(row => (
              <>
                <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleExpandRow(row.id)}>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell align="center">
                    <Chip label={row.criticality} size="small" sx={{
                      height: 20, fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase',
                      color: row.criticality === 'critical' ? '#f44336' : row.criticality === 'high' ? '#ff9800' : 'text.secondary',
                    }} variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={row.status} size="small" sx={{
                      height: 20, fontSize: '0.6rem',
                      bgcolor: `${STATUS_COLOR[row.status] || '#9e9e9e'}1a`,
                      color: STATUS_COLOR[row.status] || '#9e9e9e',
                    }} />
                  </TableCell>
                  <TableCell align="center">
                    <ReadinessGauge score={row.readiness_score} label={row.readiness_label} />
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{row.slo_headroom?.toFixed(3)}%</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.75rem', color: row.error_budget > 50 ? '#4caf50' : row.error_budget > 15 ? '#ff9800' : '#f44336', fontWeight: 600 }}>
                    {row.error_budget}%
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{row.app_count}</TableCell>
                  <TableCell align="center">
                    {row.change_freeze_recommended && (
                      <Tooltip title={row.change_freeze_reason}>
                        <AcUnitIcon sx={{ fontSize: 16, color: '#e65100' }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <ExpandMoreIcon sx={{ fontSize: 16, transform: expandedRow === row.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* Expanded blast radius */}
                {expandedRow === row.id && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ py: 0 }}>
                      <Collapse in={expandedRow === row.id}>
                        <Box sx={{ py: 1.5, px: 2 }}>
                          {row.change_freeze_reason && (
                            <Typography sx={{ ...fSmall, color: '#e65100', mb: 1, fontWeight: 600 }}>
                              Freeze reason: {row.change_freeze_reason}
                            </Typography>
                          )}
                          {blastRadius && blastRadius.impacted_journeys?.length > 0 ? (
                            <Box>
                              <Typography sx={{ ...fSmall, fontWeight: 700, mb: 0.5 }}>
                                Shared Impact — {blastRadius.impacted_count} other journeys affected:
                              </Typography>
                              {blastRadius.impacted_journeys.map(ij => (
                                <Box key={ij.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Chip label={ij.status} size="small" sx={{
                                    height: 16, fontSize: '0.55rem',
                                    color: STATUS_COLOR[ij.status] || '#9e9e9e',
                                  }} variant="outlined" />
                                  <Typography sx={{ fontSize: '0.72rem' }}>{ij.name}</Typography>
                                  <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
                                    ({ij.shared_app_count} shared apps: {ij.shared_app_names?.join(', ')})
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
                              No shared applications with other journeys
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}


function ReadinessGauge({ score, label }) {
  const color = READINESS_COLORS[label] || '#9e9e9e'
  const size = 40

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={score}
        size={size}
        thickness={4}
        sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
      />
      <Box sx={{
        position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color }}>{Math.round(score)}</Typography>
      </Box>
    </Box>
  )
}
