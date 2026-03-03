import { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Chip,
} from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import FilterPickerGrid from '../components/FilterPickerGrid'
import { APPS, parseSealDisplay } from '../data/appData'

const fSmall = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }
const fTiny = { fontSize: 'clamp(0.58rem, 0.75vw, 0.68rem)' }

export default function ViewCentralForm({ open, onClose, onSave, existingView }) {
  const isEdit = !!existingView
  const [name, setName] = useState(existingView?.name || '')
  const [description, setDescription] = useState(existingView?.description || '')
  const [filters, setFilters] = useState(existingView?.filters || {})

  const setFilterValue = (key, values) => {
    setFilters(prev => {
      const next = { ...prev }
      if (!values || values.length === 0) delete next[key]
      else next[key] = values
      return next
    })
  }

  const clearFilter = (key) => {
    setFilters(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const activeFilterCount = Object.values(filters).reduce((s, v) => s + (v?.length || 0), 0)

  const matchCount = useMemo(() => {
    return APPS.filter(app => {
      for (const [key, values] of Object.entries(filters)) {
        if (!values || values.length === 0) continue
        if (key === 'seal') {
          const rawValues = values.map(parseSealDisplay)
          if (!rawValues.includes(app.seal)) return false
        } else if (!values.includes(app[key])) return false
      }
      return true
    }).length
  }, [filters])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      ...(existingView || {}),
      name: name.trim(),
      description: description.trim(),
      filters,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{
        fontWeight: 700, fontSize: 'clamp(0.9rem, 1.1vw, 1rem)',
        pb: 1, display: 'flex', alignItems: 'center', gap: 1,
      }}>
        {isEdit ? 'Edit View Central' : 'Create View Central'}
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
          {/* Name & Description side by side */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label="Name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Spectrum Equities Dashboard"
              size="small"
              inputProps={{ maxLength: 60 }}
              sx={{ '& .MuiInputBase-root': fSmall }}
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this view's scope"
              size="small"
              inputProps={{ maxLength: 200 }}
              sx={{ '& .MuiInputBase-root': fSmall }}
            />
          </Box>

          {/* Filter Scope header */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            mt: 0.5, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{
                width: 22, height: 22, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.1)',
              }}>
                <TuneIcon sx={{ fontSize: 13, color: 'primary.main' }} />
              </Box>
              <Typography fontWeight={700} sx={fSmall}>Filter Scope</Typography>
              {activeFilterCount > 0 && (
                <Chip
                  label={`${activeFilterCount} active`}
                  size="small"
                  sx={{ height: 20, ...fTiny, fontWeight: 700, bgcolor: 'primary.main', color: '#fff', borderRadius: 1 }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography color="text.secondary" sx={fTiny}>
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{matchCount}</Box> of {APPS.length} apps
              </Typography>
              {activeFilterCount > 0 && (
                <Typography
                  onClick={() => setFilters({})}
                  sx={{ ...fTiny, color: 'error.main', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                >
                  Clear all
                </Typography>
              )}
            </Box>
          </Box>

          {/* Shared FilterPickerGrid — same as top-of-page */}
          <FilterPickerGrid
            filters={filters}
            onChange={setFilterValue}
            onClear={clearFilter}
            compact
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} size="small" sx={{ ...fSmall, textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          size="small"
          disabled={!name.trim()}
          sx={{ ...fSmall, textTransform: 'none', fontWeight: 700, px: 3, borderRadius: 1.5 }}
        >
          {isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
