/** Sketch MeaXure export의 data 객체 구조 (검사 대상 화면 업로드용) */

export interface MeaXureRect {
  x: number
  y: number
  width: number
  height: number
}

export interface MeaXureLayer {
  objectID: string
  type: 'shape' | 'text' | 'group' | 'symbol' | 'slice'
  name: string
  rect: MeaXureRect
  opacity: number
  css: string[]
  content?: string
}

export interface MeaXureArtboard {
  name: string
  slug: string
  objectID: string
  width: number
  height: number
  imagePath: string | null
  layers: MeaXureLayer[]
}

export interface MeaXureData {
  unit: string
  resolution: number
  artboards: MeaXureArtboard[]
}

/** 화면 아트보드에서 추출한 컴포넌트(심볼) 인스턴스 */
export interface ScreenComponent {
  id: string
  artboardName: string
  artboardImagePath: string | null
  /** 원본 심볼 레이어 이름 (예: "Button / contained-text / secondary-default") */
  symbolName: string
  component: string
  variant: string | null
  state: string | null
  rect: MeaXureRect
  /** 배경 shape + 라벨 text의 css를 합성한 유효 스타일 */
  actualCss: Record<string, string>
}

/** ZIP 업로드에서 파싱된 화면 QA 입력 */
export interface ScreenUpload {
  fileName: string
  data: MeaXureData
  /** imagePath → blob object URL */
  imageUrls: Record<string, string>
}
