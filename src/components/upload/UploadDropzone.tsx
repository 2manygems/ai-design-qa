import { useCallback, useRef, useState } from 'react'
import { useHtmlUpload } from '../../hooks/useHtmlUpload'

export function UploadDropzone() {
  const { uploadFile } = useHtmlUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) void uploadFile(file)
    },
    [uploadFile],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <p className="text-sm text-gray-600">
        Sketch HTML 또는 MeaXure export ZIP을 드래그하거나 클릭해서 업로드하세요
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".html,.zip"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
