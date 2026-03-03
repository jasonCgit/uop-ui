import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Box, CircularProgress, Alert, Container } from '@mui/material'
import { useFilters } from '../FilterContext'
import { useRefresh } from '../RefreshContext'
import buildFilterQueryString from '../utils/buildFilterQueryString'
import { API_URL } from '../config'
import AppTreeSidebar from '../components/AppTreeSidebar'
import EsStatusBanner from '../components/essential-services/EsStatusBanner'
import EsRiskMatrix from '../components/essential-services/EsRiskMatrix'
import EsServiceList from '../components/essential-services/EsServiceList'
import EsDetailPanel from '../components/essential-services/EsDetailPanel'
import EsBusinessProcesses from '../components/essential-services/EsBusinessProcesses'
import EsImpactFlow from '../components/essential-services/EsImpactFlow'

function buildTreeFilterQs(baseQs, seals) {
  if (!seals || seals.length === 0) return baseQs
  const sealParams = seals.map(s => `seal=${encodeURIComponent(s)}`).join('&')
  return baseQs ? `${baseQs}&${sealParams}` : `?${sealParams}`
}

export default function EssentialServices() {
  const [summary, setSummary] = useState(null)
  const [selectedEs, setSelectedEs] = useState(null)
  const [esDetail, setEsDetail] = useState(null)
  const [impactGraph, setImpactGraph] = useState(null)
  const [processes, setProcesses] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

  const fetchSummary = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/essential-services/summary${qs}`)
      .then(r => { if (!r.ok) throw new Error(`summary — ${r.status}`); return r.json() })
      .then(setSummary)
  }, [])

  const fetchApps = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/applications/enriched${qs}`)
      .then(r => { if (!r.ok) throw new Error(`apps — ${r.status}`); return r.json() })
      .then(setApps)
  }, [])

  const fetchProcesses = useCallback((qs = '') => {
    return fetch(`${API_URL}/api/essential-services/business-processes${qs}`)
      .then(r => { if (!r.ok) throw new Error(`processes — ${r.status}`); return r.json() })
      .then(d => setProcesses(d.processes || []))
  }, [])

  const fetchEsDetail = useCallback((esId, qs = '') => {
    return Promise.all([
      fetch(`${API_URL}/api/essential-services/${esId}${qs}`)
        .then(r => { if (!r.ok) throw new Error(`detail — ${r.status}`); return r.json() })
        .then(setEsDetail),
      fetch(`${API_URL}/api/essential-services/impact-graph/${esId}${qs}`)
        .then(r => { if (!r.ok) throw new Error(`graph — ${r.status}`); return r.json() })
        .then(setImpactGraph),
    ])
  }, [])

  const fetchAll = useCallback((qs = '') => {
    return Promise.all([
      fetchSummary(qs),
      fetchApps(qs),
      fetchProcesses(qs),
    ])
      .then(() => reportUpdated())
      .catch(e => setError(e.message))
  }, [fetchSummary, fetchApps, fetchProcesses, reportUpdated])

  // Initial fetch
  useEffect(() => {
    fetchAll(filterQs).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) {
      const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
      fetchAll(qs)
      if (selectedEs) fetchEsDetail(selectedEs, qs).catch(() => {})
    }
  }, [filterQs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on global refresh tick
  useEffect(() => {
    if (refreshTick > 0) {
      const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
      fetchAll(qs)
      if (selectedEs) fetchEsDetail(selectedEs, qs).catch(() => {})
    }
  }, [refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectEs = useCallback((esId) => {
    if (esId === selectedEs) {
      setSelectedEs(null)
      setEsDetail(null)
      setImpactGraph(null)
      return
    }
    setSelectedEs(esId)
    const qs = buildTreeFilterQs(filterQsRef.current, treeSealRef.current)
    fetchEsDetail(esId, qs).catch(e => setError(e.message))
  }, [selectedEs, fetchEsDetail])

  const handleTreeSelect = useCallback((path, selectedApps) => {
    setSelectedPath(path)
    const seals = (!path || path === 'all') ? null : selectedApps.map(a => a.seal)
    setTreeSeals(seals)
    treeSealRef.current = seals
    const qs = buildTreeFilterQs(filterQsRef.current, seals)
    setSelectedEs(null)
    setEsDetail(null)
    setImpactGraph(null)
    setError(null)
    fetchAll(qs)
  }, [fetchAll])

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
        <Alert severity="error">Failed to load essential services: {error}</Alert>
      </Container>
    )
  }

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
        {/* Executive Status Banner */}
        <EsStatusBanner
          services={summary?.services || []}
          kpis={summary?.kpis || {}}
          selectedEs={selectedEs}
          onSelect={handleSelectEs}
        />

        {/* Risk Matrix */}
        <EsRiskMatrix
          services={summary?.services || []}
          riskMatrix={summary?.risk_matrix || {}}
          selectedEs={selectedEs}
          onSelect={handleSelectEs}
        />

        {/* Business Processes */}
        <EsBusinessProcesses
          processes={processes}
          selectedEs={selectedEs}
          onSelectEs={handleSelectEs}
        />

        {/* Detail Panel (when an ES is selected) */}
        {selectedEs && esDetail && (
          <>
            <EsDetailPanel
              detail={esDetail}
              onClose={() => { setSelectedEs(null); setEsDetail(null); setImpactGraph(null) }}
            />

            {/* Impact Flow */}
            {impactGraph && (
              <EsImpactFlow graph={impactGraph} serviceName={esDetail.service?.name || ''} />
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
