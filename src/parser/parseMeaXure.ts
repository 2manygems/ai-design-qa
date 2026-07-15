import type {
  MeaXureData,
  MeaXureLayer,
  MeaXureRect,
  ScreenComponent,
} from '../types/meaxure'
import { createId } from '../utils/format'

/** MeaXure export HTML에서 `let data = {...}` JSON만 추출한다 (뷰어 코드는 실행하지 않음). */
export function parseMeaXureHtml(html: string): MeaXureData {
  const markerIdx = html.indexOf('let data = ')
  if (markerIdx === -1) {
    throw new Error('MeaXure 데이터를 찾을 수 없습니다 (`let data = ` 없음)')
  }
  const jsonStart = html.indexOf('{', markerIdx)
  const lineEnd = html.indexOf('\n', jsonStart)
  let raw = html.slice(jsonStart, lineEnd === -1 ? undefined : lineEnd).trim()
  if (raw.endsWith(';')) raw = raw.slice(0, -1)
  return JSON.parse(raw) as MeaXureData
}

/** 검사 대상이 아닌 메타 아트보드 ([Cover], [Changelog], Color 팔레트 등) */
const META_ARTBOARD = /\[?(cover|changelog)\]?|^color$/i

const stripCopySuffix = (name: string) => name.replace(/\s+copy(\s+\d+)?$/i, '').trim()

const rectsEqual = (a: MeaXureRect, b: MeaXureRect, tol = 2) =>
  Math.abs(a.x - b.x) <= tol &&
  Math.abs(a.y - b.y) <= tol &&
  Math.abs(a.width - b.width) <= tol &&
  Math.abs(a.height - b.height) <= tol

function parseCssArray(cssArr: string[] | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const decl of cssArr ?? []) {
    const m = decl.match(/^([a-z-]+)\s*:\s*(.+?);?$/i)
    if (m) out[m[1].toLowerCase()] = m[2].trim()
  }
  return out
}

function parseSymbolName(name: string) {
  const parts = stripCopySuffix(name).split('/').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) {
    return { component: parts[0], variant: parts[1], state: parts.slice(2).join(' / ') }
  }
  if (parts.length === 2) return { component: parts[0], variant: parts[1], state: null }
  return { component: parts[0] ?? name, variant: null, state: null }
}

/** symbol ... #tmp-<name> 구간의 자식 레이어 수집 (extract-guide와 동일한 구조 규칙) */
function collectSymbolChildren(layers: MeaXureLayer[], symbolIdx: number) {
  const sym = layers[symbolIdx]
  const closerName = `#tmp-${sym.name}`
  const children: MeaXureLayer[] = []
  let i = symbolIdx + 1
  while (i < layers.length) {
    const l = layers[i]
    if (l.type === 'group' && l.name === closerName && rectsEqual(l.rect, sym.rect)) {
      return { children, endIdx: i }
    }
    if (l.type === 'symbol') {
      const nested = collectSymbolChildren(layers, i)
      i = nested.endIdx + 1
      continue
    }
    children.push(l)
    i++
  }
  return { children: [], endIdx: symbolIdx }
}

const rectInside = (r: MeaXureRect, outer: MeaXureRect, tol = 2) =>
  r.x >= outer.x - tol &&
  r.y >= outer.y - tol &&
  r.x + r.width <= outer.x + outer.width + tol &&
  r.y + r.height <= outer.y + outer.height + tol

/**
 * #tmp 닫는 그룹이 없는 export용 폴백: 심볼 뒤에 오면서 심볼 rect 안에
 * 공간적으로 포함되는 레이어를 자식으로 수집한다. 다음 심볼이나 영역 밖
 * 레이어가 나오면 중단. (중첩 심볼은 자체 인스턴스로 따로 추출됨)
 */
function collectByContainment(layers: MeaXureLayer[], symbolIdx: number) {
  const sym = layers[symbolIdx]
  const children: MeaXureLayer[] = []
  let i = symbolIdx + 1
  while (i < layers.length) {
    const l = layers[i]
    if (l.type === 'symbol') break
    if (!rectInside(l.rect, sym.rect)) break
    children.push(l)
    i++
  }
  return { children, endIdx: i - 1 }
}

/** 심볼 인스턴스의 유효 스타일: 컨테이너 크기 배경 shape css + 첫 text css 합성 */
function buildActualCss(sym: MeaXureLayer, children: MeaXureLayer[]): Record<string, string> {
  const css: Record<string, string> = {
    width: `${sym.rect.width}px`,
    height: `${sym.rect.height}px`,
  }
  for (const child of children) {
    if (child.name.startsWith('#tmp-')) continue
    if (
      child.type === 'shape' &&
      rectsEqual(child.rect, sym.rect, 1) &&
      !/hover|pressed|focus|selected|state/i.test(child.name)
    ) {
      Object.assign(css, parseCssArray(child.css))
    }
  }
  // 텍스트 스타일은 첫 번째 text 레이어에서 (라벨)
  const text = children.find((c) => c.type === 'text' && !c.name.startsWith('#tmp-'))
  if (text) {
    const t = parseCssArray(text.css)
    for (const key of ['font-family', 'font-size', 'font-weight', 'line-height', 'color', 'text-align']) {
      if (t[key]) css[key] = t[key]
    }
  }
  return css
}

/** 업로드된 화면 데이터에서 컴포넌트(심볼) 인스턴스를 추출한다. */
export function extractScreenComponents(data: MeaXureData): ScreenComponent[] {
  const out: ScreenComponent[] = []

  for (const ab of data.artboards) {
    if (META_ARTBOARD.test(ab.name.trim())) continue

    const layers = ab.layers
    // export 옵션에 따라 #tmp 닫는 그룹이 있는 형식과 없는 형식이 있다
    const hasTmpClosers = layers.some(
      (l) => l.type === 'group' && l.name.startsWith('#tmp-'),
    )

    for (let i = 0; i < layers.length; i++) {
      const l = layers[i]
      if (l.type !== 'symbol') continue
      if (l.name.startsWith('#tmp-') || /^metric\s*\//i.test(l.name)) continue

      const { children, endIdx } = hasTmpClosers
        ? collectSymbolChildren(layers, i)
        : collectByContainment(layers, i)
      if (hasTmpClosers && endIdx === i) continue // closer를 못 찾은 심볼은 판정 불가

      const { component, variant, state } = parseSymbolName(l.name)
      out.push({
        id: createId('screen-comp'),
        artboardName: ab.name,
        artboardImagePath: ab.imagePath ?? null,
        symbolName: l.name,
        component,
        variant,
        state,
        rect: l.rect,
        actualCss: buildActualCss(l, children),
      })
      i = endIdx
    }
  }
  return out
}
