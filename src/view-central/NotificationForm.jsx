import { useState, useEffect, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Autocomplete, Chip,
  FormControlLabel, Checkbox, ToggleButtonGroup, ToggleButton,
  Select, MenuItem, FormControl, InputLabel, Stack, Divider,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import EmailIcon from '@mui/icons-material/Email'
import PersonIcon from '@mui/icons-material/Person'
import BadgeIcon from '@mui/icons-material/Badge'
import { generateNotifId } from './viewCentralStorage'
import { API_URL } from '../config'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }
const labelSx = { fontSize: '0.82rem' }
const fieldSx = { fontSize: '0.82rem' }

const FREQUENCY_OPTIONS = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly digest' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
  { value: 'custom', label: 'Custom schedule' },
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ALERT_TYPES = [
  { value: 'critical', label: 'Critical incidents', color: '#f44336' },
  { value: 'warning', label: 'Warnings & degradations', color: '#ff9800' },
  { value: 'change', label: 'Change notifications', color: '#60a5fa' },
  { value: 'slo', label: 'SLO breaches', color: '#a855f7' },
  { value: 'deployment', label: 'Deployment events', color: '#34d399' },
]

const ROLE_COLORS = {
  SRE: '#f44336',
  'App Owner': '#ff9800',
  'Dev Lead': '#60a5fa',
  'Engineering Manager': '#a855f7',
  'Product Owner': '#34d399',
  'QA Lead': '#78909c',
  'Platform Engineer': '#6264A7',
  'Scrum Master': '#e91e63',
}

const EMPTY_FORM = {
  name: '',
  alertTypes: ['critical'],
  channels: { teams: false, email: false, teamRoles: false },
  selectedTeamIds: [],
  teamsChannels: [],
  emailRecipients: [],
  teamRoles: [],
  roleMode: 'all',
  roleMembers: [],
  frequency: 'realtime',
  daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  startTime: '08:00',
  endTime: '18:00',
  enabled: true,
}

export default function NotificationForm({ open, onClose, onSave, existingNotif }) {
  const isEdit = !!existingNotif
  const [form, setForm] = useState(existingNotif || { ...EMPTY_FORM })
  const [emailInput, setEmailInput] = useState('')

  // Fetch teams from API
  const [allTeams, setAllTeams] = useState([])
  useEffect(() => {
    fetch(`${API_URL}/api/teams`).then(r => r.json()).then(setAllTeams).catch(() => {})
  }, [])

  // Fetch available roles from API
  const [allRoles, setAllRoles] = useState([])
  useEffect(() => {
    fetch(`${API_URL}/api/teams/roles`).then(r => r.json()).then(setAllRoles).catch(() => {})
  }, [])

  // Derive selected team objects from stored IDs
  const selectedTeams = useMemo(() =>
    allTeams.filter(t => (form.selectedTeamIds || []).includes(t.id)),
    [allTeams, form.selectedTeamIds])

  // Derive available channels from selected teams
  const availableChannels = useMemo(() => {
    const s = new Set()
    selectedTeams.forEach(t => t.teams_channels?.forEach(ch => s.add(ch)))
    return [...s]
  }, [selectedTeams])

  // Derive available emails from selected teams (group + member)
  const availableGroupEmails = useMemo(() => {
    const s = new Set()
    selectedTeams.forEach(t => t.emails?.forEach(e => s.add(e)))
    return [...s]
  }, [selectedTeams])

  const availableMemberEmails = useMemo(() => {
    const s = new Set()
    selectedTeams.forEach(t => (t.members || []).forEach(m => s.add(m.email)))
    return [...s]
  }, [selectedTeams])

  const availableEmails = useMemo(() =>
    [...new Set([...availableGroupEmails, ...availableMemberEmails])],
    [availableGroupEmails, availableMemberEmails])

  // Derive members matching selected roles from selected teams
  const roleFilteredMembers = useMemo(() => {
    if (!form.teamRoles || form.teamRoles.length === 0) return []
    const seen = new Set()
    const members = []
    selectedTeams.forEach(t => {
      (t.members || []).forEach(m => {
        if (form.teamRoles.includes(m.role) && !seen.has(m.sid)) {
          seen.add(m.sid)
          members.push(m)
        }
      })
    })
    return members
  }, [selectedTeams, form.teamRoles])

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const setChannel = (ch, val) => setForm(prev => ({
    ...prev,
    channels: { ...prev.channels, [ch]: val },
  }))

  const handleTeamChange = (_, teams) => {
    const ids = teams.map(t => t.id)
    const names = teams.map(t => t.name)
    // Auto-populate channels and emails from selected teams
    const channels = new Set()
    const emails = new Set()
    teams.forEach(t => {
      t.teams_channels?.forEach(ch => channels.add(ch))
      t.emails?.forEach(e => emails.add(e))
      ;(t.members || []).forEach(m => emails.add(m.email))
    })
    setForm(prev => ({
      ...prev,
      selectedTeamIds: ids,
      selectedTeamNames: names,
      teamsChannels: [...channels],
      emailRecipients: [...emails],
    }))
  }

  const handleEmailKey = (e) => {
    if (e.key === 'Enter' || e.key === ';' || e.key === ',') {
      e.preventDefault()
      const email = emailInput.trim().replace(/[;,]$/, '')
      if (email && !form.emailRecipients.includes(email)) {
        set('emailRecipients', [...form.emailRecipients, email])
      }
      setEmailInput('')
    }
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (!form.channels.teams && !form.channels.email && !form.channels.teamRoles) return
    onSave({
      ...form,
      id: form.id || generateNotifId(),
      name: form.name.trim(),
    })
  }

  const hasChannel = form.channels.teams || form.channels.email || form.channels.teamRoles
  const isCustom = form.frequency === 'custom'
  const hasTeamsSelected = selectedTeams.length > 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {isEdit ? 'Edit Notification' : 'Add Notification'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Name */}
          <TextField
            label="Notification Name"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g., Critical Alerts — Spectrum"
            size="small"
            inputProps={{ maxLength: 80 }}
            InputProps={{ sx: fieldSx }}
            InputLabelProps={{ sx: labelSx }}
          />

          {/* Alert types */}
          <Box>
            <Typography fontWeight={600} color="text.secondary"
              sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
              Alert Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {ALERT_TYPES.map(at => {
                const checked = form.alertTypes.includes(at.value)
                return (
                  <Chip
                    key={at.value}
                    label={at.label}
                    size="small"
                    onClick={() => {
                      if (checked) set('alertTypes', form.alertTypes.filter(a => a !== at.value))
                      else set('alertTypes', [...form.alertTypes, at.value])
                    }}
                    sx={{
                      ...fTiny,
                      height: 26,
                      fontWeight: 600,
                      bgcolor: checked ? `${at.color}22` : 'transparent',
                      color: checked ? at.color : 'text.secondary',
                      border: '1px solid',
                      borderColor: checked ? at.color : 'divider',
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </Box>
          </Box>

          <Divider />

          {/* Channels */}
          <Box>
            <Typography fontWeight={600} color="text.secondary"
              sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
              Notification Channels
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={form.channels.teams}
                  onChange={e => setChannel('teams', e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GroupsIcon sx={{ fontSize: 16, color: '#6264A7' }} />
                    <Typography sx={fSmall}>Teams</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={form.channels.email}
                  onChange={e => setChannel('email', e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 16, color: '#EA4335' }} />
                    <Typography sx={fSmall}>Email</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={form.channels.teamRoles}
                  onChange={e => setChannel('teamRoles', e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BadgeIcon sx={{ fontSize: 16, color: '#a855f7' }} />
                    <Typography sx={fSmall}>Team Roles</Typography>
                  </Box>
                }
              />
            </Stack>

            {/* Team selector — drives channels, emails, and roles */}
            {(form.channels.teams || form.channels.email || form.channels.teamRoles) && (
              <Autocomplete
                multiple size="small" disableCloseOnSelect
                options={allTeams}
                getOptionLabel={t => t.name}
                value={selectedTeams}
                onChange={handleTeamChange}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                    <Box>
                      <Typography sx={{ ...fSmall, fontWeight: 600 }}>{option.name}</Typography>
                      <Typography sx={{ ...fTiny, color: 'text.secondary' }}>
                        {option.teams_channels?.length || 0} channels · {option.emails?.length || 0} emails · {option.members?.length || 0} members
                      </Typography>
                    </Box>
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((t, index) => (
                    <Chip label={t.name} size="small" icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                      sx={{ height: 22, ...fTiny, fontWeight: 600 }} {...getTagProps({ index })} key={t.id} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label="Select Teams" placeholder="Search teams..."
                    sx={{
                      mb: 0.5,
                      '& .MuiInputLabel-root': fSmall,
                      '& .MuiInputBase-root': { ...fSmall, borderRadius: 1.5, flexWrap: 'wrap' },
                    }}
                  />
                )}
              />
            )}

            {/* Teams channel selector */}
            {form.channels.teams && availableChannels.length > 0 && (
              <Autocomplete
                multiple size="small" disableCloseOnSelect limitTags={2}
                options={availableChannels}
                value={form.teamsChannels}
                onChange={(_, val) => set('teamsChannels', val)}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                    <Typography sx={fSmall}>{option}</Typography></li>
                )}
                renderInput={params => (
                  <TextField {...params} label="Teams Channels" variant="outlined" size="small"
                    sx={{
                      mb: 1.5,
                      '& .MuiInputLabel-root': fSmall,
                      '& .MuiInputBase-root': { ...fSmall, borderRadius: 1.5 },
                    }}
                  />
                )}
                sx={{ '& .MuiChip-root': { height: 20, ...fTiny, borderRadius: 1 } }}
              />
            )}

            {/* Email recipients */}
            {form.channels.email && availableEmails.length > 0 && (
              <Autocomplete
                multiple size="small" freeSolo disableCloseOnSelect
                options={availableEmails}
                value={form.emailRecipients}
                onChange={(_, v) => set('emailRecipients', v)}
                renderOption={(props, option, { selected }) => {
                  const isMember = availableMemberEmails.includes(option)
                  return (
                    <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                      {isMember ? <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                        : <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />}
                      <Typography sx={fSmall}>{option}</Typography></li>
                  )
                }}
                renderTags={(value, getTagProps) =>
                  value.map((email, index) => {
                    const isMember = availableMemberEmails.includes(email)
                    return (
                      <Chip label={email} size="small"
                        icon={isMember
                          ? <PersonIcon sx={{ fontSize: '12px !important' }} />
                          : <EmailIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{ height: 20, ...fTiny }} {...getTagProps({ index })} key={email} />
                    )
                  })
                }
                renderInput={params => (
                  <TextField {...params} label="Email Recipients" placeholder="Pick emails or type custom..."
                    onKeyDown={handleEmailKey}
                    helperText="Select from teams or type custom email"
                    FormHelperTextProps={{ sx: fTiny }}
                    sx={{
                      mb: 1.5,
                      '& .MuiInputLabel-root': fSmall,
                      '& .MuiInputBase-root': { ...fSmall, borderRadius: 1.5, flexWrap: 'wrap' },
                    }}
                  />
                )}
              />
            )}
            {form.channels.email && availableEmails.length === 0 && (
              <TextField
                label="Email Recipients"
                size="small" fullWidth
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKey}
                placeholder="Select teams above or type email"
                InputProps={{ sx: fieldSx }}
                InputLabelProps={{ sx: labelSx }}
                helperText="Press Enter, comma, or semicolon to add"
                FormHelperTextProps={{ sx: fTiny }}
                sx={{ mb: 1.5 }}
              />
            )}

            {/* Team Roles selector */}
            {form.channels.teamRoles && (
              <Box sx={{ mt: 0.5 }}>
                {!hasTeamsSelected && (
                  <Typography sx={{ ...fTiny, color: 'text.disabled', fontStyle: 'italic', mb: 1 }}>
                    Select teams above to configure role-based recipients
                  </Typography>
                )}
                {hasTeamsSelected && (
                  <>
                    {/* Role selection chips */}
                    <Typography sx={{ ...fTiny, color: 'text.secondary', mb: 0.75, fontWeight: 600 }}>
                      Select Roles
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                      {allRoles.map(role => {
                        const checked = (form.teamRoles || []).includes(role)
                        const color = ROLE_COLORS[role] || '#94a3b8'
                        const count = selectedTeams.reduce((n, t) => n + (t.members || []).filter(m => m.role === role).length, 0)
                        return (
                          <Chip
                            key={role}
                            label={`${role} (${count})`}
                            size="small"
                            onClick={() => {
                              const current = form.teamRoles || []
                              if (checked) set('teamRoles', current.filter(r => r !== role))
                              else set('teamRoles', [...current, role])
                            }}
                            sx={{
                              ...fTiny,
                              height: 26,
                              fontWeight: 600,
                              bgcolor: checked ? `${color}22` : 'transparent',
                              color: checked ? color : 'text.secondary',
                              border: '1px solid',
                              borderColor: checked ? color : 'divider',
                              cursor: 'pointer',
                            }}
                          />
                        )
                      })}
                    </Box>

                    {/* Mode toggle: All vs Pick individuals */}
                    {(form.teamRoles || []).length > 0 && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography sx={{ ...fTiny, color: 'text.secondary', fontWeight: 600 }}>
                            Recipients:
                          </Typography>
                          <ToggleButtonGroup
                            value={form.roleMode || 'all'}
                            exclusive
                            onChange={(_, val) => { if (val) set('roleMode', val) }}
                            size="small"
                          >
                            <ToggleButton value="all"
                              sx={{ ...fTiny, px: 1.5, py: 0.3, textTransform: 'none' }}>
                              All members with role
                            </ToggleButton>
                            <ToggleButton value="pick"
                              sx={{ ...fTiny, px: 1.5, py: 0.3, textTransform: 'none' }}>
                              Pick individuals
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Box>

                        {/* Show matched member count for "all" mode */}
                        {(form.roleMode || 'all') === 'all' && (
                          <Typography sx={{ ...fTiny, color: 'text.secondary', mb: 1 }}>
                            {roleFilteredMembers.length} member{roleFilteredMembers.length !== 1 ? 's' : ''} across {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} will receive alerts
                          </Typography>
                        )}

                        {/* Individual member picker for "pick" mode */}
                        {(form.roleMode || 'all') === 'pick' && (
                          <Autocomplete
                            multiple size="small" disableCloseOnSelect
                            options={roleFilteredMembers}
                            getOptionLabel={m => `${m.firstName} ${m.lastName}`}
                            value={roleFilteredMembers.filter(m => (form.roleMembers || []).includes(m.sid))}
                            onChange={(_, val) => set('roleMembers', val.map(m => m.sid))}
                            isOptionEqualToValue={(opt, val) => opt.sid === val.sid}
                            renderOption={(props, option, { selected }) => {
                              const color = ROLE_COLORS[option.role] || '#94a3b8'
                              return (
                                <li {...props}>
                                  <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ ...fSmall, fontWeight: 600 }}>
                                      {option.firstName} {option.lastName}
                                    </Typography>
                                    <Typography sx={{ ...fTiny, color: 'text.secondary' }}>
                                      {option.email}
                                    </Typography>
                                  </Box>
                                  <Chip label={option.role} size="small"
                                    sx={{
                                      height: 18, ...fTiny, fontWeight: 600, ml: 1,
                                      bgcolor: `${color}22`, color,
                                    }}
                                  />
                                </li>
                              )
                            }}
                            renderTags={(value, getTagProps) =>
                              value.map((m, index) => {
                                const color = ROLE_COLORS[m.role] || '#94a3b8'
                                return (
                                  <Chip
                                    label={`${m.firstName} ${m.lastName}`}
                                    size="small"
                                    icon={<PersonIcon sx={{ fontSize: '12px !important' }} />}
                                    sx={{ height: 22, ...fTiny, fontWeight: 600, borderLeft: `3px solid ${color}` }}
                                    {...getTagProps({ index })}
                                    key={m.sid}
                                  />
                                )
                              })
                            }
                            renderInput={params => (
                              <TextField {...params} label="Pick Members" placeholder="Search members..."
                                sx={{
                                  mb: 1.5,
                                  '& .MuiInputLabel-root': fSmall,
                                  '& .MuiInputBase-root': { ...fSmall, borderRadius: 1.5, flexWrap: 'wrap' },
                                }}
                              />
                            )}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>

          <Divider />

          {/* Frequency */}
          <Box>
            <Typography fontWeight={600} color="text.secondary"
              sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
              Frequency & Schedule
            </Typography>
            <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
              <InputLabel sx={labelSx}>Frequency</InputLabel>
              <Select
                value={form.frequency}
                onChange={e => set('frequency', e.target.value)}
                label="Frequency"
                sx={{ ...fieldSx, borderRadius: 1.5 }}
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value} sx={fSmall}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Custom schedule: days of week */}
            {isCustom && (
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ ...fTiny, color: 'text.secondary', mb: 0.75 }}>
                  Days of Week
                </Typography>
                <ToggleButtonGroup
                  value={form.daysOfWeek}
                  onChange={(_, val) => set('daysOfWeek', val)}
                  size="small"
                  sx={{ flexWrap: 'wrap', gap: 0.5 }}
                >
                  {DAYS_OF_WEEK.map(day => (
                    <ToggleButton key={day} value={day}
                      sx={{ ...fTiny, px: 1.5, py: 0.5, borderRadius: '8px !important', border: '1px solid', borderColor: 'divider' }}>
                      {day}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Time window (for non-realtime) */}
            {form.frequency !== 'realtime' && (
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="From"
                  type="time"
                  size="small"
                  value={form.startTime}
                  onChange={e => set('startTime', e.target.value)}
                  InputProps={{ sx: fieldSx }}
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="To"
                  type="time"
                  size="small"
                  value={form.endTime}
                  onChange={e => set('endTime', e.target.value)}
                  InputProps={{ sx: fieldSx }}
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  sx={{ flex: 1 }}
                />
              </Stack>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small"
          disabled={!form.name.trim() || !hasChannel}>
          {isEdit ? 'Save Changes' : 'Add Notification'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
