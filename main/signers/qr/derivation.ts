export type QRDerivationStrategy =
  | 'children-wildcard'
  | 'children-fixed'
  | 'legacy-default'
  | 'index-only-fallback'

export interface QRDerivationCandidate {
  strategy: QRDerivationStrategy
  fullPath: string
  relativePath: string
}

const DEFAULT_QR_ORIGIN_PATH = "m/44'/60'/0'"

function normalizePath(path?: string): string {
  const trimmed = (path || '').trim()
  const withoutM = trimmed.startsWith('m/') ? trimmed.slice(2) : trimmed
  const normalized = withoutM.replace(/^\/+/, '').replace(/\/+$/, '')

  return normalized
}

export function normalizeOriginPath(path?: string): string {
  const normalized = normalizePath(path)

  if (!normalized) {
    return DEFAULT_QR_ORIGIN_PATH
  }

  return `m/${normalized}`
}

export function normalizeChildrenPath(path?: string): string | undefined {
  const normalized = normalizePath(path)
  return normalized || undefined
}

function createCandidate(
  strategy: QRDerivationStrategy,
  originPath: string,
  relativePath: string
): QRDerivationCandidate {
  const normalizedRelative = normalizePath(relativePath)
  return {
    strategy,
    relativePath: normalizedRelative,
    fullPath: normalizedRelative ? `${originPath}/${normalizedRelative}` : originPath
  }
}

function addUniqueCandidate(
  candidates: QRDerivationCandidate[],
  strategy: QRDerivationStrategy,
  originPath: string,
  relativePath: string
) {
  const candidate = createCandidate(strategy, originPath, relativePath)
  if (!candidate.relativePath) return

  const alreadyExists = candidates.some((existing) => existing.fullPath === candidate.fullPath)
  if (!alreadyExists) {
    candidates.push(candidate)
  }
}

function hasWildcard(childrenPath: string): boolean {
  return childrenPath.split('/').some((component) => component === '*')
}

function materializeWildcardPath(childrenPath: string, index: number): string {
  const indexString = String(index)
  return childrenPath
    .split('/')
    .map((component) => (component === '*' ? indexString : component))
    .join('/')
}

export function buildDerivationCandidates(
  originPath: string | undefined,
  childrenPath: string | undefined,
  index: number
): QRDerivationCandidate[] {
  const safeIndex = Math.max(0, Number.isFinite(index) ? Math.floor(index) : 0)
  const normalizedOriginPath = normalizeOriginPath(originPath)
  const normalizedChildrenPath = normalizeChildrenPath(childrenPath)
  const candidates: QRDerivationCandidate[] = []

  if (normalizedChildrenPath) {
    if (hasWildcard(normalizedChildrenPath)) {
      addUniqueCandidate(
        candidates,
        'children-wildcard',
        normalizedOriginPath,
        materializeWildcardPath(normalizedChildrenPath, safeIndex)
      )
    } else {
      addUniqueCandidate(
        candidates,
        'children-fixed',
        normalizedOriginPath,
        `${normalizedChildrenPath}/${safeIndex}`
      )
    }
  }

  addUniqueCandidate(candidates, 'legacy-default', normalizedOriginPath, `0/${safeIndex}`)
  addUniqueCandidate(candidates, 'index-only-fallback', normalizedOriginPath, `${safeIndex}`)

  return candidates
}
