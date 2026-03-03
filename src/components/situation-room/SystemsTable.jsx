import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, Select, MenuItem, Autocomplete, TextField, Chip } from '@mui/material'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50', no_data: '#78909c' }

const TIMELINE_OPTIONS = ['T0 - Detected', 'T1 - Acknowledged', 'T2 - Mitigated', 'T3 - Stable']
const NEXT_UPDATE_OPTIONS = ['Every 15 min', 'Every 30 min', '1 hr / significant milestones', 'Every 2 hours (business hours)']

const fHead = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }
const fBody = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fSmall = { fontSize: 'clamp(0.58rem, 0.72vw, 0.65rem)' }

const headSx = { py: 0.8, px: 1, color: '#fff' }
const cellSx = { py: 0.6, px: 1, borderColor: 'divider' }

export default function SystemsTable({ systems, onSystemChange }) {
  if (!systems?.length) return null

  const handleField = (systemId, field, value) => {
    onSystemChange(systemId, { [field]: value })
  }

  return (
    <TableContainer sx={{ mb: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#4caf50' }}>
            <TableCell sx={{ ...headSx, ...fHead, minWidth: 120 }}>System</TableCell>
            <TableCell sx={{ ...headSx, ...fHead, width: 60 }} align="center">Status</TableCell>
            <TableCell sx={{ ...headSx, ...fHead, minWidth: 140 }}>Timeline</TableCell>
            <TableCell sx={{ ...headSx, ...fHead, minWidth: 250 }}>
              Impacted Capabilities
              <Typography component="span" sx={{ ...fSmall, display: 'block', fontWeight: 400, opacity: 0.85 }}>
                (note: this can be manually input or automated using the "Manage Indicators" button above)
              </Typography>
            </TableCell>
            <TableCell sx={{ ...headSx, ...fHead, minWidth: 160 }}>SRE Leads</TableCell>
            <TableCell sx={{ ...headSx, ...fHead, minWidth: 140 }}>Next Update</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {systems.map((sys) => {
            const statusColor = STATUS_COLOR[sys.status] || STATUS_COLOR.no_data
            return (
              <TableRow key={sys.system_id} hover sx={{
                '&:nth-of-type(odd)': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' },
              }}>
                {/* System Name */}
                <TableCell sx={cellSx}>
                  <Typography sx={{ ...fBody, fontWeight: 700 }}>{sys.name}</Typography>
                </TableCell>

                {/* Status Dot */}
                <TableCell sx={cellSx} align="center">
                  <FiberManualRecordIcon sx={{ fontSize: 12, color: statusColor }} />
                </TableCell>

                {/* Timeline Dropdown */}
                <TableCell sx={cellSx}>
                  <Select
                    size="small" variant="standard"
                    value={sys.timeline || 'T0 - Detected'}
                    onChange={e => handleField(sys.system_id, 'timeline', e.target.value)}
                    sx={{ ...fBody, minWidth: 120 }}
                    disableUnderline
                  >
                    {TIMELINE_OPTIONS.map(opt => (
                      <MenuItem key={opt} value={opt} sx={fBody}>{opt}</MenuItem>
                    ))}
                  </Select>
                </TableCell>

                {/* Impacted Capabilities */}
                <TableCell sx={{ ...cellSx, py: 0.3 }}>
                  <Autocomplete
                    multiple freeSolo size="small"
                    options={sys.all_capabilities || []}
                    value={sys.impacted_capabilities || []}
                    onChange={(_, v) => handleField(sys.system_id, 'impacted_capabilities', v)}
                    renderTags={(value, getTagProps) =>
                      value.map((cap, i) => (
                        <Chip key={cap} label={cap} size="small" onDelete={getTagProps({ index: i }).onDelete}
                          sx={{ ...fSmall, height: 20, mr: 0.3 }} />
                      ))
                    }
                    renderInput={params => (
                      <TextField {...params} variant="standard" placeholder="Add impacted capabilities..."
                        InputProps={{ ...params.InputProps, disableUnderline: true, sx: fBody }} />
                    )}
                  />
                </TableCell>

                {/* SRE Leads */}
                <TableCell sx={cellSx}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                    {(sys.sre_lead_overrides?.length > 0 ? sys.sre_lead_overrides : sys.sre_leads?.map(l => l.name) || []).map(name => (
                      <Chip key={name} label={name} size="small" variant="outlined" sx={{ ...fSmall, height: 20 }} />
                    ))}
                    {(!sys.sre_leads?.length && !sys.sre_lead_overrides?.length) && (
                      <Typography sx={{ ...fSmall, color: 'text.disabled', fontStyle: 'italic' }}>Add owners...</Typography>
                    )}
                  </Box>
                </TableCell>

                {/* Next Update */}
                <TableCell sx={cellSx}>
                  <Select
                    size="small" variant="standard"
                    value={sys.next_update || 'Every 15 min'}
                    onChange={e => handleField(sys.system_id, 'next_update', e.target.value)}
                    sx={{ ...fBody, minWidth: 120 }}
                    disableUnderline
                  >
                    {NEXT_UPDATE_OPTIONS.map(opt => (
                      <MenuItem key={opt} value={opt} sx={fBody}>{opt}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
