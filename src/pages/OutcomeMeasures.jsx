import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Box, CircularProgress, Alert, Container, Collapse, IconButton, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useFilters } from '../FilterContext'
import { useRefresh } from '../RefreshContext'
import buildFilterQueryString from '../utils/buildFilterQueryString'
import { API_URL } from '../config'
import AppTreeSidebar from '../components/AppTreeSidebar'
import ExecutiveKpiBar from '../components/outcome-measures/ExecutiveKpiBar'
import SectionTabs from '../components/outcome-measures/SectionTabs'
import SectionKpiCards from '../components/outcome-measures/SectionKpiCards'
import OutcomeTrendChart from '../components/outcome-measures/OutcomeTrendChart'

function buildTreeFilterQs(baseQs, seals) {
  if (!seals || seals.length === 0) return baseQs
  const sealParams = seals.map(s => `seal=${encodeURIComponent(s)}`).join('&')
  return baseQs ? `${baseQs}&${sealParams}` : `?${sealParams}`
}

export default function OutcomeMeasures() {
  const [summary, setSummary] = useState(null)
  const [sectionData, setSectionData] = useState(null)
  const [enrichedMap, setEnrichedMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState(1)
  const [treeMode, setTreeMode] = useState('technology')
  const [selectedPath, setSelectedPath] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [treeSeals, setTreeSeals] = useState(null)
  const [baselinePeriod, setBaselinePeriod] = useState('12m')
  const [detailOpen, setDetailOpen] = useState(false)

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

  // Merge client-side filtered apps with enriched data (same pattern as Applications page)
  const treeApps = useMemo(() => {
    return filteredApps.map(app => ({
      ...app,
      ...(enrichedMap[app.name] || {}),
    }))
  }, [filteredApps, enrichedMap])

  const fetchEnrichedMap = useCallback(() => {
    return fetch(`${API_URL}/api/applications/enriched`)
      .then(r => { if (!r.ok) throw new Error(`apps — ${r.status}`); return r.json() })
      .then(appData => {
        const map = {}
        appData.forEach(app => { map[app.name] = app })
        setEnrichedMap(map)
      })
  }, [])

  const fetchSummary = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/outcome-measures/summary${qs}`)
      .then(r => { if (!r.ok) throw new Error(`summary — ${r.status}`); return r.json() })
      .then(setSummary)
  }, [])

  const fetchSection = useCallback((sectionId, qs = '') => {
    return fetch(`${API_URL}/api/outcome-measures/section/${sectionId}${qs}`)
      .then(r => { if (!r.ok) throw new Error(`section — ${r.status}`); return r.json() })
      .then(setSectionData)
  }, [])

  const fetchMetrics = useCallback((qs = '', sectionId = 1) => {
    setError(null)
    return Promise.all([
      fetchSummary(qs),
      fetchSection(sectionId, qs),
    ])
      .then(() => reportUpdated())
      .catch(e => setError(e.message))
  }, [fetchSummary, fetchSection, reportUpdated])

  // Initial fetch — enriched map (once) + metrics
  useEffect(() => {
    Promise.all([
      fetchEnrichedMap(),
      fetchMetrics(filterQs, 1),
    ]).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch metrics when filters change
  useEffect(() => {
    if (!loading) {
      const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
      fetchMetrics(qs, activeSection)
    }
  }, [filterQs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on global refresh tick
  useEffect(() => {
    if (refreshTick > 0) {
      const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
      fetchMetrics(qs, activeSection)
    }
  }, [refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch section when tab changes
  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId)
    setDetailOpen(true)
    setError(null)
    setSectionData(null)
    const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
    fetchSection(sectionId, qs).catch(e => setError(e.message))
  }, [fetchSection])

  const handleTreeSelect = useCallback((path, selectedApps) => {
    setSelectedPath(path)
    const seals = (!path || path === 'all') ? null : selectedApps.map(a => a.seal)
    setTreeSeals(seals)
    treeSealRef.current = seals
    const qs = buildTreeFilterQs(filterQsRef.current, seals)
    setError(null)
    fetchMetrics(qs, activeSection)
  }, [activeSection, fetchMetrics]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Alert severity="error">Failed to load outcome measures: {error}</Alert>
      </Container>
    )
  }

  const sections = summary?.sections || []
  const currentSection = sections.find(s => s.id === activeSection)
  const sectionKey = currentSection?.key

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
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2 } }}>
        {/* Executive KPI Bar — 3 hero cards */}
        <ExecutiveKpiBar kpis={summary?.executive_kpis || []} appCount={summary?.app_count || 0} baselinePeriod={baselinePeriod} onBaselinePeriodChange={setBaselinePeriod} />

        {/* Detail Section — collapsed by default */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
          <IconButton size="small" onClick={() => setDetailOpen(o => !o)}>
            <ExpandMoreIcon sx={{ transform: detailOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
          </IconButton>
          <Typography sx={{ fontWeight: 600, fontSize: 'clamp(0.85rem, 1.1vw, 0.95rem)', cursor: 'pointer' }} onClick={() => setDetailOpen(o => !o)}>
            Detail Metrics
          </Typography>
        </Box>
        <Collapse in={detailOpen}>
          <SectionTabs
            sections={sections}
            activeSection={activeSection}
            onChange={handleSectionChange}
          />
          <Box sx={{ mt: 1 }}>
            <SectionKpiCards data={sectionData} />
            {sectionData && (
              <OutcomeTrendChart
                data={sectionData}
                monthLabels={summary?.month_labels || []}
              />
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}
