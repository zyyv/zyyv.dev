import type { BookmarkNode } from '~/utils/bookmarks'
import { mc } from 'magic-color'

export interface BookmarkCanvasNode {
  id: string
  item: BookmarkNode | null
  parentId: string | null
  x: number
  y: number
  depth: number
  childCount: number
  direction: -1 | 0 | 1
  branchColor: string
}

export interface BookmarkCanvasEdge {
  id: string
  parentId: string
  childId: string
  path: string
  branchColor: string
}

export interface BookmarkCanvasBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface BookmarkCanvasLayout {
  width: number
  height: number
  centerX: number
  centerY: number
  nodes: BookmarkCanvasNode[]
  edges: BookmarkCanvasEdge[]
  parentById: Map<string, string | null>
}

const ROOT_ID = '__bookmark_root__'
const NODE_WIDTH = 196
const NODE_HEIGHT = 62
const LEVEL_GAP = 330
const LEAF_GAP = 112
const CANVAS_PADDING = 320
const branchColorCache = new Map<string, string>()

function randomBranchColor(id: string) {
  const cached = branchColorCache.get(id)
  if (cached) return cached
  const color = mc.random('hex')
  branchColorCache.set(id, color)
  return color
}

interface PositionedNode {
  item: BookmarkNode
  depth: number
  y: number
  childCount: number
  direction: -1 | 1
  branchColor: string
}

function descendantCount(node: BookmarkNode): number {
  return node.children.reduce((total, child) => total + 1 + descendantCount(child), 0)
}

function leafSlotCount(node: BookmarkNode): number {
  if (!node.children.length) return 1
  return node.children.reduce((total, child) => total + leafSlotCount(child), 0)
}

function maximumDepth(nodes: readonly BookmarkNode[], depth = 1): number {
  return nodes.reduce(
    (maximum, node) =>
      Math.max(maximum, node.children.length ? maximumDepth(node.children, depth + 1) : depth),
    depth,
  )
}

function stableOffset(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0
  return ((Math.abs(hash) % 7) - 3) * 9
}

function splitBranches(tree: readonly BookmarkNode[]) {
  const left: BookmarkNode[] = []
  const right: BookmarkNode[] = []
  let leftWeight = 0
  let rightWeight = 0

  for (const node of tree) {
    const weight = leafSlotCount(node)
    if (leftWeight <= rightWeight) {
      left.push(node)
      leftWeight += weight
    } else {
      right.push(node)
      rightWeight += weight
    }
  }

  return { left, right, leftWeight, rightWeight }
}

export function createBookmarkCanvasLayout(tree: readonly BookmarkNode[]): BookmarkCanvasLayout {
  const { left, right, leftWeight, rightWeight } = splitBranches(tree)
  const maxDepth = Math.max(maximumDepth(left), maximumDepth(right))
  const width = Math.max(1900, maxDepth * LEVEL_GAP * 2 + CANVAS_PADDING * 2)
  const height = Math.max(1100, Math.max(leftWeight, rightWeight, 1) * LEAF_GAP + 520)
  const centerX = width / 2
  const centerY = height / 2
  const positioned: PositionedNode[] = []

  function placeSide(nodes: readonly BookmarkNode[], direction: -1 | 1, leafCount: number) {
    let cursor = 0
    const sideNodes: PositionedNode[] = []

    function place(node: BookmarkNode, depth: number, branchColor: string): number {
      let y: number
      if (!node.children.length) {
        y = cursor * LEAF_GAP
        cursor += 1
      } else {
        const childPositions = node.children.map((child) => place(child, depth + 1, branchColor))
        y = childPositions.reduce((sum, position) => sum + position, 0) / childPositions.length
      }
      sideNodes.push({
        item: node,
        depth,
        y,
        childCount: descendantCount(node),
        direction,
        branchColor,
      })
      return y
    }

    for (const node of nodes) place(node, 1, randomBranchColor(node.id))
    const span = Math.max(0, (leafCount - 1) * LEAF_GAP)
    const offset = centerY - span / 2
    for (const node of sideNodes) {
      node.y += offset
      positioned.push(node)
    }
  }

  placeSide(left, -1, leftWeight)
  placeSide(right, 1, rightWeight)

  const nodes: BookmarkCanvasNode[] = [
    {
      id: ROOT_ID,
      item: null,
      parentId: null,
      x: centerX,
      y: centerY,
      depth: 0,
      childCount: positioned.length,
      direction: 0,
      branchColor: '#ef6259',
    },
  ]
  const parentById = new Map<string, string | null>([[ROOT_ID, null]])

  for (const entry of positioned) {
    const parentId = entry.item.parentId || ROOT_ID
    nodes.push({
      id: entry.item.id,
      item: entry.item,
      parentId,
      x: centerX + entry.direction * (entry.depth * LEVEL_GAP + stableOffset(entry.item.id)),
      y: entry.y,
      depth: entry.depth,
      childCount: entry.childCount,
      direction: entry.direction,
      branchColor: entry.branchColor,
    })
    parentById.set(entry.item.id, parentId)
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const edges: BookmarkCanvasEdge[] = []
  for (const node of nodes) {
    if (!node.parentId) continue
    const parent = nodeById.get(node.parentId)
    if (!parent) continue
    const direction = node.direction || 1
    const startX = parent.x + direction * (parent.id === ROOT_ID ? 76 : NODE_WIDTH / 2)
    const endX = node.x - direction * (NODE_WIDTH / 2)
    const controlDistance = Math.max(70, Math.abs(endX - startX) * 0.52)
    const firstX = startX + direction * controlDistance
    const secondX = endX - direction * controlDistance
    const bend = (stableOffset(node.id) || direction * 13) * 0.78
    edges.push({
      id: `${parent.id}:${node.id}`,
      parentId: parent.id,
      childId: node.id,
      path: `M ${startX} ${parent.y} C ${firstX} ${parent.y + bend}, ${secondX} ${node.y - bend}, ${endX} ${node.y}`,
      branchColor: node.branchColor,
    })
  }

  return { width, height, centerX, centerY, nodes, edges, parentById }
}

export function bookmarkAncestorIds(
  id: string | null,
  parentById: ReadonlyMap<string, string | null>,
) {
  const ancestors = new Set<string>()
  let current = id
  while (current) {
    ancestors.add(current)
    current = parentById.get(current) ?? null
  }
  return ancestors
}

export function bookmarkNodeInBounds(node: BookmarkCanvasNode, bounds: BookmarkCanvasBounds) {
  const halfWidth = node.id === ROOT_ID ? 90 : NODE_WIDTH / 2
  const halfHeight = NODE_HEIGHT / 2
  return (
    node.x + halfWidth >= bounds.left &&
    node.x - halfWidth <= bounds.right &&
    node.y + halfHeight >= bounds.top &&
    node.y - halfHeight <= bounds.bottom
  )
}

export { NODE_HEIGHT, NODE_WIDTH, ROOT_ID }
