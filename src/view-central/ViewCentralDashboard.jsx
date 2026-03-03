import { useState, useEffect, useCallback, useRef } from 'react'
import { ReactGridLayout, verticalCompactor } from 'react-grid-layout'
import {
  Box, Typography, Button, IconButton, Chip, Stack, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import SettingsIcon from '@mui/icons-material/Settings'
import WidgetsIcon from '@mui/icons-material/Widgets'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import NotificationsIcon from '@mui/icons-material/Notifications'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useNavigate, useParams } from 'react-router-dom'
import { loadViewCentral, saveViewCentral, generateWidgetId, resetViewToDefault, DEFAULT_VIEW_CENTRALS } from './viewCentralStorage'
import { WIDGET_REGISTRY } from './widgetRegistry'
import WidgetWrapper from './WidgetWrapper'
import WidgetAddDrawer from './WidgetAddDrawer'
import ViewCentralForm from './ViewCentralForm'
import NotificationDrawer from './NotificationDrawer'

const fBody = { fontSize: 'clamp(0.72rem, 0.95vw, 0.82rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const sealColor = { '90176': '#60a5fa', '90215': '#f87171', '88180': '#34d399' }
const sealLabel = { '90176': 'Advisor Connect', '90215': 'Spectrum Equities', '88180': 'Connect OS' }

export default function ViewCentralDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [view, setView] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [expandedWidgets, setExpandedWidgets] = useState(new Set())
  const [resetConfirm, setResetConfirm] = useState(false)
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [headerRevealed, setHeaderRevealed] = useState(false)
  const headerHideTimer = useRef(null)

  // Click anywhere outside header → hide immediately
  useEffect(() => {
    if (headerVisible || !headerRevealed) return
    const handleClickOutside = (e) => {
      const bar = document.getElementById('vc-header-bar')
      if (bar && !bar.contains(e.target)) {
        clearTimeout(headerHideTimer.current)
        setHeaderRevealed(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [headerVisible, headerRevealed])

  useEffect(() => {
    const loaded = loadViewCentral(id)
    if (!loaded) { navigate('/view-central'); return }
    setView(loaded)
  }, [id, navigate])


  const persist = useCallback((updated) => {
    setView(updated)
    saveViewCentral(updated)
  }, [])

  const gridRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const viewLoaded = view != null
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    ro.observe(el)
    // Measure immediately
    setContainerWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [viewLoaded])

  const layout = (view?.widgets || []).map(w => {
    const reg = WIDGET_REGISTRY[w.type]
    const isExpanded = expandedWidgets.has(w.i)
    return {
      i: w.i,
      x: isExpanded ? 0 : w.x,
      y: w.y,
      w: isExpanded ? 12 : w.w,
      h: w.h,
      minW: reg?.defaultLayout?.minW || 2,
      minH: reg?.defaultLayout?.minH || 2,
    }
  })

  // Persist position and size after drag or resize
  const handleLayoutChange = useCallback((newLayout) => {
    if (!view) return
    const updated = {
      ...view,
      widgets: view.widgets.map(w => {
        const item = newLayout.find(l => l.i === w.i)
        if (!item) return w
        if (expandedWidgets.has(w.i)) return { ...w, y: item.y, h: item.h }
        return { ...w, x: item.x, y: item.y, w: item.w, h: item.h }
      }),
    }
    persist(updated)
  }, [view, persist, expandedWidgets])

  const addWidget = useCallback((typeId) => {
    if (!view) return
    const reg = WIDGET_REGISTRY[typeId]
    if (!reg) return
    const newWidget = {
      i: generateWidgetId(),
      type: typeId,
      x: 0, y: Infinity,
      w: reg.defaultLayout.w,
      h: reg.defaultLayout.h,
      config: {},
    }
    persist({ ...view, widgets: [...view.widgets, newWidget] })
  }, [view, persist])

  const removeWidget = useCallback((widgetId) => {
    if (!view) return
    persist({ ...view, widgets: view.widgets.filter(w => w.i !== widgetId) })
  }, [view, persist])

  const toggleExpand = useCallback((widgetId) => {
    setExpandedWidgets(prev => {
      const next = new Set(prev)
      if (next.has(widgetId)) next.delete(widgetId)
      else next.add(widgetId)
      return next
    })
  }, [])

  const handleResetView = useCallback(() => {
    const reset = resetViewToDefault(id)
    if (reset) {
      setView(reset)
      setExpandedWidgets(new Set())
    }
    setResetConfirm(false)
  }, [id])

  const isDefaultView = DEFAULT_VIEW_CENTRALS.some(v => v.id === id)

  const handleSettingsSave = useCallback((formData) => {
    persist({ ...view, ...formData })
    setSettingsOpen(false)
  }, [view, persist])

  if (!view) return null

  const seals = view.filters?.seal || []
  const hasWidgets = view.widgets.length > 0

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Header bar — toggleable via hide/show button */}
      <Box
        id="vc-header-bar"
        onMouseMove={() => {
          if (headerVisible) return
          clearTimeout(headerHideTimer.current)
          if (!headerRevealed) {
            setHeaderRevealed(true)
          } else {
            headerHideTimer.current = setTimeout(() => setHeaderRevealed(false), 5000)
          }
        }}
        onMouseLeave={() => {
          if (!headerVisible) {
            headerHideTimer.current = setTimeout(() => setHeaderRevealed(false), 5000)
          }
        }}
        sx={{
          overflow: 'hidden',
          height: (headerVisible || headerRevealed) ? 'auto' : 4,
          transition: 'height 0.25s ease-in-out',
          borderBottom: (headerVisible || headerRevealed) ? '1px solid' : 'none',
          borderColor: 'divider',
          flexShrink: 0,
          cursor: (!headerVisible && !headerRevealed) ? 'pointer' : 'default',
          ...(!headerVisible && !headerRevealed && {
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.3)',
            },
          }),
        }}
      >
      <Box
        sx={{
          px: { xs: 1.5, sm: 2.5 }, py: 1,
          display: 'flex', alignItems: 'center', gap: 1.5,
          bgcolor: 'background.paper', flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <Tooltip title="Back to View Central">
          <IconButton size="small" onClick={() => navigate('/view-central')} sx={{ p: 0.5 }}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} noWrap sx={fBody}>{view.name}</Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
            {seals.map(s => (
              <Chip key={s} label={sealLabel[s] || `SEAL ${s}`} size="small"
                sx={{ height: 18, ...fSmall, bgcolor: `${sealColor[s] || '#94a3b8'}18`, color: sealColor[s] || '#94a3b8', fontWeight: 600 }} />
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setDrawerOpen(true)}
            sx={{ ...fSmall, textTransform: 'none', borderRadius: 1.5, py: 0.5 }}
          >
            Add Widget
          </Button>
          <Tooltip title={isEditing ? 'Lock layout' : 'Edit layout'}>
            <Button
              size="small"
              variant={isEditing ? 'contained' : 'outlined'}
              startIcon={isEditing ? <LockOpenIcon sx={{ fontSize: 16 }} /> : <LockIcon sx={{ fontSize: 16 }} />}
              onClick={() => setIsEditing(e => !e)}
              sx={{ ...fSmall, textTransform: 'none', borderRadius: 1.5, py: 0.5 }}
            >
              {isEditing ? 'Lock' : 'Edit'}
            </Button>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton size="small" onClick={() => setNotifDrawerOpen(true)} sx={{ p: 0.5 }}>
              <NotificationsIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {isDefaultView && (
            <Tooltip title="Reset to default layout">
              <IconButton size="small" onClick={() => setResetConfirm(true)} sx={{ p: 0.5 }}>
                <RestartAltIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Settings">
            <IconButton size="small" onClick={() => setSettingsOpen(true)} sx={{ p: 0.5 }}>
              <SettingsIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={headerVisible ? 'Hide bar' : 'Keep bar visible'}>
            <IconButton size="small" onClick={() => {
              if (headerVisible) {
                setHeaderVisible(false); setHeaderRevealed(false); clearTimeout(headerHideTimer.current)
              } else {
                setHeaderVisible(true); setHeaderRevealed(false); clearTimeout(headerHideTimer.current)
              }
            }} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
              {headerVisible ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
      </Box>

      {/* Grid area */}
      <div ref={gridRef} style={{ flex: 1, overflow: 'auto' }}>
        {!hasWidgets ? (
          <Box sx={{ textAlign: 'center', mt: 10 }}>
            <WidgetsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No widgets yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add widgets to start building your custom dashboard.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}
              sx={{ textTransform: 'none' }}>
              Add your first widget
            </Button>
          </Box>
        ) : containerWidth > 0 ? (
          <ReactGridLayout
            width={containerWidth}
            layout={layout}
            gridConfig={{
              cols: 12,
              rowHeight: 30,
              margin: [10, 10],
              containerPadding: [12, 12],
            }}
            dragConfig={{
              enabled: isEditing,
              handle: '.drag-handle',
            }}
            resizeConfig={{
              enabled: isEditing,
            }}
            compactor={verticalCompactor}
            onDragStop={(newLayout) => handleLayoutChange(newLayout)}
            onResizeStop={(newLayout) => handleLayoutChange(newLayout)}
          >
            {view.widgets.map(w => (
              <div key={w.i}>
                <WidgetWrapper
                  widgetInstance={w}
                  viewFilters={view.filters}
                  onRemove={removeWidget}
                  onExpand={toggleExpand}
                  isEditing={isEditing}
                  isExpanded={expandedWidgets.has(w.i)}
                />
              </div>
            ))}
          </ReactGridLayout>
        ) : null}
      </div>

      {/* Widget catalog drawer */}
      <WidgetAddDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdd={addWidget}
        currentWidgets={view.widgets}
      />

      {/* Settings dialog */}
      {settingsOpen && (
        <ViewCentralForm
          open
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSave}
          existingView={view}
        />
      )}

      {/* Notifications drawer */}
      <NotificationDrawer
        open={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        viewId={id}
        viewName={view.name}
      />

      {/* Reset confirmation */}
      <Dialog open={resetConfirm} onClose={() => setResetConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Reset to Default Layout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={fBody}>
            This will restore the default widgets and layout for "{view.name}". Any customizations will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetConfirm(false)} size="small">Cancel</Button>
          <Button onClick={handleResetView} color="warning" variant="contained" size="small">Reset</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
