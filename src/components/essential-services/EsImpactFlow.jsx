import { memo, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dagre from '@dagrejs/dagre'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const STATUS_COLORS = {
  healthy:  { border: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  degraded: { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  down:     { border: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  no_data:  { border: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

// ── Custom Nodes ─────────────────────────────────────────────────────────────

const ServiceNode = memo(({ data }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const color = STATUS_COLORS[data.status] || STATUS_COLORS.no_data

  return (
    <Box sx={{
      bgcolor: isDark ? '#1e293b' : '#e2e8f0',
      border: `2.5px solid ${color.border}`,
      borderRadius: 2.5,
      px: 2, py: 1.5,
      minWidth: 180,
      textAlign: 'center',
      boxShadow: `0 0 12px ${color.border}40`,
    }}>
      <Typography fontWeight={800} sx={fSmall}>{data.label}</Typography>
      {data.criticality && (
        <Typography sx={{ ...fTiny, color: color.border, fontWeight: 700, textTransform: 'uppercase' }}>
          {data.criticality}
        </Typography>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color.border, width: 8, height: 8 }} />
    </Box>
  )
})
ServiceNode.displayName = 'ServiceNode'

const DeploymentNode = memo(({ data }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const DEPLOY_COLORS = {
    gap: '#8b5cf6', gkp: '#3b82f6', ecs: '#10b981',
    aws: '#f59e0b', eks: '#06b6d4',
  }
  const depColor = DEPLOY_COLORS[data.type] || '#64748b'

  return (
    <Box sx={{
      bgcolor: isDark ? `${depColor}15` : `${depColor}10`,
      border: `2px solid ${depColor}`,
      borderRadius: 2,
      px: 1.5, py: 1,
      minWidth: 80,
      textAlign: 'center',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: depColor, width: 6, height: 6 }} />
      <Typography fontWeight={700} sx={{ ...fSmall, color: depColor }}>{data.label}</Typography>
      <Handle type="source" position={Position.Bottom} style={{ background: depColor, width: 6, height: 6 }} />
    </Box>
  )
})
DeploymentNode.displayName = 'DeploymentNode'

const AppNode = memo(({ data }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const color = STATUS_COLORS[data.status] || STATUS_COLORS.no_data

  return (
    <Box sx={{
      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
      border: `1.5px solid ${color.border}`,
      borderRadius: 1.5,
      px: 1.5, py: 0.75,
      minWidth: 130,
      maxWidth: 200,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color.border, width: 6, height: 6 }} />
      <Typography fontWeight={600} sx={fSmall} noWrap>{data.label}</Typography>
      {data.seal && (
        <Typography sx={{ ...fTiny, color: 'text.disabled' }}>SEAL {data.seal}</Typography>
      )}
    </Box>
  )
})
AppNode.displayName = 'AppNode'

const nodeTypes = { service: ServiceNode, deployment: DeploymentNode, app: AppNode }

// ── Layout ───────────────────────────────────────────────────────────────────

function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 })
  g.setDefaultEdgeLabel(() => ({}))

  const nodeWidths = { service: 200, deployment: 100, app: 160 }
  const nodeHeights = { service: 60, deployment: 40, app: 40 }

  for (const node of nodes) {
    g.setNode(node.id, {
      width: nodeWidths[node.type] || 150,
      height: nodeHeights[node.type] || 40,
    })
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map(node => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: { x: pos.x - (nodeWidths[node.type] || 150) / 2, y: pos.y - (nodeHeights[node.type] || 40) / 2 },
    }
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EsImpactFlow({ graph, serviceName }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const { layoutNodes, flowEdges } = useMemo(() => {
    if (!graph || !graph.nodes) return { layoutNodes: [], flowEdges: [] }

    const laid = layoutGraph(graph.nodes, graph.edges)

    const flowEdges = graph.edges.map((e, i) => ({
      ...e,
      id: `e-${e.source}-${e.target}-${i}`,
      animated: true,
      style: { stroke: isDark ? '#475569' : '#94a3b8', strokeWidth: 1.5 },
    }))

    return { layoutNodes: laid, flowEdges }
  }, [graph, isDark])

  if (layoutNodes.length === 0) return null

  return (
    <Box sx={{ mt: 2 }}>
      <Typography fontWeight={700} color="text.secondary" sx={{ ...fSmall, mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Impact Flow &mdash; {serviceName}
      </Typography>
      <Box sx={{
        height: 400,
        border: '1px solid', borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: (t) => t.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
      }}>
        <ReactFlow
          nodes={layoutNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background color={isDark ? '#1e293b' : '#e2e8f0'} gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
    </Box>
  )
}
