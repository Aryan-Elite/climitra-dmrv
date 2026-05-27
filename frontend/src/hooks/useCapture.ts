'use client'
import { useState, useEffect, useRef } from 'react'
import { getCapture } from '@/src/lib/api'

const TERMINAL_STATUSES = ['needs_review', 'approved', 'rejected', 'escalated', 'possible_duplicate']
const POLL_INTERVAL = 3000

export function useCapture(captureId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [fields, setFields] = useState<unknown[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!captureId) return
    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current!)
  }, [captureId])

  async function poll() {
    try {
      const { capture, fields } = await getCapture(captureId!) as { capture: { status: string }, fields: unknown[] }
      setStatus(capture.status)
      setFields(fields)
      if (TERMINAL_STATUSES.includes(capture.status)) {
        clearInterval(intervalRef.current!)
      }
    } catch {
      // silently retry on next poll
    }
  }

  return { status, fields }
}
