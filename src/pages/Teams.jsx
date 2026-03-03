import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Container, Typography, Box, Card, CardContent, Grid, Chip, TextField,
  InputAdornment, IconButton, Button, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Divider, Autocomplete, Select, MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupsIcon from '@mui/icons-material/Groups'
import EmailIcon from '@mui/icons-material/Email'
import PersonIcon from '@mui/icons-material/Person'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import SettingsIcon from '@mui/icons-material/Settings'
import { API_URL } from '../config'
import { useAuth } from '../AuthContext'

const fBody  = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny  = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

const ROLE_COLORS = {
  SRE: '#f44336', 'App Owner': '#ff9800', 'Dev Lead': '#60a5fa',
  'Engineering Manager': '#a855f7', 'Product Owner': '#34d399',
  'QA Lead': '#78909c', 'Platform Engineer': '#6264A7', 'Scrum Master': '#e91e63',
}

/* ── Team Form Dialog ── */

const EMPTY_FORM = { name: '', emails: [''], teams_channels: [''], members: [] }

function TeamForm({ open, onClose, onSave, existing }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        emails: existing.emails?.length > 0 ? [...existing.emails] : [''],
        teams_channels: existing.teams_channels?.length > 0 ? [...existing.teams_channels] : [''],
        members: existing.members ? existing.members.map(m => ({ ...m })) : [],
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [existing, open])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const updateListItem = (key, idx, val) => {
    setForm(prev => {
      const list = [...prev[key]]
      list[idx] = val
      return { ...prev, [key]: list }
    })
  }

  const addListItem = (key) => {
    setForm(prev => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  const removeListItem = (key, idx) => {
    setForm(prev => {
      const list = prev[key].filter((_, i) => i !== idx)
      return { ...prev, [key]: list.length > 0 ? list : [''] }
    })
  }

  const valid = form.name.trim()

  // Directory search for adding members
  const [memberSearch, setMemberSearch] = useState('')
  const [dirResults, setDirResults] = useState([])
  const [selectedRole, setSelectedRole] = useState('SRE')
  const [roles, setRoles] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/teams/roles`).then(r => r.json()).then(data => {
      setRoles(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (memberSearch.length < 2) { setDirResults([]); return }
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/directory/search?q=${encodeURIComponent(memberSearch)}`)
        .then(r => r.json()).then(setDirResults).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearch])

  const addMember = useCallback((person) => {
    if (!person || form.members.some(m => m.sid === person.sid)) return
    setForm(prev => ({
      ...prev,
      members: [...prev.members, { sid: person.sid, firstName: person.firstName, lastName: person.lastName, email: person.email, role: selectedRole }],
    }))
    setMemberSearch('')
    setDirResults([])
  }, [form.members, selectedRole])

  const removeMember = (sid) => {
    setForm(prev => ({ ...prev, members: prev.members.filter(m => m.sid !== sid) }))
  }

  const updateMemberRole = (sid, role) => {
    setForm(prev => ({ ...prev, members: prev.members.map(m => m.sid === sid ? { ...m, role } : m) }))
  }

  const handleSave = () => {
    const cleaned = {
      name: form.name.trim(),
      emails: form.emails.map(e => e.trim()).filter(Boolean),
      teams_channels: form.teams_channels.map(c => c.trim()).filter(Boolean),
      members: form.members,
    }
    if (existing) cleaned.id = existing.id
    onSave(cleaned)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={fBody}>
        {existing ? 'Edit Team' : 'Create Team'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Team Name" size="small" required fullWidth
            value={form.name} onChange={e => set('name', e.target.value)}
            inputProps={{ maxLength: 80 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />

          {/* Emails */}
          <Box>
            <Typography fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny, mb: 1 }}>
              Email Addresses
            </Typography>
            <Stack spacing={0.75}>
              {form.emails.map((email, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    size="small" fullWidth placeholder="email@example.com"
                    value={email} onChange={e => updateListItem('emails', i, e.target.value)}
                    InputProps={{ sx: { ...fSmall, borderRadius: 1.5 } }}
                  />
                  <IconButton size="small" onClick={() => removeListItem('emails', i)}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                    <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => addListItem('emails')}
              sx={{ ...fTiny, textTransform: 'none', mt: 0.5 }}>
              Add Email
            </Button>
          </Box>

          {/* Teams Channels */}
          <Box>
            <Typography fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny, mb: 1 }}>
              Teams Channels
            </Typography>
            <Stack spacing={0.75}>
              {form.teams_channels.map((ch, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    size="small" fullWidth placeholder="#channel-name"
                    value={ch} onChange={e => updateListItem('teams_channels', i, e.target.value)}
                    InputProps={{ sx: { ...fSmall, borderRadius: 1.5 } }}
                  />
                  <IconButton size="small" onClick={() => removeListItem('teams_channels', i)}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                    <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => addListItem('teams_channels')}
              sx={{ ...fTiny, textTransform: 'none', mt: 0.5 }}>
              Add Channel
            </Button>
          </Box>

          {/* Members */}
          <Box>
            <Typography fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny, mb: 1 }}>
              Members
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
              <Autocomplete
                freeSolo size="small" sx={{ flex: 1 }}
                options={dirResults}
                getOptionLabel={o => typeof o === 'string' ? o : `${o.firstName} ${o.lastName} (${o.sid})`}
                inputValue={memberSearch}
                onInputChange={(_, v, reason) => { if (reason !== 'reset') setMemberSearch(v) }}
                onChange={(_, val) => { if (val && typeof val === 'object') addMember(val) }}
                filterOptions={x => x}
                renderOption={(props, opt) => {
                  const { key: k, ...rest } = props
                  return (
                    <li key={k} {...rest} style={{ ...rest.style, padding: '6px 12px' }}>
                      <Box>
                        <Typography sx={{ ...fSmall, fontWeight: 600 }}>{opt.firstName} {opt.lastName}</Typography>
                        <Typography sx={{ ...fTiny, color: 'text.secondary' }}>{opt.sid} &middot; {opt.email}</Typography>
                      </Box>
                    </li>
                  )
                }}
                renderInput={params => (
                  <TextField {...params} placeholder="Search directory by name or SID..."
                    InputProps={{ ...params.InputProps, sx: { ...fSmall, borderRadius: 1.5 } }} />
                )}
              />
              <Select size="small" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                sx={{ minWidth: 140, ...fSmall, borderRadius: 1.5 }}>
                {(roles.length > 0 ? roles : ['SRE']).map(r => (
                  <MenuItem key={r} value={r} sx={fSmall}>{r}</MenuItem>
                ))}
              </Select>
            </Box>

            {form.members.length > 0 && (
              <Stack spacing={0.5}>
                {form.members.map(m => (
                  <Box key={m.sid} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ ...fSmall, fontWeight: 600 }} noWrap>{m.firstName} {m.lastName}</Typography>
                      <Typography sx={{ ...fTiny, color: 'text.secondary' }} noWrap>{m.sid} &middot; {m.email}</Typography>
                    </Box>
                    <Select size="small" value={m.role} onChange={e => updateMemberRole(m.sid, e.target.value)}
                      sx={{ minWidth: 120, ...fTiny, height: 26, borderRadius: 1, bgcolor: `${ROLE_COLORS[m.role] || '#94a3b8'}18`, color: ROLE_COLORS[m.role] || '#94a3b8' }}>
                      {(roles.length > 0 ? roles : ['SRE']).map(r => (
                        <MenuItem key={r} value={r} sx={fTiny}>{r}</MenuItem>
                      ))}
                    </Select>
                    <IconButton size="small" onClick={() => removeMember(m.sid)}
                      sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                      <RemoveCircleOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
            {form.members.length === 0 && (
              <Typography sx={{ ...fTiny, color: 'text.disabled', fontStyle: 'italic' }}>
                No members added yet. Search the directory above to add team members.
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={!valid}>
          {existing ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ── Role Management Dialog (Admin) ── */

function RoleManageDialog({ open, onClose, roles, teams, onRolesChanged }) {
  const [newRole, setNewRole] = useState('')
  const [editingRole, setEditingRole] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  // Count members per role across all teams
  const roleCounts = useMemo(() => {
    const counts = {}
    roles.forEach(r => { counts[r] = 0 })
    teams.forEach(t => {
      (t.members || []).forEach(m => {
        if (counts[m.role] !== undefined) counts[m.role]++
        else counts[m.role] = 1
      })
    })
    return counts
  }, [roles, teams])

  const handleAdd = () => {
    const name = newRole.trim()
    if (!name) return
    fetch(`${API_URL}/api/teams/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.detail) })
      return r.json()
    }).then(() => {
      setNewRole('')
      setError('')
      onRolesChanged()
    }).catch(e => setError(e.message))
  }

  const handleRename = (oldName) => {
    const name = editName.trim()
    if (!name || name === oldName) { setEditingRole(null); return }
    fetch(`${API_URL}/api/teams/roles/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.detail) })
      return r.json()
    }).then(() => {
      setEditingRole(null)
      setError('')
      onRolesChanged()
    }).catch(e => setError(e.message))
  }

  const handleDelete = (roleName) => {
    fetch(`${API_URL}/api/teams/roles/${encodeURIComponent(roleName)}`, {
      method: 'DELETE',
    }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.detail) })
      return r.json()
    }).then(() => {
      setError('')
      onRolesChanged()
    }).catch(e => setError(e.message))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={fBody}>Manage Roles</DialogTitle>
      <DialogContent>
        {error && (
          <Typography sx={{ ...fTiny, color: 'error.main', mb: 1 }}>{error}</Typography>
        )}
        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
          {roles.map(role => {
            const count = roleCounts[role] || 0
            const color = ROLE_COLORS[role] || '#94a3b8'
            const isEditing = editingRole === role
            return (
              <Box key={role} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                {isEditing ? (
                  <TextField
                    size="small" autoFocus fullWidth
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => handleRename(role)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(role); if (e.key === 'Escape') setEditingRole(null) }}
                    InputProps={{ sx: { ...fSmall, borderRadius: 1, height: 28 } }}
                  />
                ) : (
                  <>
                    <Chip label={role} size="small"
                      sx={{ height: 22, ...fTiny, fontWeight: 600, bgcolor: `${color}18`, color, border: `1px solid ${color}40` }} />
                    <Typography sx={{ ...fTiny, color: 'text.secondary', flex: 1 }}>
                      {count} member{count !== 1 ? 's' : ''}
                    </Typography>
                    <Tooltip title="Rename">
                      <IconButton size="small" onClick={() => { setEditingRole(role); setEditName(role); setError('') }}
                        sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={count > 0 ? `${count} member(s) assigned — reassign before deleting` : 'Delete role'}>
                      <span>
                        <IconButton size="small" disabled={count > 0} onClick={() => handleDelete(role)}
                          sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </Box>
            )
          })}
        </Stack>

        {/* Add new role */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 2 }}>
          <TextField
            size="small" fullWidth placeholder="New role name..."
            value={newRole} onChange={e => setNewRole(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            InputProps={{ sx: { ...fSmall, borderRadius: 1.5 } }}
          />
          <Button size="small" variant="contained" onClick={handleAdd} disabled={!newRole.trim()}
            sx={{ ...fTiny, textTransform: 'none', minWidth: 60 }}>
            Add
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Close</Button>
      </DialogActions>
    </Dialog>
  )
}

/* ── Teams Page ── */

export default function Teams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [teams, setTeams] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState(() => searchParams.get('q') || '')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const { isAdmin } = useAuth()

  const fetchTeams = () => {
    fetch(`${API_URL}/api/teams`).then(r => r.json()).then(setTeams).catch(() => {})
  }

  const fetchRoles = () => {
    fetch(`${API_URL}/api/teams/roles`).then(r => r.json()).then(data => {
      setRoles(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }

  const handleRolesChanged = () => {
    fetchRoles()
    fetchTeams()
  }

  useEffect(() => { fetchTeams(); fetchRoles() }, [])

  // Sync search to URL params (debounced)
  const searchDebounceRef = useRef(null)
  useEffect(() => {
    clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('q')
        if (search) next.set('q', search)
        return next
      }, { replace: true })
    }, 300)
    return () => clearTimeout(searchDebounceRef.current)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = (form) => {
    fetch(`${API_URL}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(() => { fetchTeams(); setFormOpen(false) })
      .catch(() => {})
  }

  const handleEdit = (form) => {
    fetch(`${API_URL}/api/teams/${form.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(() => { fetchTeams(); setEditing(null) })
      .catch(() => {})
  }

  const handleDelete = (id) => {
    fetch(`${API_URL}/api/teams/${id}`, { method: 'DELETE' })
      .then(() => { fetchTeams(); setDeleteConfirm(null) })
      .catch(() => {})
  }

  const filtered = teams.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.name.toLowerCase().includes(q)
      || t.members?.some(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.sid.toLowerCase().includes(q))
  })

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <GroupsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700}>Teams</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={fBody}>
            Manage team contact information. Teams can be assigned to applications for quick access to emails and channels.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isAdmin && (
            <Button variant="outlined" startIcon={<SettingsIcon sx={{ fontSize: 16 }} />} onClick={() => setRoleDialogOpen(true)}
              sx={{ ...fSmall, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
              Manage Roles
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
            sx={{ ...fSmall, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
            Create Team
          </Button>
        </Box>
      </Box>

      {/* Roles overview */}
      {roles.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {roles.map(r => {
            const count = teams.reduce((n, t) => n + (t.members || []).filter(m => m.role === r).length, 0)
            const color = ROLE_COLORS[r] || '#94a3b8'
            return (
              <Chip key={r} label={`${r} (${count})`} size="small"
                sx={{ height: 22, ...fTiny, fontWeight: 600, bgcolor: `${color}18`, color, border: `1px solid ${color}40` }} />
            )
          })}
        </Box>
      )}

      {/* Search */}
      {teams.length > 0 && (
        <TextField fullWidth size="small"
          placeholder="Search teams by name..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2.5, maxWidth: 400 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            sx: { ...fBody, borderRadius: 2 },
          }}
        />
      )}

      {/* Empty state */}
      {teams.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <GroupsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No teams yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first team to manage contact information for your applications.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
            sx={{ textTransform: 'none' }}>
            Create your first team
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No teams match your search.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(t => (
            <Grid item xs={12} sm={6} md={4} key={t.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  {/* Team name + counts */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <GroupsIcon sx={{ fontSize: 22, color: 'primary.main', flexShrink: 0 }} />
                    <Typography fontWeight={700} sx={{ ...fBody, flex: 1, minWidth: 0 }} noWrap>
                      {t.name}
                    </Typography>
                  </Box>

                  {/* Count chips */}
                  <Stack direction="row" spacing={0.5} sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
                    <Chip
                      icon={<PersonIcon sx={{ fontSize: '12px !important' }} />}
                      label={`${t.members?.length || 0} members`}
                      size="small"
                      sx={{ height: 20, ...fTiny, bgcolor: 'rgba(76,175,80,0.12)', color: '#4caf50', fontWeight: 600 }}
                    />
                    <Chip
                      icon={<EmailIcon sx={{ fontSize: '12px !important' }} />}
                      label={`${t.emails?.length || 0} emails`}
                      size="small"
                      sx={{ height: 20, ...fTiny, bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', fontWeight: 600 }}
                    />
                    <Chip
                      icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                      label={`${t.teams_channels?.length || 0} channels`}
                      size="small"
                      sx={{ height: 20, ...fTiny, bgcolor: 'rgba(139,92,246,0.12)', color: '#8b5cf6', fontWeight: 600 }}
                    />
                  </Stack>

                  {/* Members with role distribution */}
                  {t.members?.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {/* Role distribution chips */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
                        {Object.entries(
                          (t.members || []).reduce((acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc }, {})
                        ).map(([role, count]) => {
                          const color = ROLE_COLORS[role] || '#94a3b8'
                          return (
                            <Chip key={role} label={`${count} ${role}`} size="small"
                              sx={{ height: 16, ...fTiny, fontSize: '0.5rem', bgcolor: `${color}18`, color, fontWeight: 600 }} />
                          )
                        })}
                      </Box>
                      {/* Member names */}
                      {t.members.slice(0, 3).map(m => (
                        <Typography key={m.sid} sx={{ ...fTiny, color: 'text.secondary', lineHeight: 1.6 }} noWrap>
                          {m.firstName} {m.lastName}
                        </Typography>
                      ))}
                      {t.members.length > 3 && (
                        <Typography sx={{ ...fTiny, color: 'text.disabled' }}>
                          +{t.members.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Emails */}
                  {t.emails?.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {t.emails.slice(0, 3).map(e => (
                        <Typography key={e} sx={{ ...fTiny, color: 'text.secondary', lineHeight: 1.6 }} noWrap>
                          {e}
                        </Typography>
                      ))}
                      {t.emails.length > 3 && (
                        <Typography sx={{ ...fTiny, color: 'text.disabled' }}>
                          +{t.emails.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Channels */}
                  {t.teams_channels?.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {t.teams_channels.slice(0, 3).map(ch => (
                        <Typography key={ch} sx={{ ...fTiny, color: 'text.secondary', lineHeight: 1.6 }} noWrap>
                          {ch}
                        </Typography>
                      ))}
                      {t.teams_channels.length > 3 && (
                        <Typography sx={{ ...fTiny, color: 'text.disabled' }}>
                          +{t.teams_channels.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditing(t)}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteConfirm(t)}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create dialog */}
      {formOpen && (
        <TeamForm open onClose={() => setFormOpen(false)} onSave={handleCreate} />
      )}

      {/* Edit dialog */}
      {editing && (
        <TeamForm open onClose={() => setEditing(null)} onSave={handleEdit} existing={editing} />
      )}

      {/* Role management dialog (admin) */}
      {roleDialogOpen && (
        <RoleManageDialog
          open
          onClose={() => setRoleDialogOpen(false)}
          roles={roles}
          teams={teams}
          onRolesChanged={handleRolesChanged}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={fBody}>Delete Team</DialogTitle>
        <DialogContent>
          <Typography sx={fBody}>
            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} size="small">Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" variant="contained" size="small">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
