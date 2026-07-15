interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 아트보드 preview 이미지에서 위반 영역 주변을 잘라내고
 * 해당 rect에 빨간 강조 박스를 그린 PNG data URL을 만든다.
 */
export function captureRegion(
  imageUrl: string,
  rect: Rect,
  padding = 48,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // 이미지가 아트보드보다 고해상도(@2x)로 export될 수 있으므로 비율 보정은
      // 아트보드 좌표 기준으로 계산한다 (MeaXure preview는 1x가 기본).
      const sx = Math.max(0, rect.x - padding)
      const sy = Math.max(0, rect.y - padding)
      const sw = Math.min(img.naturalWidth - sx, rect.width + padding * 2)
      const sh = Math.min(img.naturalHeight - sy, rect.height + padding * 2)

      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas 2d context unavailable'))
        return
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)

      // 위반 요소 강조 박스
      ctx.strokeStyle = '#EF4444'
      ctx.lineWidth = 3
      ctx.strokeRect(rect.x - sx, rect.y - sy, rect.width, rect.height)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('preview 이미지를 불러올 수 없습니다'))
    img.src = imageUrl
  })
}
