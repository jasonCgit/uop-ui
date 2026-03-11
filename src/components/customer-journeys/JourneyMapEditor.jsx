import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Tooltip,
} from '@mui/material'
import {
  ReactFlow, Controls, Background, MarkerType, useNodesState, useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import { API_URL } from '../../config'

const STATUS_COLOR = { healthy: '#4caf50', critical: '#f44336', warning: '#ff9800', no_data: '#9e9e9e' }
const STATUS_ICON = { healthy: CheckCircleIcon, critical: ErrorIcon, warning: WarningIcon, no_data: WarningIcon }

const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.68rem)' }
const fLabel = { fontSize: 'clamp(0.68rem, 0.85vw, 0.78rem)' }

// ── Custom Node Types ────────────────────────────────────────────────────────

function StartNode({ data }) {
  return (
    <Box sx={{
      width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#1565c0', color: '#fff', boxShadow: 2,
    }}>
      <PlayArrowIcon sx={{ fontSize: 24 }} />
    </Box>
  )
}

function EndNode({ data }) {
  return (
    <Box sx={{
      width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#00695c', color: '#fff', boxShadow: 2,
    }}>
      <StopIcon sx={{ fontSize: 24 }} />
    </Box>
  )
}

function BusinessStepNode({ data }) {
  const statusColor = STATUS_COLOR[data.status] || STATUS_COLOR.no_data
  const StatusIcon = STATUS_ICON[data.status] || STATUS_ICON.no_data

  return (
    <Tooltip title={
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, mb: 0.5 }}>{data.label}</Typography>
        {data.mapped_apps?.map(app => (
          <Typography key={app.seal} sx={{ fontSize: '0.62rem' }}>
            {app.name} ({app.seal}) — {app.status}
          </Typography>
        ))}
      </Box>
    }>
      <Card sx={{
        width: 200, border: `2px solid ${statusColor}`, borderRadius: 2, boxShadow: 2,
        cursor: 'pointer', '&:hover': { boxShadow: 4 },
      }}>
        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
          {/* Step header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Chip
              label={`Step ${data.step_number}`}
              size="small"
              sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: `${statusColor}15`, color: statusColor }}
            />
            <StatusIcon sx={{ fontSize: 14, color: statusColor }} />
          </Box>

          {/* Step name */}
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}>
            {data.label}
          </Typography>

          {/* Metrics */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Latency</Typography>
            <Typography sx={{ ...fSmall, fontWeight: 600 }}>{data.latency}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Error Rate</Typography>
            <Typography sx={{ ...fSmall, fontWeight: 600, color: data.error_rate > 5 ? '#f44336' : data.error_rate > 1 ? '#ff9800' : '#4caf50' }}>
              {data.error_rate}%
            </Typography>
          </Box>

          {/* App count */}
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={`${data.app_count || 0} apps`}
              size="small"
              sx={{ height: 16, fontSize: '0.55rem', color: 'text.secondary' }}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  )
}

const nodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  businessStep: BusinessStepNode,
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 },
  style: { strokeWidth: 2 },
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function JourneyMapEditor({ filterQs, refreshTick }) {
  const [journeyList, setJourneyList] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [journeyStatus, setJourneyStatus] = useState(null)

  // Fetch journey list
  useEffect(() => {
    fetch(`${API_URL}/api/customer-journeys/list${filterQs || ''}`)
      .then(r => r.json())
      .then(d => {
        setJourneyList(d.journeys || [])
        if (!selectedId && d.journeys?.length) setSelectedId(d.journeys[0].id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filterQs, refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch flow graph for selected journey
  useEffect(() => {
    if (!selectedId) return
    fetch(`${API_URL}/api/customer-journeys/${selectedId}/flow-graph${filterQs || ''}`)
      .then(r => r.json())
      .then(flowData => {
        if (flowData.error) { setError(flowData.error); return }

        setJourneyStatus(flowData.journey)

        // Transform nodes for ReactFlow
        const rfNodes = flowData.nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
          draggable: true,
        }))

        const rfEdges = flowData.edges.map(e => ({
          ...e,
          ...defaultEdgeOptions,
          animated: e.animated || false,
          style: {
            ...defaultEdgeOptions.style,
            stroke: e.animated ? '#f44336' : '#90a4ae',
          },
        }))

        setNodes(rfNodes)
        setEdges(rfEdges)
      })
      .catch(e => setError(e.message))
  }, [selectedId, filterQs]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 300 }}>
          <InputLabel>Select Journey</InputLabel>
          <Select value={selectedId || ''} label="Select Journey" onChange={e => setSelectedId(e.target.value)}
            sx={{ fontSize: '0.82rem' }}>
            {journeyList.map(j => (
              <MenuItem key={j.id} value={j.id} sx={{ fontSize: '0.82rem' }}>{j.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {journeyStatus && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={journeyStatus.status}
              size="small"
              sx={{
                height: 22, fontSize: '0.65rem', fontWeight: 600,
                bgcolor: `${STATUS_COLOR[journeyStatus.status] || '#9e9e9e'}1a`,
                color: STATUS_COLOR[journeyStatus.status] || '#9e9e9e',
              }}
            />
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
              Drag nodes to rearrange. Hover for app details.
            </Typography>
          </Box>
        )}
      </Box>

      {/* ReactFlow Canvas */}
      <Box sx={{ flex: 1, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultEdgeOptions={defaultEdgeOptions}
          proOptions={{ hideAttribution: true }}
        >
          <Controls position="bottom-right" />
          <Background variant="dots" gap={20} size={1} color="#e0e0e0" />
        </ReactFlow>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
        <Typography sx={{ ...fSmall, color: 'text.secondary' }}>Legend:</Typography>
        {Object.entries(STATUS_COLOR).filter(([k]) => k !== 'no_data').map(([status, color]) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
            <Typography sx={{ ...fSmall, textTransform: 'capitalize' }}>{status}</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 20, height: 2, bgcolor: '#f44336', position: 'relative', '&::after': { content: '""', position: 'absolute', right: -3, top: -3, width: 8, height: 8, borderRadius: '50%', bgcolor: '#f44336', animation: 'pulse 1.5s infinite' } }} />
          <Typography sx={{ ...fSmall }}>Critical path (animated)</Typography>
        </Box>
      </Box>
    </Box>
  )
}
