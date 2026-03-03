import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, CircularProgress, Alert, Container, Button, Snackbar } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { useRefresh } from '../RefreshContext'
import { API_URL } from '../config'
import SituationHeader from '../components/situation-room/SituationHeader'
import SituationDetails from '../components/situation-room/SituationDetails'
import SystemsTable from '../components/situation-room/SystemsTable'
import EscalationNotes from '../components/situation-room/EscalationNotes'
import SituationReportDialog from '../components/situation-room/SituationReportDialog'

const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)' }

export default function SituationRoom() {
  const [situations, setSituations] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [detail, setDetail] = useState(null)
  const [formState, setFormState] = useState(null)
  const [systemsData, setSystemsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState('')
  const [timePeriod, setTimePeriod] = useState(7)
  const [reportOpen, setReportOpen] = useState(false)

  const { refreshTick, reportUpdated } = useRefresh()
  const indexRef = useRef(currentIndex)
  indexRef.current = currentIndex

  // ── Fetch list of situations ──────────────────────────────────────
  const fetchSituations = useCallback(() => {
    return fetch(`${API_URL}/api/situation-room/situations`)
      .then(r => { if (!r.ok) throw new Error(`situations — ${r.status}`); return r.json() })
  }, [])

  // ── Fetch full detail for a situation ─────────────────────────────
  const fetchDetail = useCallback((id) => {
    return fetch(`${API_URL}/api/situation-room/situations/${id}`)
      .then(r => { if (!r.ok) throw new Error(`detail — ${r.status}`); return r.json() })
  }, [])

  // ── Load detail into state ────────────────────────────────────────
  const loadSituation = useCallback((sit) => {
    return fetchDetail(sit.id).then(d => {
      setDetail(d)
      setFormState({
        incident_zoom: d.incident_zoom || '',
        wm_ait_zoom: d.wm_ait_zoom || '',
        incident_lead: d.incident_lead || '',
        opened_time: d.opened_time || '',
        state: d.state || 'Active',
        priority: d.priority || 'P1',
        teams_channels: d.teams_channels || [],
        escalation_notes: d.escalation_notes || '',
        time_period_days: d.time_period_days || 7,
      })
      setSystemsData(d.systems || [])
      setDirty(false)
    })
  }, [fetchDetail])

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    setError(null)
    fetchSituations()
      .then(list => {
        setSituations(list)
        if (list.length > 0) return loadSituation(list[0])
      })
      .then(() => reportUpdated())
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Refresh tick ──────────────────────────────────────────────────
  useEffect(() => {
    if (refreshTick > 0 && situations.length > 0) {
      const sit = situations[indexRef.current]
      if (sit) {
        loadSituation(sit)
          .then(() => reportUpdated())
          .catch(e => setError(e.message))
      }
    }
  }, [refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ────────────────────────────────────────────────────
  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= situations.length) return
    setCurrentIndex(idx)
    setLoading(true)
    setError(null)
    loadSituation(situations[idx])
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [situations, loadSituation])

  const handlePrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])
  const handleNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo])

  // ── Form changes ──────────────────────────────────────────────────
  const handleFormChange = useCallback((newForm) => {
    setFormState(newForm)
    setDirty(true)
  }, [])

  const handleEscalationChange = useCallback((value) => {
    setFormState(prev => ({ ...prev, escalation_notes: value }))
    setDirty(true)
  }, [])

  // ── Inline system override edits ──────────────────────────────────
  const handleSystemChange = useCallback((systemId, updates) => {
    if (!detail) return
    // Optimistic local update
    setSystemsData(prev => prev.map(sys =>
      sys.system_id === systemId ? { ...sys, ...updates } : sys
    ))
    // PATCH to API
    fetch(`${API_URL}/api/situation-room/situations/${detail.id}/systems/${systemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {
      setSnack('Failed to save system change')
    })
  }, [detail])

  // ── Save situation ────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!detail || !formState) return
    setSaving(true)
    fetch(`${API_URL}/api/situation-room/situations/${detail.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    })
      .then(r => { if (!r.ok) throw new Error(`save — ${r.status}`); return r.json() })
      .then(updated => {
        setDetail(prev => ({ ...prev, ...updated }))
        setDirty(false)
        setSnack('Situation saved')
        // Update summary list
        setSituations(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
      })
      .catch(e => setSnack(`Save failed: ${e.message}`))
      .finally(() => setSaving(false))
  }, [detail, formState])

  // ── New situation ─────────────────────────────────────────────────
  const handleNewSituation = useCallback(() => {
    const body = {
      incident_number: `INC${Date.now().toString().slice(-8)}`,
      title: 'New Situation',
      state: 'Active',
      priority: 'P1',
    }
    fetch(`${API_URL}/api/situation-room/situations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => { if (!r.ok) throw new Error(`create — ${r.status}`); return r.json() })
      .then(created => {
        setSituations(prev => [...prev, { id: created.id, incident_number: created.incident_number, title: created.title, state: created.state, priority: created.priority }])
        const newIdx = situations.length
        setCurrentIndex(newIdx)
        return loadSituation(created)
      })
      .then(() => setSnack('New situation created'))
      .catch(e => setSnack(`Create failed: ${e.message}`))
  }, [situations, loadSituation])

  // ── Refresh ───────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (!situations[currentIndex]) return
    setError(null)
    loadSituation(situations[currentIndex])
      .then(() => setSnack('Refreshed'))
      .catch(e => setError(e.message))
  }, [situations, currentIndex, loadSituation])

  // ── Time period ───────────────────────────────────────────────────
  const handleTimePeriodChange = useCallback((days) => {
    setTimePeriod(days)
    setFormState(prev => ({ ...prev, time_period_days: days }))
    setDirty(true)
  }, [])

  // ── Render ────────────────────────────────────────────────────────
  if (loading && !detail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !detail) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Alert severity="error">Failed to load Situation Room: {error}</Alert>
      </Container>
    )
  }

  if (!situations.length) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>No situations found.</Alert>
        <Button variant="contained" size="small" onClick={handleNewSituation} sx={{ textTransform: 'none' }}>
          Create First Situation
        </Button>
      </Container>
    )
  }

  const currentSituation = situations[currentIndex]

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2 }, maxWidth: 1400, mx: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}

      <SituationHeader
        situation={{ ...currentSituation, ...formState, ...detail }}
        currentIndex={currentIndex}
        totalCount={situations.length}
        timePeriod={timePeriod}
        onPrev={handlePrev}
        onNext={handleNext}
        onTimePeriodChange={handleTimePeriodChange}
        onRefresh={handleRefresh}
        onExport={() => setReportOpen(true)}
        onNewSituation={handleNewSituation}
      />

      <SituationDetails
        formState={formState}
        onChange={handleFormChange}
      />

      <SystemsTable
        systems={systemsData}
        onSystemChange={handleSystemChange}
      />

      <EscalationNotes
        value={formState?.escalation_notes}
        onChange={handleEscalationChange}
      />

      {/* Save button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <Button
          variant="contained" size="small"
          startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
          disabled={!dirty || saving}
          onClick={handleSave}
          sx={{ ...fSmall, textTransform: 'none', px: 3 }}
        >
          {saving ? 'Saving...' : 'Save Situation'}
        </Button>
      </Box>

      <SituationReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        situationId={detail?.id}
        situation={{ ...currentSituation, ...formState, ...detail }}
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack('')}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
