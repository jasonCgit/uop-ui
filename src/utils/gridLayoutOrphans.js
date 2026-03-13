/**
 * Partition node IDs into connected (has at least one edge) and orphan (zero edges) sets.
 * @param {string[]} nodeIds
 * @param {Array<{source: string, target: string}>} edges
 * @returns {{ connectedIds: string[], orphanIds: string[] }}
 */
export function partitionByConnectivity(nodeIds, edges) {
  const nodeSet = new Set(nodeIds)
  const hasEdge = new Set()
  edges.forEach(e => {
    if (nodeSet.has(e.source)) hasEdge.add(e.source)
    if (nodeSet.has(e.target)) hasEdge.add(e.target)
  })
  const connectedIds = []
  const orphanIds = []
  nodeIds.forEach(id => {
    if (hasEdge.has(id)) connectedIds.push(id)
    else orphanIds.push(id)
  })
  return { connectedIds, orphanIds }
}

/**
 * Arrange orphan nodes in a compact grid, positioned to the right of
 * dagre-laid-out connected nodes (or centered at origin if none).
 *
 * @param {string[]} orphanIds - IDs of nodes with no edges
 * @param {{ minX: number, maxX: number, minY: number, maxY: number } | null} connectedBounds
 * @param {{ nodeW: number, nodeH: number, gapX?: number, gapY?: number, cols?: number }} opts
 * @returns {Object<string, { x: number, y: number }>} center positions keyed by node ID
 */
export function gridLayoutOrphans(orphanIds, connectedBounds, opts) {
  if (orphanIds.length === 0) return {}

  const { nodeW, nodeH, gapX = 60, gapY = 40, cols = 4 } = opts
  const cellW = nodeW + gapX
  const cellH = nodeH + gapY

  // Grid origin: right of connected bounds, or at (0,0)
  let originX, originY
  if (connectedBounds) {
    originX = connectedBounds.maxX + gapX + nodeW / 2
    originY = connectedBounds.minY
  } else {
    originX = 0
    originY = 0
  }

  const positions = {}
  orphanIds.forEach((id, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    positions[id] = {
      x: originX + col * cellW,
      y: originY + row * cellH,
    }
  })
  return positions
}
