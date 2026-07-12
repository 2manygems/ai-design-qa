import { useCallback, useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '../utils/clipboard'

const RESET_DELAY_MS = 1500

export function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const copy = useCallback(async (text: string, key: string) => {
    const succeeded = await copyToClipboard(text)
    if (!succeeded) return false

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCopiedKey(key)
    timeoutRef.current = setTimeout(() => setCopiedKey(null), RESET_DELAY_MS)
    return true
  }, [])

  return { copiedKey, copy }
}
