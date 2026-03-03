import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Box, CircularProgress, Alert, Container } from '@mui/material'
import { useFilters } from '../FilterContext'
import { useRefresh } from '../RefreshContext'
import buildFilterQueryString from '../utils/buildFilterQueryString'
import { API_URL } from '../config'
import AppTreeSidebar from '../components/AppTreeSidebar'
import ExecutiveKpiBar from '../components/outcome-measures/ExecutiveKpiBar'
import ExecutiveSummary from '../components/outcome-measures/ExecutiveSummary'
import SectionTabs from '../components/outcome-measures/SectionTabs'
import SectionKpiCards from '../components/outcome-measures/SectionKpiCards'
import OutcomeTrendChart from '../components/outcome-measures/OutcomeTrendChart'
import OutcomeLeaderboard from '../components/outcome-measures/OutcomeLeaderboard'
import WorkstreamCards from '../components/outcome-measures/WorkstreamCards'
import CoverageSection from '../components/outcome-measures/CoverageSection'

function buildTreeFilterQs(baseQs, seals) {
  if (!seals || seals.length === 0) return baseQs
  const sealParams = seals.map(s => `seal=${encodeURIComponent(s)}`).join('&')
  return baseQs ? `${baseQs}&${sealParams}` : `?${sealParams}`
}

export default function OutcomeMeasures() {
  const [summary, setSummary] = useState(null)
  const [execSummary, setExecSummary] = useState(null)
  const [sectionData, setSectionData] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [coverage, setCoverage] = useState(null)
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState(1)
  const [sortBy, setSortBy] = useState(null)
  const [treeMode, setTreeMode] = useState('technology')
  const [selectedPath, setSelectedPath] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [treeSeals, setTreeSeals] = useState(null)

  const { activeFilters, searchText } = useFilters()
  const { refreshTick, reportUpdated } = useRefresh()
  const filterQs = useMemo(
    () => buildFilterQueryString(activeFilters, searchText),
    [activeFilters, searchText]
  )
  const filterQsRef = useRef(filterQs)
  filterQsRef.current = filterQs
  const treeSealRef = useRef(treeSeals)
  treeSealRef.current = treeSeals

  const fetchApps = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/applications/enriched${qs}`)
      .then(r => { if (!r.ok) throw new Error(`apps — ${r.status}`); return r.json() })
      .then(setApps)
  }, [])

  const fetchSummary = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/outcome-measures/summary${qs}`)
      .then(r => { if (!r.ok) throw new Error(`summary — ${r.status}`); return r.json() })
      .then(setSummary)
  }, [])

  const fetchExecSummary = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/outcome-measures/executive-summary${qs}`)
      .then(r => { if (!r.ok) throw new Error(`exec-summary — ${r.status}`); return r.json() })
      .then(setExecSummary)
  }, [])

  const fetchSection = useCallback((sectionId, qs = '') => {
    return fetch(`${API_URL}/api/outcome-measures/section/${sectionId}${qs}`)
      .then(r => { if (!r.ok) throw new Error(`section — ${r.status}`); return r.json() })
      .then(setSectionData)
  }, [])

  const fetchLeaderboard = useCallback((sectionId, qs = '', sort = null) => {
    const sortParam = sort ? `&sort_by=${sort}` : ''
    const sep = qs ? '&' : '?'
    const url = `${API_URL}/api/outcome-measures/leaderboard?section_id=${sectionId}${sortParam}${qs ? sep + qs.slice(1) : ''}`
    return fetch(url)
      .then(r => { if (!r.ok) throw new Error(`leaderboard — ${r.status}`); return r.json() })
      .then(setLeaderboard)
  }, [])

  const fetchCoverage = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/outcome-measures/coverage${qs}`)
      .then(r => { if (!r.ok) throw new Error(`coverage — ${r.status}`); return r.json() })
      .then(setCoverage)
  }, [])

  const fetchAll = useCallback((qs = '', sectionId = 1, sort = null) => {
    setError(null)
    return Promise.all([
      fetchApps(qs),
      fetchSummary(qs),
      fetchExecSummary(qs),
      fetchSection(sectionId, qs),
      fetchLeaderboard(sectionId, qs, sort),
      ...(sectionId === 5 ? [fetchCoverage(qs)] : []),
    ])
      .then(() => reportUpdated())
      .catch(e => setError(e.message))
  }, [fetchApps, fetchSummary, fetchExecSummary, fetchSection, fetchLeaderboard, fetchCoverage, reportUpdated])

  // Initial fetch
  useEffect(() => {
    fetchAll(filterQs, 1).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) {
      setSortBy(null)
      const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
      fetchAll(qs, activeSection, null)
    }
  }, [filterQs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on global refresh tick
  useEffect(() => {
    if (refreshTick > 0) {
      const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
      fetchAll(qs, activeSection, sortBy)
    }
  }, [refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch section + leaderboard when tab changes
  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId)
    setSortBy(null)
    setError(null)
    setSectionData(null)
    setLeaderboard(null)
    if (sectionId !== 5) setCoverage(null)
    const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
    Promise.all([
      fetchSection(sectionId, qs),
      fetchLeaderboard(sectionId, qs),
      ...(sectionId === 5 ? [fetchCoverage(qs)] : []),
    ]).catch(e => setError(e.message))
  }, [fetchSection, fetchLeaderboard, fetchCoverage])

  // Re-fetch leaderboard when sort changes
  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort)
    const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
    fetchLeaderboard(activeSection, qs, newSort)
      .catch(e => setError(e.message))
  }, [activeSection, fetchLeaderboard])

  const handleTreeSelect = useCallback((path, selectedApps) => {
    setSelectedPath(path)
    const seals = (!path || path === 'all') ? null : selectedApps.map(a => a.seal)
    setTreeSeals(seals)
    treeSealRef.current = seals
    const qs = buildTreeFilterQs(filterQsRef.current, seals)
    setSortBy(null)
    setError(null)
    fetchAll(qs, activeSection, null)
  }, [activeSection, fetchAll]) // eslint-disable-line react-hooks/exhaustive-deps

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
        apps={apps}
        selectedPath={selectedPath}
        onSelect={handleTreeSelect}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        treeMode={treeMode}
        onTreeModeChange={setTreeMode}
        width={280}
      />
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2 } }}>
        {/* Executive KPI Bar */}
        <ExecutiveKpiBar kpis={summary?.executive_kpis || []} appCount={summary?.app_count || 0} />

        {/* Executive Summary */}
        <ExecutiveSummary data={execSummary} />

        {/* Section Tabs */}
        <SectionTabs
          sections={sections}
          activeSection={activeSection}
          onChange={handleSectionChange}
        />

        {/* Section Content */}
        <Box sx={{ mt: 1 }}>
          {sectionKey === 'workstreams' ? (
            <WorkstreamCards data={sectionData} />
          ) : sectionKey === 'baselines' ? (
            <CoverageSection sectionData={sectionData} coverage={coverage} />
          ) : (
            <SectionKpiCards data={sectionData} />
          )}

          {/* Trend Chart (not for baselines) */}
          {sectionKey !== 'baselines' && sectionData && (
            <OutcomeTrendChart
              data={sectionData}
              monthLabels={summary?.month_labels || []}
            />
          )}

          {/* Leaderboard */}
          {leaderboard && (
            <OutcomeLeaderboard
              data={leaderboard}
              sectionKey={sectionKey}
              onSortChange={handleSortChange}
              activeSortBy={sortBy}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
