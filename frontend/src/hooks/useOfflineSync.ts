'use client'
import { useEffect, useRef } from 'react'
import { getPendingUploads, removePendingUpload } from '@/src/lib/db'
import { uploadCapture } from '@/src/lib/api'

export function useOfflineSync(onSynced?: () => void) {
  const syncing = useRef(false)

  async function syncPending() {
    if (syncing.current || !navigator.onLine) return
    syncing.current = true
    const pending = await getPendingUploads()
    for (const item of pending) {
      try {
        const form = new FormData()
        form.append('image', item.file)
        await uploadCapture(form)
        await removePendingUpload(item.id)
        onSynced?.()
      } catch {
        // leave in queue, retry next time
      }
    }
    syncing.current = false
  }

  useEffect(() => {
    syncPending()
    window.addEventListener('online', syncPending)
    return () => window.removeEventListener('online', syncPending)
  }, [])

  return { syncPending }
}
