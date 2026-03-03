import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Chip, Typography, Tooltip, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useFilters } from '../FilterContext'
import { FILTER_FIELDS } from '../data/appData'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const chipSx = {
  ...fSmall, height: 22, borderRadius: 1.5, fontWeight: 500,
  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.1)',
  border: '1px solid',
  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.3)' : 'rgba(21,101,192,0.25)',
  color: 'primary.main',
  '& .MuiChip-deleteIcon': { fontSize: 13 },
}

// Build a label lookup from FILTER_FIELDS
const FIELD_LABELS = Object.fromEntries(FILTER_FIELDS.map(f => [f.key, f.label]))

export default function ScopeBar() {
  const {
    searchText, setSearchText,
    activeFilters, setFilterValues, clearAllFilters,
    filteredApps, totalApps, activeFilterCount,
  } = useFilters()

  const [hidden, setHidden] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const hideTimerRef = useRef(null)

  const hasScope = activeFilterCount > 0 || searchText.length > 0
  const showBar = !hidden || revealed

  const handleMouseMove = () => {
    if (!hidden) return
    clearTimeout(hideTimerRef.current)
    if (!revealed) {
      setRevealed(true)
    } else {
      // Keep alive while mouse is moving; auto-hide after inactivity
      hideTimerRef.current = setTimeout(() => setRevealed(false), 5000)
    }
  }

  const handleMouseLeave = () => {
    if (hidden) {
      hideTimerRef.current = setTimeout(() => setRevealed(false), 5000)
    }
  }

  // Click anywhere outside → hide immediately
  useEffect(() => {
    if (!hidden || !revealed) return
    const handleClickOutside = (e) => {
      const bar = document.getElementById('scope-bar')
      if (bar && !bar.contains(e.target)) {
        clearTimeout(hideTimerRef.current)
        setRevealed(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [hidden, revealed])

  useEffect(() => () => clearTimeout(hideTimerRef.current), [])

  // Flat list of active filter chips
  const activeChips = []
  for (const { key } of FILTER_FIELDS) {
    const values = activeFilters[key] || []
    if (values.length > 0) {
      const label = FIELD_LABELS[key] || key
      values.forEach((v, i) => {
        activeChips.push({ key, label, value: v, idx: i })
      })
    }
  }

  // Drag-to-scroll for the chips area
  const chipsRef = useRef(null)
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  const handleDragStart = (e) => {
    const el = chipsRef.current
    if (!el) return
    dragState.current = { isDragging: true, startX: e.clientX, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  const handleDragMove = useCallback((e) => {
    const ds = dragState.current
    if (!ds.isDragging) return
    const el = chipsRef.current
    if (!el) return
    el.scrollLeft = ds.scrollLeft - (e.clientX - ds.startX)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragState.current.isDragging = false
    const el = chipsRef.current
    if (el) {
      el.style.cursor = 'grab'
      el.style.userSelect = ''
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  return (
    <Box
      id="scope-bar"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        overflow: 'hidden',
        height: showBar ? 40 : 4,
        transition: 'height 0.25s ease-in-out',
        borderBottom: showBar ? '1px solid' : 'none',
        borderColor: 'divider',
        flexShrink: 0,
        cursor: !showBar ? 'pointer' : 'default',
        ...(!showBar && {
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
          '&:hover': {
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.3)',
          },
        }),
      }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'center', height: 40,
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.06)' : 'rgba(21,101,192,0.03)',
      }}>
        {/* Scrollable / draggable chips area */}
        <Box
          ref={chipsRef}
          onMouseDown={handleDragStart}
          sx={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', gap: 0.5,
            pl: 2, pr: 1, py: 0.5,
            overflowX: 'auto',
            cursor: activeChips.length > 0 || searchText ? 'grab' : 'default',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {/* Search chip */}
          {searchText ? (
            <Chip
              label={`Search: "${searchText}"`}
              size="small"
              onDelete={() => setSearchText('')}
              deleteIcon={<CloseIcon sx={{ fontSize: '12px !important' }} />}
              sx={{ ...chipSx, flexShrink: 0 }}
            />
          ) : null}

          {/* Active filter chips only */}
          {activeChips.map((chip) => (
            <Chip
              key={`${chip.key}-${chip.value}-${chip.idx}`}
              label={`${chip.label}: ${chip.value}`}
              size="small"
              onDelete={() => {
                const values = activeFilters[chip.key] || []
                const next = values.filter(x => x !== chip.value)
                setFilterValues(chip.key, next)
              }}
              deleteIcon={<CloseIcon sx={{ fontSize: '12px !important' }} />}
              sx={{ ...chipSx, flexShrink: 0 }}
            />
          ))}

          {/* Empty state */}
          {!hasScope && (
            <Typography sx={{ ...fSmall, color: 'text.disabled', fontStyle: 'italic', flexShrink: 0 }}>
              No filters applied
            </Typography>
          )}
        </Box>

        {/* Right pinned: app count, clear, hide toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 2, py: 0.5, flexShrink: 0 }}>
          {/* App count */}
          <Typography sx={{ ...fSmall, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{filteredApps.length}</Box>
            {' '}of {totalApps} apps
          </Typography>

          {/* Clear all */}
          {hasScope && (
            <Typography
              onClick={clearAllFilters}
              sx={{
                ...fSmall, color: 'error.main', cursor: 'pointer', fontWeight: 600, ml: 0.5, whiteSpace: 'nowrap',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Clear
            </Typography>
          )}

          {/* Hide / Keep visible toggle */}
          <Tooltip title={hidden ? 'Keep bar visible' : 'Hide bar'}>
            <IconButton
              size="small"
              onClick={() => {
                if (hidden) {
                  setHidden(false); setRevealed(false); clearTimeout(hideTimerRef.current)
                } else {
                  setHidden(true); setRevealed(false); clearTimeout(hideTimerRef.current)
                }
              }}
              sx={{ p: 0.25, ml: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
            >
              {hidden
                ? <VisibilityIcon sx={{ fontSize: 14 }} />
                : <VisibilityOffIcon sx={{ fontSize: 14 }} />
              }
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}
