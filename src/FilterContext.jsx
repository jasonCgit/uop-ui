import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { APPS, parseSealDisplay, parseDeployDisplay, SEAL_DISPLAY } from './data/appData'
import { useTenant } from './tenant/TenantContext'
import { loadProfile } from './utils/profileStorage'

const FilterContext = createContext()

export const useFilters = () => useContext(FilterContext)

function getEffectiveDefaults(tenant) {
  const profile = loadProfile()
  const profileDefaults = profile.defaultFilters || {}
  const tenantDefaults = tenant.defaultFilters || {}
  const hasProfileDefaults = Object.keys(profileDefaults).some(k => profileDefaults[k]?.length > 0)
  return hasProfileDefaults ? profileDefaults : tenantDefaults
}

const SS_FILTER_KEY = 'obs-filter-state'

function loadFilterState(tenantId) {
  try {
    const raw = sessionStorage.getItem(SS_FILTER_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.tenantId !== (tenantId || null)) return null
    return data
  } catch { return null }
}

function saveFilterState(tenantId, searchText, activeFilters) {
  sessionStorage.setItem(SS_FILTER_KEY, JSON.stringify({
    tenantId: tenantId || null,
    searchText,
    activeFilters,
  }))
}

// All recognised filter keys for URL param sync
const FILTER_KEYS = new Set([
  'lob', 'subLob', 'productLine', 'product',
  'cto', 'cbt', 'appOwner', 'seal',
  'cpof', 'riskRanking', 'classification', 'state',
  'investmentStrategy', 'rto', 'deployments',
])

function parseUrlFilters(searchParams) {
  const activeFilters = {}
  let hasAny = false
  for (const key of FILTER_KEYS) {
    const values = searchParams.getAll(key)
    if (values.length > 0) {
      activeFilters[key] = values
      hasAny = true
    }
  }
  const searchText = searchParams.get('search') || ''
  if (!hasAny && !searchText) return null
  return { searchText, activeFilters }
}

function filtersToSearchParams(searchText, activeFilters) {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const values = activeFilters[key] || []
    for (const v of values) params.append(key, v)
  }
  if (searchText) params.set('search', searchText)
  return params
}

// Shared filter-match logic used by both filteredApps and getCandidateApps
function appMatchesFilters(app, searchText, activeFilters, excludeKey = null) {
  if (searchText) {
    const q = searchText.toLowerCase()
    const searchable = [app.name, app.seal, app.team, app.appOwner, app.cto, app.cbt, app.productLine, app.product]
      .join(' ').toLowerCase()
    if (!searchable.includes(q)) return false
  }
  for (const [key, values] of Object.entries(activeFilters)) {
    if (key === excludeKey) continue
    if (values.length === 0) continue
    if (key === 'seal') {
      const rawValues = values.map(parseSealDisplay)
      if (!rawValues.includes(app.seal)) return false
    } else if (key === 'deployments') {
      const selectedIds = values.map(parseDeployDisplay)
      const appDepIds = (app.deployments || []).map(d => d.id)
      if (!selectedIds.some(id => appDepIds.includes(id))) return false
    } else if (!values.includes(app[key])) return false
  }
  return true
}

export function FilterProvider({ children }) {
  const { tenant } = useTenant()
  const [searchParams, setSearchParams] = useSearchParams()
  const skipUrlSync = useRef(false)

  const [searchText, setSearchText] = useState(() => {
    const fromUrl = parseUrlFilters(searchParams)
    if (fromUrl) return fromUrl.searchText
    const saved = loadFilterState(tenant.id)
    return saved?.searchText ?? ''
  })
  const [activeFilters, setActiveFilters] = useState(() => {
    const fromUrl = parseUrlFilters(searchParams)
    if (fromUrl) return fromUrl.activeFilters
    const saved = loadFilterState(tenant.id)
    return saved?.activeFilters ?? getEffectiveDefaults(tenant)
  })

  // Reset filters when tenant changes
  useEffect(() => {
    skipUrlSync.current = true
    setActiveFilters(getEffectiveDefaults(tenant))
    setSearchText('')
    sessionStorage.removeItem(SS_FILTER_KEY)
    setSearchParams(prev => {
      const next = new URLSearchParams()
      for (const [key, value] of prev.entries()) {
        if (!FILTER_KEYS.has(key) && key !== 'search') next.append(key, value)
      }
      return next
    }, { replace: true })
    skipUrlSync.current = false
  }, [tenant.id])                           // eslint-disable-line react-hooks/exhaustive-deps

  // Persist filter state to sessionStorage + URL
  useEffect(() => {
    saveFilterState(tenant.id, searchText, activeFilters)
    if (skipUrlSync.current) return
    setSearchParams(prev => {
      const next = new URLSearchParams()
      for (const [key, value] of prev.entries()) {
        if (!FILTER_KEYS.has(key) && key !== 'search') next.append(key, value)
      }
      const fp = filtersToSearchParams(searchText, activeFilters)
      for (const [key, value] of fp.entries()) next.append(key, value)
      return next
    }, { replace: true })
  }, [tenant.id, searchText, activeFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilterValues = useCallback((key, values) => {
    setActiveFilters(prev => {
      const next = { ...prev }
      if (!values || values.length === 0) {
        delete next[key]
      } else {
        next[key] = values
      }
      return next
    })
  }, [])

  const clearFilter = useCallback((key) => {
    setActiveFilters(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setActiveFilters({})
    setSearchText('')
  }, [])

  const resetToDefaults = useCallback(() => {
    setActiveFilters(getEffectiveDefaults(tenant))
    setSearchText('')
  }, [tenant])

  // Main filtered apps (all filters applied)
  const filteredApps = useMemo(() => {
    return APPS.filter(app => appMatchesFilters(app, searchText, activeFilters))
  }, [searchText, activeFilters])

  // Cascading filter: for a given field, return apps matching all OTHER filters
  const getCandidateApps = useCallback((excludeKey) => {
    return APPS.filter(app => appMatchesFilters(app, searchText, activeFilters, excludeKey))
  }, [searchText, activeFilters])

  // Type-ahead search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchText || searchText.length < 1) return []
    const q = searchText.toLowerCase()
    const suggestions = []
    const seen = new Set()
    // [displayLabel, appProperty, filterKey]
    const fields = [
      ['App',          'name',        'seal'],
      ['SEAL',         'seal',        'seal'],
      ['LOB',          'lob',         'lob'],
      ['Sub LOB',      'subLob',      'subLob'],
      ['Product Line', 'productLine', 'productLine'],
      ['Product',      'product',     'product'],
      ['CTO',          'cto',         'cto'],
      ['CBT',          'cbt',         'cbt'],
      ['Owner',        'appOwner',    'appOwner'],
      ['Team',         'team',        null],
    ]
    for (const app of APPS) {
      for (const [fieldLabel, fieldKey, filterKey] of fields) {
        const value = app[fieldKey]
        if (value && value.toLowerCase().includes(q) && !seen.has(`${fieldKey}:${value}`)) {
          seen.add(`${fieldKey}:${value}`)
          let filterValue = value
          if (filterKey === 'seal' && fieldKey === 'name') {
            filterValue = SEAL_DISPLAY[app.seal] || app.seal
          } else if (filterKey === 'seal' && fieldKey === 'seal') {
            filterValue = SEAL_DISPLAY[value] || value
          }
          suggestions.push({ field: fieldLabel, value, filterKey, filterValue })
        }
      }
    }
    return suggestions.slice(0, 15)
  }, [searchText])

  const activeFilterCount = Object.keys(activeFilters).length

  const value = {
    searchText,
    setSearchText,
    activeFilters,
    setFilterValues,
    clearFilter,
    clearAllFilters,
    resetToDefaults,
    filteredApps,
    activeFilterCount,
    totalApps: APPS.length,
    getCandidateApps,
    searchSuggestions,
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}
