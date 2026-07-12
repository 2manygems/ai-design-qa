interface UploadPreviewProps {
  html: string
}

export function UploadPreview({ html }: UploadPreviewProps) {
  return (
    <iframe
      title="html-preview"
      srcDoc={html}
      sandbox=""
      className="h-96 w-full rounded-lg border border-gray-200 bg-white"
    />
  )
}
