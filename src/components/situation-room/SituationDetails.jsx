import { Card, CardContent, Typography, Grid, TextField, MenuItem, Select, FormControl, InputLabel, Autocomplete, Chip } from '@mui/material'

const fLabel = { fontSize: 'clamp(0.62rem, 0.78vw, 0.72rem)' }
const fField = { fontSize: 'clamp(0.72rem, 0.9vw, 0.82rem)' }

const STATE_OPTIONS = ['Active', 'Monitoring', 'Mitigated', 'Resolved']
const PRIORITY_OPTIONS = ['P1', 'P2']

export default function SituationDetails({ formState, onChange }) {
  if (!formState) return null

  const update = (field, value) => onChange({ ...formState, [field]: value })

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size="small" fullWidth label="Incident Zoom"
              value={formState.incident_zoom || ''}
              onChange={e => update('incident_zoom', e.target.value)}
              InputProps={{ sx: fField }}
              InputLabelProps={{ sx: fLabel }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size="small" fullWidth label="WM AI & T Zoom"
              value={formState.wm_ait_zoom || ''}
              onChange={e => update('wm_ait_zoom', e.target.value)}
              InputProps={{ sx: fField }}
              InputLabelProps={{ sx: fLabel }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size="small" fullWidth label="Incident Lead"
              value={formState.incident_lead || ''}
              onChange={e => update('incident_lead', e.target.value)}
              InputProps={{ sx: fField }}
              InputLabelProps={{ sx: fLabel }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size="small" fullWidth label="Opened Time"
              value={formState.opened_time || ''}
              onChange={e => update('opened_time', e.target.value)}
              InputProps={{ sx: fField }}
              InputLabelProps={{ sx: fLabel }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={fLabel}>State</InputLabel>
              <Select
                label="State"
                value={formState.state || 'Active'}
                onChange={e => update('state', e.target.value)}
                sx={fField}
              >
                {STATE_OPTIONS.map(s => <MenuItem key={s} value={s} sx={fField}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={fLabel}>Priority</InputLabel>
              <Select
                label="Priority"
                value={formState.priority || 'P1'}
                onChange={e => update('priority', e.target.value)}
                sx={fField}
              >
                {PRIORITY_OPTIONS.map(p => <MenuItem key={p} value={p} sx={fField}>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Autocomplete
              multiple freeSolo
              options={[]}
              value={formState.teams_channels || []}
              onChange={(_, v) => update('teams_channels', v)}
              renderTags={(value, getTagProps) =>
                value.map((ch, i) => (
                  <Chip key={ch} label={ch} size="small" sx={{ ...fLabel, height: 22 }} {...getTagProps({ index: i })} />
                ))
              }
              renderInput={params => (
                <TextField {...params} label="Teams Channels" size="small" placeholder="+ Add Teams Channel"
                  InputLabelProps={{ sx: fLabel }}
                  InputProps={{ ...params.InputProps, sx: fField }}
                />
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
