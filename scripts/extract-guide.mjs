/**
 * extract-guide.mjs
 *
 * Sketch MeaXure export(index.html)에서 `let data = {...}` JSON만 추출해
 * 디자인 QA용 정규화 규칙 데이터베이스(design-rules/)를 생성한다.
 *
 * 원칙:
 * - MeaXure 뷰어/jQuery 코드는 분석하지 않는다 (data 객체만 JSON.parse).
 * - 심볼(symbol) 레이어만 컴포넌트의 canonical 정의로 사용한다.
 * - 컴포넌트의 canonical 정의는 "홈 아트보드"(이름이 일치하는 Components_ 아트보드)
 *   안의 심볼에서만 가져온다. 다른 아트보드의 등장은 사용 예시로만 집계한다.
 * - #tmp-, Metric, Guide, Example, Lorem ipsum, changelog 등은 기준에서 제외한다.
 * - 값을 추정하지 않는다. 소스에 없는 값은 null.
 * - 동일 이름+동일 속성 심볼은 중복 제거, 속성이 다르면 conflicts.json에 기록한다.
 *
 * 실행: npm run extract-guide [-- <index.html 경로>]
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const PARSER_VERSION = '1.2.0'

const DEFAULT_SOURCE = String.raw`C:\Users\82108\Desktop\Networks UX 3.9 Guidelines_HTML_20260227\Networks UX 3.9 Guidelines_HTML_20260227\Networks UX 3.9 Guidelines_20260227\index.html`
const sourceFile = process.argv[2] ?? DEFAULT_SOURCE
const OUT_DIR = resolve(import.meta.dirname, '..', 'design-rules')

// ---------- 1. data 객체만 안전하게 추출 ----------
function extractData(htmlPath) {
  const html = readFileSync(htmlPath, 'utf-8')
  const markerIdx = html.indexOf('let data = ')
  if (markerIdx === -1) throw new Error('`let data = ` 선언을 찾을 수 없습니다.')
  const jsonStart = html.indexOf('{', markerIdx)
  const lineEnd = html.indexOf('\n', jsonStart)
  let raw = html.slice(jsonStart, lineEnd === -1 ? undefined : lineEnd).trim()
  if (raw.endsWith(';')) raw = raw.slice(0, -1)
  return JSON.parse(raw) // JSON.parse만 사용 — 스크립트 실행 없음
}

// ---------- 제외 규칙 ----------
const EXCLUDE_NAME_PATTERNS = [
  /^#tmp-/i,
  /\bguide\b/i,
  /\bexample\b/i,
  /lorem ipsum/i,
  /\bannotation\b/i,
  /^background$/i,
  /^bg$/i,
  /^line(\s|$)/i,
  /^divider(\s|$)/i,
  /^metric\s*\//i,
  /changelog/i,
]

/** " Copy"/" copy 3" 접미사를 제거한 정규화 이름 */
const stripCopySuffix = (name) => name.replace(/\s+copy(\s+\d+)?$/i, '').trim()

const isExcludedName = (name) => {
  const norm = stripCopySuffix(name)
  return EXCLUDE_NAME_PATTERNS.some((re) => re.test(norm))
}

/** 컴포넌트 이름으로 부적합: 알파벳 2자 미만이거나 "Button 2"류의 번호 붙은 일반명 */
const isGenericComponentName = (name) =>
  (name.match(/[a-z]/gi) ?? []).length < 2 || /^(.+\s)?\d+$/.test(name.trim())

// ---------- css 문자열 배열 → 객체 ----------
function parseCss(cssArr) {
  const out = {}
  for (const decl of cssArr ?? []) {
    const m = decl.match(/^([a-z-]+)\s*:\s*(.+?);?$/i)
    if (m) out[m[1].toLowerCase()] = m[2].trim()
  }
  return out
}

const rectsEqual = (a, b, tol = 1) =>
  Math.abs(a.x - b.x) <= tol &&
  Math.abs(a.y - b.y) <= tol &&
  Math.abs(a.width - b.width) <= tol &&
  Math.abs(a.height - b.height) <= tol

// ---------- 심볼의 자식 레이어 수집 (symbol ... #tmp-<name> 구간) ----------
function collectSymbolChildren(layers, symbolIdx) {
  const sym = layers[symbolIdx]
  const closerName = `#tmp-${sym.name}`
  const children = []
  const nestedSymbols = []
  let i = symbolIdx + 1
  while (i < layers.length) {
    const l = layers[i]
    if (l.type === 'group' && l.name === closerName && rectsEqual(l.rect, sym.rect, 2)) {
      return { children, nestedSymbols, endIdx: i }
    }
    if (l.type === 'symbol') {
      // 중첩 심볼: 참조만 기록하고 그 자식 구간은 건너뛴다
      const nested = collectSymbolChildren(layers, i)
      nestedSymbols.push(l.name)
      i = nested.endIdx + 1
      continue
    }
    children.push(l)
    i++
  }
  // 닫는 #tmp 그룹을 찾지 못함 → 자식 판정 불가
  return { children: [], nestedSymbols, endIdx: symbolIdx }
}

// ---------- 심볼 이름 → component / variant / state ----------
function parseSymbolName(name) {
  const parts = stripCopySuffix(name).split('/').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) return { component: parts[0], variant: parts[1], state: parts.slice(2).join(' / ') }
  if (parts.length === 2) return { component: parts[0], variant: parts[1], state: null }
  return { component: parts[0] ?? name, variant: null, state: null }
}

// ---------- 홈 아트보드 매칭 ----------
/** 단어 정규화: 소문자 + 복수형 s 제거(ss/us 제외) */
function normWords(s) {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('s') && !/(ss|us)$/.test(w) ? w.slice(0, -1) : w))
}

/** 두 단어가 같은 의미로 간주되는지: 완전 일치 또는 4자 이상 어간 공유 (filter/filtering) */
const wordsEqual = (a, b) =>
  a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)))

/**
 * 컴포넌트가 아트보드에 속하는지 점수 계산.
 * 3: 완전 일치 (붙여쓰기 차이 무시: "Check Box" == "Checkbox"),
 * 2: 컴포넌트 단어 ⊇ 아트보드 단어 (Text button ⊇ Button),
 * 1: 아트보드 단어 ⊇ 컴포넌트 단어 (Text input ⊇ Input), 0: 불일치
 */
function homeScore(componentName, artboardBase) {
  const c = normWords(componentName)
  const a = normWords(artboardBase)
  if (!c.length || !a.length) return 0
  if (c.join(' ') === a.join(' ') || c.join('') === a.join('')) return 3
  if (a.every((aw) => c.some((cw) => wordsEqual(aw, cw)))) return 2
  if (c.every((cw) => a.some((aw) => wordsEqual(cw, aw)))) return 1
  return 0
}

// ---------- 심볼 1개 → state 스펙 추출 ----------
function extractStateSpec(sym, children, nestedSymbols, artboardName) {
  const spec = {
    geometry: { width: sym.rect.width, height: sym.rect.height, minWidth: null, maxWidth: null },
    spacing: null,
    border: null,
    background: null,
    typography: null,
    icon: null,
    content: null,
    behavior: null, // 정적 데이터로는 검증 불가
    responsive: null,
    stateOverlays: null,
    nestedComponents: nestedSymbols.length ? nestedSymbols.map(stripCopySuffix) : null,
    source: [{ artboard: artboardName, layerName: sym.name, objectID: sym.objectID }],
    confidence: 'high',
  }

  const texts = []
  const icons = []
  const overlays = []

  for (const child of children) {
    if (/^#tmp-/.test(child.name)) continue
    const css = parseCss(child.css)

    if (child.type === 'shape' && rectsEqual(child.rect, sym.rect, 1)) {
      // 컨테이너 크기의 shape = 배경 or 상태 오버레이
      if (/hover|pressed|focus|selected|state/i.test(child.name)) {
        overlays.push({ name: child.name, css, opacity: child.opacity ?? null })
        continue
      }
      spec.background = {
        color: css['background'] ?? null,
        opacity: css['opacity'] ? Number(css['opacity']) : child.opacity !== 1 ? child.opacity : null,
        boxShadow: css['box-shadow'] ?? null,
        sourceLayer: child.name,
      }
      spec.border = {
        border: css['border'] ?? null,
        borderRadius: css['border-radius'] ?? null,
        sourceLayer: child.name,
      }
      continue
    }

    if (child.type === 'text') {
      texts.push({
        role: child.name,
        content: child.content ?? null,
        fontFamily: css['font-family'] ?? null,
        fontSize: css['font-size'] ?? null,
        fontWeight: css['font-weight'] ? Number(css['font-weight']) : null,
        lineHeight: css['line-height'] ?? null,
        color: css['color'] ?? null,
        textAlign: css['text-align'] ?? null,
        // 텍스트 rect에서 파생한 내부 여백 (실측값 — 문서화된 토큰 아님)
        derivedPadding: {
          left: round1(child.rect.x - sym.rect.x),
          right: round1(sym.rect.x + sym.rect.width - (child.rect.x + child.rect.width)),
          top: round1(child.rect.y - sym.rect.y),
          bottom: round1(sym.rect.y + sym.rect.height - (child.rect.y + child.rect.height)),
        },
      })
      continue
    }

    if (child.type === 'slice' || /icon/i.test(child.name)) {
      icons.push({
        name: child.name,
        width: child.rect.width,
        height: child.rect.height,
        derivedInset: {
          left: round1(child.rect.x - sym.rect.x),
          top: round1(child.rect.y - sym.rect.y),
        },
      })
    }
  }

  if (texts.length) {
    spec.typography = texts
    spec.content = texts.map((t) => t.content).filter(Boolean)
    if (!spec.content.length) spec.content = null
    spec.spacing = {
      derived: true,
      note: '텍스트 rect와 심볼 rect의 차이에서 계산된 실측값 (문서화된 토큰 아님)',
      textPadding: texts[0].derivedPadding,
    }
  }
  if (icons.length) spec.icon = icons
  if (overlays.length) spec.stateOverlays = overlays

  return spec
}

const round1 = (n) => Math.round(n * 10) / 10

// ---------- 비교용 핵심 직렬화 ----------
/**
 * 콘텐츠(라벨 길이)에 따라 달라지는 필드를 제외한 스타일 핵심만 비교한다.
 * 제외: source, content, geometry.width, 파생 여백, 아이콘 위치, 텍스트 내용.
 * 이 핵심이 같으면 같은 정의(중복), 다르면 진짜 스타일 충돌.
 */
function coreFingerprint(spec) {
  const core = {
    height: spec.geometry?.height ?? null,
    background: spec.background
      ? { color: spec.background.color, opacity: spec.background.opacity, boxShadow: spec.background.boxShadow }
      : null,
    border: spec.border ? { border: spec.border.border, borderRadius: spec.border.borderRadius } : null,
    typography:
      spec.typography?.map((t) => ({
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.fontWeight,
        lineHeight: t.lineHeight,
        color: t.color,
        textAlign: t.textAlign,
      })) ?? null,
    icon: spec.icon?.map((i) => ({ width: i.width, height: i.height })) ?? null,
    stateOverlays: spec.stateOverlays?.map((o) => ({ name: o.name, css: o.css })) ?? null,
  }
  return JSON.stringify(core)
}

/** 두 spec의 핵심 필드 차이 경로 목록 */
function diffFields(a, b) {
  const pa = JSON.parse(coreFingerprint(a))
  const pb = JSON.parse(coreFingerprint(b))
  const out = []
  const walk = (x, y, path) => {
    if (JSON.stringify(x) === JSON.stringify(y)) return
    if (x === null || y === null || typeof x !== 'object' || typeof y !== 'object') {
      out.push({ field: path, a: x, b: y })
      return
    }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      walk(x[k], y[k], path ? `${path}.${k}` : k)
    }
  }
  walk(pa, pb, '')
  return out
}

/** 같은 정의의 다른 인스턴스 병합: 출처 누적 + 관측된 width 수집 */
function mergeInstance(entry, spec) {
  entry.spec.source.push(...spec.source)
  const w = spec.geometry?.width
  if (w != null && !entry.observedWidths.includes(w)) entry.observedWidths.push(w)
}

// ---------- Foundation 아트보드 추출 ----------
function extractFoundation(ab) {
  const statements = new Map()
  const valueLabels = new Map()
  const colorUsage = new Map()
  const typoStyles = new Map()
  const radiusValues = new Map()

  for (const l of ab.layers) {
    if (isExcludedName(l.name) && !/^#tmp-/.test(l.name)) continue
    const css = parseCss(l.css)

    if (l.type === 'text' && l.content) {
      const content = l.content.trim()
      if (content.length >= 25 || /[.!?]\s/.test(content)) {
        if (!statements.has(content)) {
          statements.set(content, {
            content,
            source: { artboard: ab.name, layerName: l.name, objectID: l.objectID },
          })
        }
      } else if (/^\d+(\.\d+)?(px)?$/.test(content)) {
        valueLabels.set(content, (valueLabels.get(content) ?? 0) + 1)
      }
      if (css['font-family'] && css['font-size']) {
        const combo = JSON.stringify({
          fontFamily: css['font-family'],
          fontSize: css['font-size'],
          fontWeight: css['font-weight'] ?? null,
          lineHeight: css['line-height'] ?? null,
        })
        const cur = typoStyles.get(combo) ?? { style: JSON.parse(combo), count: 0 }
        cur.count++
        typoStyles.set(combo, cur)
      }
    }

    for (const fill of l.fills ?? []) {
      const hex = fill?.color?.['color-hex']
      if (hex) colorUsage.set(hex, (colorUsage.get(hex) ?? 0) + 1)
    }
    if (css['border-radius']) {
      radiusValues.set(css['border-radius'], (radiusValues.get(css['border-radius']) ?? 0) + 1)
    }
  }

  return {
    artboard: ab.name,
    statements: [...statements.values()],
    valueLabels: Object.fromEntries([...valueLabels.entries()].sort((a, b) => b[1] - a[1])),
    colorUsage: Object.fromEntries(
      [...colorUsage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40),
    ),
    typographyStyles: [...typoStyles.values()].sort((a, b) => b.count - a.count).slice(0, 30),
    borderRadiusUsage: Object.fromEntries([...radiusValues.entries()].sort((a, b) => b[1] - a[1])),
  }
}

// ---------- Pattern 아트보드 추출 ----------
function extractPattern(ab) {
  const statements = []
  const seen = new Set()
  const symbolInventory = new Map()

  for (const l of ab.layers) {
    if (l.type === 'text' && l.content) {
      const content = l.content.trim()
      if ((content.length >= 25 || /[.!?]\s/.test(content)) && !seen.has(content) && !isExcludedName(l.name)) {
        seen.add(content)
        statements.push({
          content,
          source: { artboard: ab.name, layerName: l.name, objectID: l.objectID },
        })
      }
    }
    if (l.type === 'symbol' && !isExcludedName(l.name)) {
      const norm = stripCopySuffix(l.name)
      symbolInventory.set(norm, (symbolInventory.get(norm) ?? 0) + 1)
    }
  }

  return {
    artboard: ab.name,
    statements,
    usedComponents: Object.fromEntries([...symbolInventory.entries()].sort((a, b) => b[1] - a[1])),
  }
}

// ---------- 파일명 변환 ----------
const toFileName = (s) =>
  s
    .replace(/^(Components_|Pattern_|Foundation_)/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ================= 메인 =================
console.log(`[1/6] 소스 파싱: ${sourceFile}`)
const data = extractData(sourceFile)
console.log(`      unit=${data.unit}, artboards=${data.artboards.length}`)

// 1. 아트보드 분류
const classification = { meta: [], foundation: [], component: [], pattern: [], other: [] }
for (const ab of data.artboards) {
  const name = (ab.name ?? '').trim()
  if (name.startsWith('Foundation_')) classification.foundation.push(ab)
  else if (name.startsWith('Components_')) classification.component.push(ab)
  else if (name.startsWith('Pattern_')) classification.pattern.push(ab)
  else if (/^0_|^Changelog/i.test(name)) classification.meta.push(ab)
  else classification.other.push(ab)
}
console.log(
  `[2/6] 분류: foundation=${classification.foundation.length}, component=${classification.component.length}, pattern=${classification.pattern.length}, meta=${classification.meta.length}, other=${classification.other.length}`,
)

// 출력 디렉터리 초기화
if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true })
mkdirSync(join(OUT_DIR, 'components'), { recursive: true })
mkdirSync(join(OUT_DIR, 'patterns'), { recursive: true })

// 2. Foundation 추출
console.log('[3/6] Foundation 추출...')
const foundations = classification.foundation.map(extractFoundation)
writeFileSync(join(OUT_DIR, 'foundations.json'), JSON.stringify({ foundations }, null, 2))

// 3. Components — Pass A: 전체 심볼 등장 수집
console.log('[4/6] Components 심볼 수집...')
const occurrences = [] // {artboard, component, variant, state, spec, fp, isCopy}
const manualReview = []

for (const ab of classification.component) {
  const layers = ab.layers
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i]
    if (l.type !== 'symbol') continue
    if (isExcludedName(l.name)) continue

    const { component, variant, state } = parseSymbolName(l.name)
    if (isGenericComponentName(component)) continue // "Button 2", "&#10033" 등 예시성 이름

    const { children, nestedSymbols, endIdx } = collectSymbolChildren(layers, i)
    if (endIdx === i) {
      manualReview.push({
        artboard: ab.name,
        layerName: l.name,
        objectID: l.objectID,
        reason: '#tmp 닫는 그룹을 찾지 못해 자식 레이어를 판정할 수 없음',
      })
      continue
    }

    occurrences.push({
      artboard: ab.name,
      artboardBase: ab.name.replace(/^Components_/, '').trim(),
      component,
      variant: variant ?? '(unspecified)',
      state: state ?? '(unspecified)',
      isCopy: /\s+copy(\s+\d+)?$/i.test(l.name),
      spec: extractStateSpec(l, children, nestedSymbols, ab.name),
    })
    i = endIdx
  }
}

// Pass B: 컴포넌트별 홈 아트보드 결정
console.log('[5/6] 홈 아트보드 매칭 및 중복/충돌 정리...')
const artboardBases = classification.component.map((ab) => ({
  ab,
  base: ab.name.replace(/^Components_/, '').trim(),
}))

const componentHome = new Map() // component -> artboard name | null
for (const comp of new Set(occurrences.map((o) => o.component))) {
  let best = null
  let bestScore = 0
  for (const { ab, base } of artboardBases) {
    const s = homeScore(comp, base)
    if (s > bestScore) {
      bestScore = s
      best = ab.name
    }
  }
  componentHome.set(comp, bestScore > 0 ? best : null)
}

// 컴포넌트별 등장 그룹핑
const byComponent = new Map() // component -> occ[]
for (const occ of occurrences) {
  if (!byComponent.has(occ.component)) byComponent.set(occ.component, [])
  byComponent.get(occ.component).push(occ)
}

const conflicts = []
let dedupeCount = 0
const byArtboard = new Map() // 홈 artboardName -> Map(component -> Map(variant -> Map(state -> entry)))
const crossRefsOut = []

for (const [component, occs] of byComponent) {
  const home = componentHome.get(component)

  // 홈이 없는 심볼: 참조 인벤토리로만 집계 (canonical 강제 배정 안 함)
  if (home === null) {
    const counts = {}
    for (const o of occs) counts[o.artboard] = (counts[o.artboard] ?? 0) + 1
    crossRefsOut.push({ component, homeArtboard: null, exampleOccurrences: counts })
    manualReview.push({
      component,
      reason: '이름이 일치하는 Components_ 아트보드가 없어 canonical 소속을 결정할 수 없음',
      occurrences: counts,
    })
    continue
  }

  let canonicalOccs = occs.filter((o) => o.artboard === home)
  let fallback = false
  if (canonicalOccs.length === 0) {
    // 홈 아트보드에 심볼이 없음 → 다른 아트보드의 반복 등장을 근거로 채택 (hierarchy 4)
    canonicalOccs = occs
    fallback = true
  }

  // 홈 밖 등장은 사용 예시로 집계
  const exampleCounts = {}
  for (const o of occs) {
    if (!fallback && o.artboard === home) continue
    exampleCounts[o.artboard] = (exampleCounts[o.artboard] ?? 0) + 1
  }
  if (Object.keys(exampleCounts).length && !fallback) {
    crossRefsOut.push({ component, homeArtboard: home, exampleOccurrences: exampleCounts })
  }

  if (!byArtboard.has(home)) byArtboard.set(home, new Map())
  const cMap = byArtboard.get(home)
  if (!cMap.has(component)) cMap.set(component, new Map())
  const vMap = cMap.get(component)

  for (const occ of canonicalOccs) {
    if (fallback) {
      occ.spec.confidence = 'medium'
      occ.spec.note = '홈 아트보드에 심볼 정의가 없어 다른 아트보드의 반복 사용례에서 추출됨'
    }
    if (!vMap.has(occ.variant)) vMap.set(occ.variant, new Map())
    const sMap = vMap.get(occ.variant)
    const fp = coreFingerprint(occ.spec)

    // 상태별로 fingerprint 그룹을 누적 (다수결은 나중에)
    if (!sMap.has(occ.state)) sMap.set(occ.state, new Map())
    const fpGroups = sMap.get(occ.state)
    if (!fpGroups.has(fp)) {
      fpGroups.set(fp, {
        spec: occ.spec,
        count: 1,
        fromCopy: occ.isCopy,
        observedWidths: occ.spec.geometry?.width != null ? [occ.spec.geometry.width] : [],
      })
    } else {
      const g = fpGroups.get(fp)
      g.count++
      dedupeCount++
      if (!occ.isCopy) g.fromCopy = false
      mergeInstance(g, occ.spec)
    }
  }
}

/**
 * fingerprint 그룹들 중 canonical 선택: 등장 횟수 다수결(계층 4),
 * 동률이면 Copy 아닌 쪽 우선. 나머지 그룹은 충돌 1건으로 집계.
 */
function resolveGroups(component, variant, state, fpGroups) {
  const groups = [...fpGroups.values()].sort(
    (a, b) => b.count - a.count || Number(a.fromCopy) - Number(b.fromCopy),
  )
  const winner = groups[0]
  if (groups.length > 1) {
    winner.spec.confidence = winner.spec.confidence === 'high' ? 'medium' : 'low'
    conflicts.push({
      component,
      variant,
      state,
      resolvedBy: `다수결 (${winner.count}/${groups.reduce((n, g) => n + g.count, 0)} 인스턴스)`,
      canonical: { source: winner.spec.source[0], instanceCount: winner.count },
      alternatives: groups.slice(1).map((g) => ({
        instanceCount: g.count,
        source: g.spec.source[0],
        fromCopy: g.fromCopy,
        differingFields: diffFields(winner.spec, g.spec),
      })),
      note: '동일 이름에 서로 다른 스타일 핵심값이 존재. 다수 그룹을 채택했으며 수동 검토 필요.',
    })
  }
  return winner
}

// 파일 쓰기
let totalVariants = 0
let totalStates = 0
const componentSummaries = []

for (const [artboardName, cMap] of byArtboard) {
  const componentsInFile = []
  for (const [component, vMap] of cMap) {
    const variants = []
    for (const [variantName, sMap] of vMap) {
      const states = []
      for (const [stateName, fpGroups] of sMap) {
        const entry = resolveGroups(component, variantName, stateName, fpGroups)
        const spec = entry.spec
        // width가 인스턴스마다 다르면 콘텐츠 의존 값 → 단일 규칙으로 쓰지 않음
        if (entry.observedWidths.length > 1) {
          spec.geometry.width = null
          spec.geometry.observedWidths = entry.observedWidths.sort((a, b) => a - b)
          spec.geometry.widthNote = '인스턴스마다 다름 (콘텐츠 의존) — 고정 규칙 아님'
        }
        states.push({ name: stateName, ...spec })
        totalStates++
      }
      variants.push({ name: variantName, states })
      totalVariants++
    }
    componentsInFile.push({ component, description: null, variants })
  }
  const fileName = `${toFileName(artboardName)}.json`
  writeFileSync(
    join(OUT_DIR, 'components', fileName),
    JSON.stringify({ sourceArtboard: artboardName, components: componentsInFile }, null, 2),
  )
  componentSummaries.push({
    artboard: artboardName,
    file: `components/${fileName}`,
    componentNames: [...cMap.keys()],
    variantCount: [...cMap.values()].reduce((n, v) => n + v.size, 0),
    stateCount: [...cMap.values()].reduce(
      (n, v) => n + [...v.values()].reduce((m, s) => m + s.size, 0),
      0,
    ),
  })
}

// 심볼 정의가 하나도 없는 Components_ 아트보드는 수동 검토 대상
for (const { ab } of artboardBases) {
  if (!byArtboard.has(ab.name)) {
    manualReview.push({
      artboard: ab.name,
      reason: 'canonical 심볼 정의를 찾지 못함 — 그룹/셰이프 기반 정의일 가능성. 수동 추출 필요.',
    })
  }
}
writeFileSync(
  join(OUT_DIR, 'components', '_cross-references.json'),
  JSON.stringify(
    {
      note: '홈 아트보드 밖에서 등장한 심볼 인벤토리. canonical 규칙 아님 — 사용 예시 집계.',
      crossReferences: crossRefsOut,
    },
    null,
    2,
  ),
)

// 4. Patterns 추출
console.log('[6/6] Patterns 추출...')
const patternSummaries = []
for (const ab of classification.pattern) {
  const p = extractPattern(ab)
  const fileName = `${toFileName(ab.name)}.json`
  writeFileSync(join(OUT_DIR, 'patterns', fileName), JSON.stringify(p, null, 2))
  patternSummaries.push({ artboard: ab.name, file: `patterns/${fileName}`, statements: p.statements.length })
}

// 5. conflicts / manifest
writeFileSync(join(OUT_DIR, 'conflicts.json'), JSON.stringify({ conflicts, manualReview }, null, 2))

const manifest = {
  sourceFile: 'index.html',
  sourcePath: sourceFile,
  unit: data.unit,
  colorFormat: data.colorFormat,
  artboardCount: data.artboards.length,
  componentCount: componentSummaries.reduce((n, c) => n + c.componentNames.length, 0),
  variantCount: totalVariants,
  stateCount: totalStates,
  dedupeCount,
  conflictCount: conflicts.length,
  manualReviewCount: manualReview.length,
  generatedAt: new Date().toISOString(),
  parserVersion: PARSER_VERSION,
  classification: {
    foundation: classification.foundation.map((a) => a.name),
    component: classification.component.map((a) => a.name),
    pattern: classification.pattern.map((a) => a.name),
    meta: classification.meta.map((a) => a.name),
    other: classification.other.map((a) => a.name),
  },
  componentSummaries,
  patternSummaries,
  extractionPolicy: {
    canonicalSource: 'symbol 타입 레이어 + 홈 아트보드 일치 시에만 canonical',
    excludedPatterns: EXCLUDE_NAME_PATTERNS.map(String),
    positionValuesExcluded: true,
    derivedValuesMarked: 'spacing.derived=true / derivedPadding / derivedInset 으로 표시',
    inventedValues: 'none — 소스에 없는 값은 null',
  },
}
writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

// 리포트
console.log('\n===== 추출 완료 =====')
console.log(`Foundation: ${foundations.length}개`)
console.log(`컴포넌트 파일: ${componentSummaries.length}개 / 컴포넌트 ${manifest.componentCount}개`)
console.log(`variant: ${totalVariants}, state: ${totalStates}`)
console.log(`중복 제거: ${dedupeCount}건`)
console.log(`충돌: ${conflicts.length}건`)
console.log(`참조 전용(홈 없음) 심볼: ${crossRefsOut.filter((c) => !c.homeArtboard).length}건`)
console.log(`수동 검토 필요: ${manualReview.length}건`)
console.log(`출력: ${OUT_DIR}`)
