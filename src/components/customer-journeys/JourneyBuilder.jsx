import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, TextField, IconButton,
  CircularProgress, Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, Select, MenuItem, FormControl, InputLabel, List, ListItemButton, ListItemText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { API_URL } from '../../config'

const STATUS_COLOR = { healthy: '#4caf50', critical: '#f44336', warning: '#ff9800', no_data: '#9e9e9e' }
const STATUS_ICON = { healthy: CheckCircleIcon, critical: ErrorIcon, warning: WarningIcon, no_data: WarningIcon }
const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }
const fLabel = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }

export default function JourneyBuilder({ filterQs, refreshTick }) {
  const [journeys, setJourneys] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState(null)

  const fetchList = useCallback(() => {
    return fetch(`${API_URL}/api/customer-journeys/list${filterQs || ''}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(d => { setJourneys(d.journeys || []); return d })
      .catch(e => setError(e.message))
  }, [filterQs])

  const fetchDetail = useCallback((id) => {
    setDetailLoading(true)
    return fetch(`${API_URL}/api/customer-journeys/${id}${filterQs || ''}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(setDetail)
      .catch(e => setError(e.message))
      .finally(() => setDetailLoading(false))
  }, [filterQs])

  useEffect(() => {
    fetchList().finally(() => setLoading(false))
  }, [filterQs, refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
  }, [selectedId, filterQs]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/customer-journeys/${id}`, { method: 'DELETE' })
    if (selectedId === id) { setSelectedId(null); setDetail(null) }
    fetchList()
  }

  const handleSuggest = async () => {
    const res = await fetch(`${API_URL}/api/customer-journeys/suggest`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'suggest a journey' }),
    })
    const suggestion = await res.json()
    setEditData({
      name: suggestion.suggested_name || '',
      description: suggestion.suggested_description || '',
      criticality: suggestion.suggested_criticality || 'medium',
      customer_segment: suggestion.suggested_customer_segment || '',
      owner_lob: '',
      owner_team: '',
      steps: (suggestion.suggested_steps || []).map((s, i) => ({
        name: s.name, description: s.description || '',
        mapped_components: s.mapped_components || [], mapped_es_ids: s.mapped_es_ids || [],
      })),
    })
    setEditMode(false)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditData({
      name: '', description: '', criticality: 'medium', customer_segment: '',
      owner_lob: '', owner_team: '', steps: [{ name: '', description: '', mapped_components: [], mapped_es_ids: [] }],
    })
    setEditMode(false)
    setDialogOpen(true)
  }

  const handleEdit = () => {
    if (!detail) return
    setEditData({
      name: detail.name, description: detail.description, criticality: detail.criticality,
      customer_segment: detail.customer_segment, owner_lob: detail.owner_lob, owner_team: detail.owner_team,
      steps: detail.steps.map(s => ({
        name: s.name, description: s.description || '',
        mapped_components: s.mapped_components || [], mapped_es_ids: s.mapped_es_ids || [],
      })),
    })
    setEditMode(true)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editData) return
    const body = { ...editData }
    const method = editMode ? 'PUT' : 'POST'
    const url = editMode
      ? `${API_URL}/api/customer-journeys/${selectedId}`
      : `${API_URL}/api/customer-journeys`

    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setDialogOpen(false)
    const list = await fetchList()
    if (!editMode && list?.journeys?.length) {
      const newest = list.journeys[list.journeys.length - 1]
      setSelectedId(newest.id)
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%', minHeight: 500 }}>
      {/* Journey list panel */}
      <Card sx={{ width: 320, minWidth: 280, flexShrink: 0, overflow: 'auto' }}>
        <CardContent sx={{ py: 1.5, px: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography sx={{ ...fLabel, fontWeight: 700, flex: 1 }}>Journeys</Typography>
            <Chip label={journeys.length} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.62rem' }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleCreate}
              sx={{ textTransform: 'none', fontSize: '0.72rem', flex: 1 }}>New</Button>
            <Button size="small" variant="outlined" startIcon={<AutoFixHighIcon />} onClick={handleSuggest}
              sx={{ textTransform: 'none', fontSize: '0.72rem', flex: 1, color: '#1565c0', borderColor: '#1565c0' }}>AURA</Button>
          </Box>

          <List dense disablePadding>
            {journeys.map(j => {
              const Icon = STATUS_ICON[j.status] || STATUS_ICON.no_data
              return (
                <ListItemButton
                  key={j.id}
                  selected={selectedId === j.id}
                  onClick={() => setSelectedId(j.id)}
                  sx={{ borderRadius: 1, mb: 0.5, py: 0.75 }}
                >
                  <Icon sx={{ fontSize: 14, color: STATUS_COLOR[j.status] || '#9e9e9e', mr: 1 }} />
                  <ListItemText
                    primary={j.name}
                    secondary={`${j.step_count} steps · ${j.app_count} apps`}
                    primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 600, noWrap: true }}
                    secondaryTypographyProps={{ fontSize: '0.62rem' }}
                  />
                  <Chip
                    label={j.source === 'auto_es' ? 'Auto' : j.source === 'aura_suggested' ? 'AI' : 'Manual'}
                    size="small"
                    sx={{ height: 16, fontSize: '0.55rem', ml: 0.5 }}
                    variant="outlined"
                  />
                </ListItemButton>
              )
            })}
          </List>
        </CardContent>
      </Card>

      {/* Detail panel */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {!selectedId && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
            <Typography sx={{ ...fLabel }}>Select a journey to view details</Typography>
          </Box>
        )}

        {selectedId && detailLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
        )}

        {selectedId && detail && !detailLoading && (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>{detail.name}</Typography>
              <Chip label={detail.criticality} size="small" sx={{ textTransform: 'uppercase', fontSize: '0.62rem', fontWeight: 600 }} />
              <Chip label={detail.source === 'auto_es' ? 'Auto-generated' : detail.source === 'aura_suggested' ? 'AI Suggested' : 'Manual'} size="small" variant="outlined" sx={{ fontSize: '0.62rem' }} />
              <Button size="small" variant="outlined" onClick={handleEdit} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>Edit</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(detail.id)} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>Delete</Button>
            </Box>

            <Typography sx={{ ...fSmall, color: 'text.secondary', mb: 2 }}>{detail.description}</Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`Owner: ${detail.owner_team || detail.owner_lob || '—'}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
              <Chip label={`Segment: ${detail.customer_segment || '—'}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
              <Chip label={`SLO: ${detail.slo?.current || '—'}%`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', color: (detail.slo?.current || 0) >= 99.9 ? '#4caf50' : '#ff9800' }} />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Journey flow */}
            <Typography sx={{ ...fLabel, fontWeight: 700, mb: 1.5 }}>Journey Steps</Typography>
            <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap', rowGap: 2, mb: 3 }}>
              {detail.steps.map((step, i) => {
                const Icon = STATUS_ICON[step.status] || STATUS_ICON.no_data
                return (
                  <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', flex: '1 1 auto', minWidth: 180 }}>
                    <Card sx={{ flex: 1, border: `1px solid ${STATUS_COLOR[step.status] || '#9e9e9e'}44`, height: '100%' }}>
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.65rem' }}>
                            Step {i + 1}
                          </Typography>
                          <Icon sx={{ fontSize: 14, color: STATUS_COLOR[step.status] || '#9e9e9e' }} />
                        </Box>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25, lineHeight: 1.3 }}>{step.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mb: 1, lineHeight: 1.4 }}>
                          {step.app_count} apps mapped
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Latency</Typography>
                          <Typography variant="caption" fontWeight={600}>{step.latency}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Error Rate</Typography>
                          <Typography variant="caption" fontWeight={600} sx={{ color: step.error_rate > 5 ? '#f44336' : step.error_rate > 1 ? '#ff9800' : '#4caf50' }}>
                            {step.error_rate}%
                          </Typography>
                        </Box>

                        {/* Mapped apps */}
                        {step.mapped_app_details && step.mapped_app_details.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {step.mapped_app_details.slice(0, 3).map(app => (
                              <Chip
                                key={app.seal}
                                label={app.name}
                                size="small"
                                sx={{
                                  height: 18, fontSize: '0.55rem', mr: 0.5, mb: 0.5,
                                  bgcolor: `${STATUS_COLOR[app.status] || '#9e9e9e'}15`,
                                  color: STATUS_COLOR[app.status] || '#9e9e9e',
                                }}
                              />
                            ))}
                            {step.mapped_app_details.length > 3 && (
                              <Chip label={`+${step.mapped_app_details.length - 3}`} size="small" sx={{ height: 18, fontSize: '0.55rem' }} variant="outlined" />
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                    {i < detail.steps.length - 1 && (
                      <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled', mx: 0.5, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <JourneyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        data={editData}
        onChange={setEditData}
        isEdit={editMode}
        filterQs={filterQs}
      />
    </Box>
  )
}


function JourneyDialog({ open, onClose, onSave, data, onChange, isEdit, filterQs }) {
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const handleSearchComponents = async (query) => {
    if (!query || query.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/customer-journeys/component-search?q=${encodeURIComponent(query)}${filterQs ? '&' + filterQs.slice(1) : ''}`)
      const d = await res.json()
      setSearchResults(d.results || [])
    } finally { setSearchLoading(false) }
  }

  if (!data) return null

  const updateField = (field, value) => onChange({ ...data, [field]: value })
  const updateStep = (idx, field, value) => {
    const steps = [...data.steps]
    steps[idx] = { ...steps[idx], [field]: value }
    onChange({ ...data, steps })
  }
  const addStep = () => onChange({ ...data, steps: [...data.steps, { name: '', description: '', mapped_components: [], mapped_es_ids: [] }] })
  const removeStep = (idx) => onChange({ ...data, steps: data.steps.filter((_, i) => i !== idx) })
  const addComponentToStep = (idx, comp) => {
    const steps = [...data.steps]
    const existing = steps[idx].mapped_components || []
    if (!existing.find(c => c.component_id === comp.component_id && c.seal === comp.seal)) {
      steps[idx] = { ...steps[idx], mapped_components: [...existing, comp] }
      onChange({ ...data, steps })
    }
  }
  const removeComponentFromStep = (stepIdx, compIdx) => {
    const steps = [...data.steps]
    steps[stepIdx] = { ...steps[stepIdx], mapped_components: steps[stepIdx].mapped_components.filter((_, i) => i !== compIdx) }
    onChange({ ...data, steps })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
        {isEdit ? 'Edit Journey' : 'Create Journey'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Journey Name" value={data.name} onChange={e => updateField('name', e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Customer Segment" value={data.customer_segment} onChange={e => updateField('customer_segment', e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" value={data.description} onChange={e => updateField('description', e.target.value)} fullWidth size="small" multiline rows={2} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Criticality</InputLabel>
              <Select value={data.criticality} label="Criticality" onChange={e => updateField('criticality', e.target.value)}>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Owner LOB" value={data.owner_lob} onChange={e => updateField('owner_lob', e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Owner Team" value={data.owner_team} onChange={e => updateField('owner_team', e.target.value)} fullWidth size="small" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Steps</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addStep} sx={{ textTransform: 'none', fontSize: '0.72rem', ml: 'auto' }}>Add Step</Button>
        </Box>

        {data.steps.map((step, i) => (
          <Card key={i} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary' }}>Step {i + 1}</Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" onClick={() => removeStep(i)} disabled={data.steps.length <= 1}>
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={4}>
                  <TextField label="Step Name" value={step.name} onChange={e => updateStep(i, 'name', e.target.value)} fullWidth size="small" sx={{ '& .MuiInputBase-root': { fontSize: '0.78rem' } }} />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField label="Description" value={step.description} onChange={e => updateStep(i, 'description', e.target.value)} fullWidth size="small" sx={{ '& .MuiInputBase-root': { fontSize: '0.78rem' } }} />
                </Grid>
              </Grid>

              {/* Component search */}
              <Box sx={{ mt: 1 }}>
                <Autocomplete
                  options={searchResults}
                  getOptionLabel={opt => `${opt.app_name} (${opt.seal}) → ${opt.deployment} → ${opt.component_label}`}
                  onInputChange={(_, v) => handleSearchComponents(v)}
                  onChange={(_, v) => { if (v) addComponentToStep(i, v) }}
                  loading={searchLoading}
                  size="small"
                  renderInput={params => (
                    <TextField {...params} label="Search app, SEAL, or component..." size="small"
                      sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem' } }} />
                  )}
                  renderOption={(props, opt) => (
                    <li {...props} key={`${opt.seal}-${opt.component_id}-${opt.deployment}`}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{opt.component_label}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>
                          {opt.app_name} ({opt.seal}) · {opt.deployment}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  value={null}
                  blurOnSelect
                />
              </Box>

              {/* Mapped components */}
              {step.mapped_components && step.mapped_components.length > 0 && (
                <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {step.mapped_components.map((comp, ci) => (
                    <Chip
                      key={`${comp.seal}-${comp.component_id}-${ci}`}
                      label={`${comp.app_name || comp.seal} → ${comp.component_label || comp.component_id}`}
                      size="small"
                      onDelete={() => removeComponentFromStep(i, ci)}
                      sx={{ height: 22, fontSize: '0.62rem' }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={onSave} variant="contained" startIcon={<SaveIcon />} disabled={!data.name}
          sx={{ textTransform: 'none' }}>
          {isEdit ? 'Update' : 'Create'} Journey
        </Button>
      </DialogActions>
    </Dialog>
  )
}
