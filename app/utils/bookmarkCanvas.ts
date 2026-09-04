import type { BookmarkNode } from '~/utils/bookmarks'

export interface BookmarkCanvasNode {
  id: string
  item: BookmarkNode | null
  parentId: string | null
  x: number
  y: number
  depth: number
  childCount: number
  size: number
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
const ROOT_WIDTH = 152
const FOLDER_MIN_SIZE = 64
const FOLDER_MAX_SIZE = 120
const FIRST_RING_RADIUS = 430
const RING_GAP = 290
const NODE_GAP = 30
const LANE_GAP = NODE_HEIGHT + NODE_GAP
const CANVAS_PADDING = 260
const TAU = Math.PI * 2

function branchColor(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0
  }
  return `hsl(${Math.abs(hash) % 360} 62% 56%)`
}

interface PositionedNode {
  item: BookmarkNode
  depth: number
  angle: number
  childCount: number
  branchColor: string
}

interface Point {
  x: number
  y: number
}

function descendantCount(node: BookmarkNode): number {
  return node.children.reduce((total, child) => total + 1 + descendantCount(child), 0)
}

function leafSlotCount(node: BookmarkNode): number {
  if (!node.children.length) return 1
  return node.children.reduce((total, child) => total + leafSlotCount(child), 0)
}

function folderSize(childCount: number) {
  return Math.min(FOLDER_MAX_SIZE, FOLDER_MIN_SIZE + Math.sqrt(childCount) * 5.5)
}

function cardsOverlap(left: Point, right: Point) {
  return (
    Math.abs(left.x - right.x) < NODE_WIDTH + NODE_GAP &&
    Math.abs(left.y - right.y) < NODE_HEIGHT + NODE_GAP
  )
}

function rectangleEdgePoint(from: Point, to: Point, halfWidth: number, halfHeight: number) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const divisor = Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight)
  if (!divisor) return from
  return { x: from.x + dx / divisor, y: from.y + dy / divisor }
}

function nodeHalfSize(node: BookmarkCanvasNode) {
  if (node.id === ROOT_ID) return { width: ROOT_WIDTH / 2, height: NODE_HEIGHT / 2 }
  if (node.item?.kind === 'folder') return { width: node.size / 2, height: node.size / 2 }
  return { width: NODE_WIDTH / 2, height: NODE_HEIGHT / 2 }
}

function edgePath(parent: BookmarkCanvasNode, child: BookmarkCanvasNode, center: Point) {
  const parentSize = nodeHalfSize(parent)
  const childSize = nodeHalfSize(child)
  const start = rectangleEdgePoint(parent, child, parentSize.width, parentSize.height)
  const end = rectangleEdgePoint(child, parent, childSize.width, childSize.height)
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const controlDistance = Math.max(70, Math.min(distance * 0.42, RING_GAP * 0.72))
  const parentDistance = Math.hypot(parent.x - center.x, parent.y - center.y)
  const childDistance = Math.hypot(child.x - center.x, child.y - center.y)
  const parentUnit = parentDistance
    ? { x: (parent.x - center.x) / parentDistance, y: (parent.y - center.y) / parentDistance }
    : { x: (child.x - parent.x) / distance, y: (child.y - parent.y) / distance }
  const childUnit = {
    x: (child.x - center.x) / childDistance,
    y: (child.y - center.y) / childDistance,
  }
  const first = {
    x: start.x + parentUnit.x * controlDistance,
    y: start.y + parentUnit.y * controlDistance,
  }
  const second = {
    x: end.x - childUnit.x * controlDistance,
    y: end.y - childUnit.y * controlDistance,
  }

  return `M ${start.x} ${start.y} C ${first.x} ${first.y}, ${second.x} ${second.y}, ${end.x} ${end.y}`
}

export function createBookmarkCanvasLayout(tree: readonly BookmarkNode[]): BookmarkCanvasLayout {
  const leafCount = Math.max(
    1,
    tree.reduce((total, node) => total + leafSlotCount(node), 0),
  )
  const positioned: PositionedNode[] = []
  let slotCursor = 0

  function place(node: BookmarkNode, depth: number, branchColor: string, startSlot: number) {
    const slots = leafSlotCount(node)
    let childCursor = startSlot

    for (const child of node.children) {
      place(child, depth + 1, branchColor, childCursor)
      childCursor += leafSlotCount(child)
    }

    // A complete circle makes both canvas axes useful. The center of the node's leaf
    // interval keeps related descendants in one sector and reduces cross-branch interference.
    const angle = -Math.PI + ((startSlot + slots / 2) / leafCount) * TAU
    positioned.push({
      item: node,
      depth,
      angle,
      childCount: descendantCount(node),
      branchColor,
    })
  }

  for (const node of tree) {
    place(node, 1, branchColor(node.id), slotCursor)
    slotCursor += leafSlotCount(node)
  }

  const nodesByDepth = new Map<number, PositionedNode[]>()
  for (const node of positioned) {
    const ring = nodesByDepth.get(node.depth) || []
    ring.push(node)
    nodesByDepth.set(node.depth, ring)
  }

  const polarById = new Map<string, { angle: number; radius: number }>()
  const placedPoints: Point[] = []
  const maximumDepth = Math.max(0, ...nodesByDepth.keys())
  for (let depth = 1; depth <= maximumDepth; depth += 1) {
    const ring = (nodesByDepth.get(depth) || []).toSorted((left, right) => left.angle - right.angle)
    for (const node of ring) {
      const parentRadius = node.item.parentId ? (polarById.get(node.item.parentId)?.radius ?? 0) : 0
      const minimumRadius = Math.max(FIRST_RING_RADIUS, parentRadius + RING_GAP)
      let radius = minimumRadius
      let point = { x: Math.cos(node.angle) * radius, y: Math.sin(node.angle) * radius }

      // Dense logical levels spill onto concentric lanes. This fills radial whitespace
      // instead of inflating one enormous ring while retaining each branch's sector.
      while (placedPoints.some((placed) => cardsOverlap(placed, point))) {
        radius += LANE_GAP
        point = { x: Math.cos(node.angle) * radius, y: Math.sin(node.angle) * radius }
      }

      polarById.set(node.item.id, { angle: node.angle, radius })
      placedPoints.push(point)
    }
  }

  const outerRadius = Math.max(0, ...[...polarById.values()].map((position) => position.radius))
  const canvasSize = Math.max(
    1100,
    Math.ceil((outerRadius + Math.hypot(NODE_WIDTH, NODE_HEIGHT) / 2 + CANVAS_PADDING) * 2),
  )
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2
  const center = { x: centerX, y: centerY }

  const nodes: BookmarkCanvasNode[] = [
    {
      id: ROOT_ID,
      item: null,
      parentId: null,
      x: centerX,
      y: centerY,
      depth: 0,
      childCount: positioned.length,
      size: ROOT_WIDTH,
      direction: 0,
      branchColor: '#ef6259',
    },
  ]
  const parentById = new Map<string, string | null>([[ROOT_ID, null]])

  for (const entry of positioned) {
    const position = polarById.get(entry.item.id)!
    const parentId = entry.item.parentId || ROOT_ID
    nodes.push({
      id: entry.item.id,
      item: entry.item,
      parentId,
      x: centerX + Math.cos(position.angle) * position.radius,
      y: centerY + Math.sin(position.angle) * position.radius,
      depth: entry.depth,
      childCount: entry.childCount,
      size: entry.item.kind === 'folder' ? folderSize(entry.childCount) : NODE_WIDTH,
      direction: Math.cos(entry.angle) < 0 ? -1 : 1,
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
    edges.push({
      id: `${parent.id}:${node.id}`,
      parentId: parent.id,
      childId: node.id,
      path: edgePath(parent, node, center),
      branchColor: node.branchColor,
    })
  }

  return {
    width: canvasSize,
    height: canvasSize,
    centerX,
    centerY,
    nodes,
    edges,
    parentById,
  }
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
  const { width: halfWidth, height: halfHeight } = nodeHalfSize(node)
  return (
    node.x + halfWidth >= bounds.left &&
    node.x - halfWidth <= bounds.right &&
    node.y + halfHeight >= bounds.top &&
    node.y - halfHeight <= bounds.bottom
  )
}

export { NODE_HEIGHT, NODE_WIDTH, ROOT_ID }
