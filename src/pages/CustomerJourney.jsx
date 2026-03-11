import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, CircularProgress, Alert, Container, Tabs, Tab } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import BuildIcon from '@mui/icons-material/Build'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SecurityIcon from '@mui/icons-material/Security'
import MapIcon from '@mui/icons-material/Map'
import { useFilters } from '../FilterContext'
import { useRefresh } from '../RefreshContext'
import buildFilterQueryString from '../utils/buildFilterQueryString'
import { API_URL } from '../config'
import AppTreeSidebar from '../components/AppTreeSidebar'
import JourneyFlowClassic from '../components/customer-journeys/JourneyFlowClassic'
import JourneyBuilder from '../components/customer-journeys/JourneyBuilder'
import JourneyHealthDashboard from '../components/customer-journeys/JourneyHealthDashboard'
import JourneyAnalytics from '../components/customer-journeys/JourneyAnalytics'
import JourneyRiskReadiness from '../components/customer-journeys/JourneyRiskReadiness'
import JourneyMapEditor from '../components/customer-journeys/JourneyMapEditor'

const TABS = [
  { label: 'Journey Flow', Icon: RouteIcon },
  { label: 'Health Dashboard', Icon: DashboardIcon },
  { label: 'Journey Builder', Icon: BuildIcon },
  { label: 'Analytics & Trends', Icon: TrendingUpIcon },
  { label: 'Risk & Readiness', Icon: SecurityIcon },
  { label: 'Journey Map', Icon: MapIcon },
]

function buildTreeFilterQs(baseQs, seals) {
  if (!seals || seals.length === 0) return baseQs
  const sealParams = seals.map(s => `seal=${encodeURIComponent(s)}`).join('&')
  return baseQs ? `${baseQs}&${sealParams}` : `?${sealParams}`
}

export default function CustomerJourney() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const t = parseInt(searchParams.get('tab') || '0', 10)
    return t >= 0 && t < TABS.length ? t : 0
  })
  const [enrichedMap, setEnrichedMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [treeMode, setTreeMode] = useState('technology')
  const [selectedPath, setSelectedPath] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [treeSeals, setTreeSeals] = useState(null)

  const { filteredApps, activeFilters, searchText } = useFilters()
  const { refreshTick, reportUpdated } = useRefresh()
  const filterQs = useMemo(
    () => buildFilterQueryString(activeFilters, searchText),
    [activeFilters, searchText]
  )
  const filterQsRef = useRef(filterQs)
  filterQsRef.current = filterQs
  const treeSealRef = useRef(treeSeals)
  treeSealRef.current = treeSeals

  // Persist tab in URL
  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('tab')
      if (activeTab !== 0) next.set('tab', String(activeTab))
      return next
    }, { replace: true })
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Merge client-side filtered apps with enriched data
  const treeApps = useMemo(() => {
    return filteredApps.map(app => ({
      ...app,
      ...(enrichedMap[app.name] || {}),
    }))
  }, [filteredApps, enrichedMap])

  // Fetch enriched map once
  useEffect(() => {
    fetch(`${API_URL}/api/applications/enriched`)
      .then(r => { if (!r.ok) throw new Error(`apps — ${r.status}`); return r.json() })
      .then(appData => {
        const map = {}
        appData.forEach(app => { map[app.name] = app })
        setEnrichedMap(map)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Build effective query string
  const effectiveQs = useMemo(
    () => buildTreeFilterQs(filterQs, treeSeals),
    [filterQs, treeSeals]
  )

  const handleTreeSelect = useCallback((path, selectedApps) => {
    setSelectedPath(path)
    const seals = (!path || path === 'all') ? null : selectedApps.map(a => a.seal)
    setTreeSeals(seals)
    treeSealRef.current = seals
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <AppTreeSidebar
        apps={treeApps}
        selectedPath={selectedPath}
        onSelect={handleTreeSelect}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        treeMode={treeMode}
        onTreeModeChange={setTreeMode}
        width={280}
      />
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 1.5 }}>Failed to load: {error}</Alert>
        )}

        {/* Sub-tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 0.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 36,
              '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.82rem', fontWeight: 600 },
            }}
          >
            {TABS.map((tab, i) => (
              <Tab key={i} label={tab.label} icon={<tab.Icon sx={{ fontSize: 16 }} />} iconPosition="start" />
            ))}
          </Tabs>
        </Box>

        {/* Tab content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2 } }}>
          {activeTab === 0 && <JourneyFlowClassic />}
          {activeTab === 1 && <JourneyHealthDashboard filterQs={effectiveQs} refreshTick={refreshTick} />}
          {activeTab === 2 && <JourneyBuilder filterQs={effectiveQs} refreshTick={refreshTick} />}
          {activeTab === 3 && <JourneyAnalytics filterQs={effectiveQs} refreshTick={refreshTick} />}
          {activeTab === 4 && <JourneyRiskReadiness filterQs={effectiveQs} refreshTick={refreshTick} />}
          {activeTab === 5 && <JourneyMapEditor filterQs={effectiveQs} refreshTick={refreshTick} />}
        </Box>
      </Box>
    </Box>
  )
}
