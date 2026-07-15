import { useCallback } from 'react'
import JSZip from 'jszip'
import { useAnalysisStore } from '../services/store/analysisStore'
import { parseMeaXureHtml } from '../parser/parseMeaXure'
import type { ScreenUpload } from '../types/meaxure'

/** ZIP(MeaXure export)에서 index.html과 preview 이미지를 꺼내 ScreenUpload를 만든다. */
async function readMeaXureZip(file: File): Promise<ScreenUpload> {
  const zip = await JSZip.loadAsync(file)

  // 가장 얕은 경로의 index.html 선택 (ZIP 루트에 폴더 한 겹이 있을 수 있음)
  const indexEntry = Object.values(zip.files)
    .filter((f) => !f.dir && /(^|\/)index\.html$/i.test(f.name))
    .sort((a, b) => a.name.split('/').length - b.name.split('/').length)[0]
  if (!indexEntry) throw new Error('ZIP 안에서 index.html을 찾을 수 없습니다')

  const html = await indexEntry.async('text')
  const data = parseMeaXureHtml(html)

  const baseDir = indexEntry.name.replace(/index\.html$/i, '')
  const imageUrls: Record<string, string> = {}
  await Promise.all(
    Object.values(zip.files)
      .filter((f) => !f.dir && f.name.startsWith(`${baseDir}preview/`) && /\.png$/i.test(f.name))
      .map(async (f) => {
        const blob = await f.async('blob')
        // data의 imagePath("preview/xxx.png") 기준 상대 경로를 키로 사용
        imageUrls[f.name.slice(baseDir.length)] = URL.createObjectURL(
          new Blob([blob], { type: 'image/png' }),
        )
      }),
  )

  return { fileName: file.name, data, imageUrls }
}

export function useHtmlUpload() {
  const setUploadedHtml = useAnalysisStore((state) => state.setUploadedHtml)
  const setScreenUpload = useAnalysisStore((state) => state.setScreenUpload)
  const setError = useAnalysisStore((state) => state.setError)

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        if (/\.zip$/i.test(file.name)) {
          setScreenUpload(await readMeaXureZip(file))
          return
        }
        const html = await file.text()
        // 단일 HTML이라도 MeaXure export면 화면 QA 경로로 (이미지 없이)
        if (html.includes('let data = ')) {
          setScreenUpload({
            fileName: file.name,
            data: parseMeaXureHtml(html),
            imageUrls: {},
          })
          return
        }
        setUploadedHtml(html)
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일을 읽을 수 없습니다')
      }
    },
    [setUploadedHtml, setScreenUpload, setError],
  )

  return { uploadFile }
}
