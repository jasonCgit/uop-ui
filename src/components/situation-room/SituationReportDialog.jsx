import { useState, useCallback } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Tab, Tabs, Divider, CircularProgress, Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import EmailIcon from '@mui/icons-material/Email'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { API_URL } from '../../config'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50', no_data: '#78909c' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }
const fBody = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }
const fHead = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }

export default function SituationReportDialog({ open, onClose, situationId, situation }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState(0)

  const fetchReport = useCallback(() => {
    if (!situationId) return
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/api/situation-room/situations/${situationId}/report`)
      .then(r => { if (!r.ok) throw new Error(`report — ${r.status}`); return r.json() })
      .then(d => { setReport(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [situationId])

  const handleOpen = () => {
    if (!report) fetchReport()
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryRows = (report?.systems || []).map(sys => ({
      System: sys.name,
      Status: sys.status,
      Timeline: sys.timeline || 'T0 - Detected',
      'Impacted Capabilities': (sys.impacted_capabilities || []).join(', '),
      'SRE Leads': (sys.sre_leads || []).map(l => l.name).join(', '),
      'Next Update': sys.next_update || 'Every 15 min',
    }))
    const ws1 = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, ws1, 'Systems Summary')

    // Detail sheet — per-app indicators
    const detailRows = []
    for (const sys of report?.systems || []) {
      for (const app of sys.apps || []) {
        for (const ind of app.indicators || []) {
          detailRows.push({
            System: sys.name,
            Application: app.name,
            SEAL: app.seal,
            Indicator: ind.label,
            Status: ind.status,
            Value: ind.value ?? '',
          })
        }
      }
    }
    if (detailRows.length) {
      const ws2 = XLSX.utils.json_to_sheet(detailRows)
      XLSX.utils.book_append_sheet(wb, ws2, 'Indicator Detail')
    }

    XLSX.writeFile(wb, `SituationReport_${situation?.incident_number || situationId}.xlsx`)
  }

  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.text(`Situation Report: ${situation?.title || ''}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Incident: ${situation?.incident_number || ''} | Priority: ${situation?.priority || ''} | State: ${situation?.state || ''}`, 14, 28)

    // Systems summary table
    const head = [['System', 'Status', 'Timeline', 'Impacted Capabilities', 'SRE Leads', 'Next Update']]
    const body = (report?.systems || []).map(sys => [
      sys.name,
      sys.status,
      sys.timeline || 'T0 - Detected',
      (sys.impacted_capabilities || []).join(', '),
      (sys.sre_leads || []).map(l => l.name).join(', '),
      sys.next_update || 'Every 15 min',
    ])
    doc.autoTable({ startY: 34, head, body, styles: { fontSize: 8 }, headStyles: { fillColor: [76, 175, 80] } })

    // Per-system app details
    let y = doc.lastAutoTable.finalY + 10
    for (const sys of report?.systems || []) {
      if (y > 170) { doc.addPage(); y = 20 }
      doc.setFontSize(12)
      doc.text(`${sys.name} — Applications`, 14, y)
      y += 6
      const appHead = [['Application', 'SEAL', 'Indicator', 'Status', 'Value']]
      const appBody = []
      for (const app of sys.apps || []) {
        for (const ind of app.indicators || []) {
          appBody.push([app.name, app.seal, ind.label, ind.status, ind.value ?? ''])
        }
      }
      if (appBody.length) {
        doc.autoTable({ startY: y, head: appHead, body: appBody, styles: { fontSize: 7 }, headStyles: { fillColor: [66, 66, 66] } })
        y = doc.lastAutoTable.finalY + 8
      }
    }

    doc.save(`SituationReport_${situation?.incident_number || situationId}.pdf`)
  }

  const generateEmail = () => {
    const lines = [`Situation Report: ${situation?.title || ''}`, '']
    lines.push(`Incident: ${situation?.incident_number || ''} | Priority: ${situation?.priority || ''} | State: ${situation?.state || ''}`)
    lines.push(`Opened: ${situation?.opened_time || 'N/A'}`)
    lines.push('')
    lines.push('=== Systems Summary ===')
    for (const sys of report?.systems || []) {
      lines.push(`  ${sys.name}: ${sys.status} | ${sys.timeline || 'T0 - Detected'} | Next: ${sys.next_update || 'Every 15 min'}`)
      if (sys.impacted_capabilities?.length) lines.push(`    Impacted: ${sys.impacted_capabilities.join(', ')}`)
      const leads = sys.sre_leads?.map(l => l.name).join(', ')
      if (leads) lines.push(`    SRE Leads: ${leads}`)
    }
    if (situation?.escalation_notes) {
      lines.push('')
      lines.push('=== Escalation Notes ===')
      lines.push(situation.escalation_notes)
    }
    const subject = encodeURIComponent(`[${situation?.priority}] ${situation?.incident_number} — ${situation?.title}`)
    const body = encodeURIComponent(lines.join('\n'))
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth TransitionProps={{ onEnter: handleOpen }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
        <Typography sx={{ fontSize: 'clamp(0.85rem, 1.1vw, 1rem)', fontWeight: 700 }}>
          Situation Report — {situation?.incident_number}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        )}
        {error && <Alert severity="error" sx={{ m: 2 }}>Failed to load report: {error}</Alert>}
        {report && !loading && (
          <Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Systems Summary" sx={fSmall} />
              <Tab label="Indicator Detail" sx={fSmall} />
            </Tabs>
            <Box sx={{ p: 2 }}>
              {tab === 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#4caf50' }}>
                        {['System', 'Status', 'Timeline', 'Impacted Capabilities', 'SRE Leads', 'Next Update'].map(h => (
                          <TableCell key={h} sx={{ ...fHead, color: '#fff', py: 0.8, px: 1 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(report.systems || []).map(sys => (
                        <TableRow key={sys.system_id} hover>
                          <TableCell sx={{ ...fBody, py: 0.6, px: 1, fontWeight: 700 }}>{sys.name}</TableCell>
                          <TableCell sx={{ py: 0.6, px: 1 }} align="center">
                            <FiberManualRecordIcon sx={{ fontSize: 12, color: STATUS_COLOR[sys.status] || STATUS_COLOR.no_data }} />
                          </TableCell>
                          <TableCell sx={{ ...fBody, py: 0.6, px: 1 }}>{sys.timeline || 'T0 - Detected'}</TableCell>
                          <TableCell sx={{ py: 0.6, px: 1 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                              {(sys.impacted_capabilities || []).map(c => (
                                <Chip key={c} label={c} size="small" sx={{ ...fSmall, height: 20 }} />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 0.6, px: 1 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                              {(sys.sre_leads || []).map(l => (
                                <Chip key={l.name} label={l.name} size="small" variant="outlined" sx={{ ...fSmall, height: 20 }} />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ ...fBody, py: 0.6, px: 1 }}>{sys.next_update || 'Every 15 min'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 1 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? '#424242' : '#e0e0e0' }}>
                        {['System', 'Application', 'SEAL', 'Indicator', 'Status', 'Value'].map(h => (
                          <TableCell key={h} sx={{ ...fHead, py: 0.8, px: 1 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(report.systems || []).flatMap(sys =>
                        (sys.apps || []).flatMap(app =>
                          (app.indicators || []).map((ind, i) => (
                            <TableRow key={`${sys.system_id}-${app.seal}-${i}`} hover>
                              <TableCell sx={{ ...fBody, py: 0.5, px: 1, fontWeight: 600 }}>{sys.name}</TableCell>
                              <TableCell sx={{ ...fBody, py: 0.5, px: 1 }}>{app.name}</TableCell>
                              <TableCell sx={{ ...fSmall, py: 0.5, px: 1, color: 'text.secondary' }}>{app.seal}</TableCell>
                              <TableCell sx={{ ...fBody, py: 0.5, px: 1 }}>{ind.label}</TableCell>
                              <TableCell sx={{ py: 0.5, px: 1 }}>
                                <FiberManualRecordIcon sx={{ fontSize: 10, color: STATUS_COLOR[ind.status] || STATUS_COLOR.no_data, mr: 0.5, verticalAlign: 'middle' }} />
                                <Typography component="span" sx={fSmall}>{ind.status}</Typography>
                              </TableCell>
                              <TableCell sx={{ ...fSmall, py: 0.5, px: 1 }}>{ind.value ?? ''}</TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 2, py: 1, gap: 0.5 }}>
        <Button size="small" startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />} onClick={exportPdf}
          disabled={!report} sx={{ ...fSmall, textTransform: 'none' }}>
          Export PDF
        </Button>
        <Button size="small" startIcon={<TableChartIcon sx={{ fontSize: 16 }} />} onClick={exportExcel}
          disabled={!report} sx={{ ...fSmall, textTransform: 'none' }}>
          Export Excel
        </Button>
        <Button size="small" startIcon={<EmailIcon sx={{ fontSize: 16 }} />} onClick={generateEmail}
          disabled={!report} sx={{ ...fSmall, textTransform: 'none' }}>
          Email Report
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={onClose} sx={{ ...fSmall, textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
