/** CSS 값 정규화 헬퍼 — 비교 전 반드시 정규화하고, 비교 시 반올림하지 않는다. */

export interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

/** #rgb / #rrggbb / #rrggbbaa / rgb() / rgba() / transparent → RGBA. 실패 시 null */
export function parseColor(value: string): RgbaColor | null {
  const v = value.trim().toLowerCase()
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/)
  if (hex) {
    const h = hex[1]
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
        a: 1,
      }
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    }
  }

  const fn = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (fn) {
    return {
      r: Number(fn[1]),
      g: Number(fn[2]),
      b: Number(fn[3]),
      a: fn[4] === undefined ? 1 : Number(fn[4]),
    }
  }
  return null
}

export function formatRgba(c: RgbaColor): string {
  return `rgba(${c.r},${c.g},${c.b},${c.a})`
}

/** 두 색상이 같은지. 파싱 불가한 값이 있으면 null (판정 불가) */
export function colorsEqual(a: string, b: string): boolean | null {
  const ca = parseColor(a)
  const cb = parseColor(b)
  if (!ca || !cb) return null
  return ca.r === cb.r && ca.g === cb.g && ca.b === cb.b && ca.a === cb.a
}

/** '13px' | '13' → 13. 실패 시 null */
export function pxNumber(value: string): number | null {
  const m = value.trim().match(/^(-?[\d.]+)(px)?$/)
  return m ? Number(m[1]) : null
}

/** 'bold' | '700' | 'normal' → 숫자 굵기 */
export function normalizeFontWeight(value: string | number): number | null {
  if (typeof value === 'number') return value
  const v = value.trim().toLowerCase()
  if (v === 'normal') return 400
  if (v === 'bold') return 700
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** "'SamsungOne-700', sans-serif" → 'samsungone-700' (첫 패밀리, 따옴표 제거, 소문자) */
export function primaryFontFamily(value: string): string {
  return value.split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase()
}

export interface BorderShorthand {
  width: string | null
  style: string | null
  color: string | null
}

const BORDER_STYLES = new Set([
  'none',
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
  'hidden',
])

/** '1px solid #8A8A8A' → { width, style, color } */
export function parseBorderShorthand(value: string): BorderShorthand {
  const out: BorderShorthand = { width: null, style: null, color: null }
  for (const token of value.trim().split(/\s+/)) {
    if (BORDER_STYLES.has(token.toLowerCase())) out.style = token.toLowerCase()
    else if (/^-?[\d.]+(px|em|rem|%)?$/.test(token)) out.width = token
    else out.color = token
  }
  return out
}

/** '4px 4px 4px 4px' → '4px' (모든 값이 같을 때만 축약) */
export function normalizeRadius(value: string): string {
  const parts = value.trim().split(/\s+/)
  if (parts.length > 1 && parts.every((p) => p === parts[0])) return parts[0]
  return value.trim()
}
