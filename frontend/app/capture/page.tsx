'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uploadCapture } from '@/src/lib/api'
import { savePendingUpload } from '@/src/lib/db'
import { useOfflineSync } from '@/src/hooks/useOfflineSync'
import { useCapture } from '@/src/hooks/useCapture'

type UploadStatus = 'idle' | 'queued' | 'uploading' | 'processing' | 'done' | 'duplicate' | 'error'

interface UploadResult {
  id: string
  filename: string
  status: UploadStatus
  captureId?: string
  error?: string
}

function UploadItem({ item }: { item: UploadResult }) {
  const { status: liveStatus } = useCapture(
    item.status === 'processing' ? (item.captureId ?? null) : null
  )

  const finalStatus: UploadStatus = (() => {
    if (item.status !== 'processing') return item.status
    if (!liveStatus) return 'processing'
    if (liveStatus === 'needs_review') return 'done'
    if (liveStatus === 'possible_duplicate') return 'duplicate'
    return 'processing'
  })()

  const labelMap: Record<UploadStatus, string> = {
    idle: '', queued: 'Saved — will upload when connected',
    uploading: 'Uploading...', processing: 'Processing with OCR...',
    done: 'Done — ready for review', duplicate: 'Possible duplicate — flagged',
    error: item.error || 'Upload failed',
  }

  const colorMap: Record<UploadStatus, string> = {
    idle: '', queued: 'text-gray-500', uploading: 'text-blue-600',
    processing: 'text-blue-600', done: 'text-green-600',
    duplicate: 'text-yellow-600', error: 'text-red-500',
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.filename}</p>
        <p className={`text-xs mt-0.5 ${colorMap[finalStatus]}`}>{labelMap[finalStatus]}</p>
      </div>
      {(finalStatus === 'uploading' || finalStatus === 'processing') && (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      {finalStatus === 'done' && <span className="text-green-500 text-xl">✓</span>}
      {finalStatus === 'error' && <span className="text-red-500 text-xl">✗</span>}
      {finalStatus === 'duplicate' && <span className="text-yellow-500 text-xl">⚠</span>}
    </div>
  )
}

export default function CapturePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<UploadResult[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useOfflineSync(() => setUploads(prev =>
    prev.map(u => u.status === 'queued' ? { ...u, status: 'processing' } : u)
  ))

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) return router.replace('/login')
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))
  }, [router])

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return

    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      const entry: UploadResult = { id, filename: file.name, status: 'uploading' }
      setUploads(prev => [entry, ...prev])

      if (!navigator.onLine) {
        await savePendingUpload({ id, file, timestamp: Date.now(), status: 'pending' })
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'queued' } : u))
        continue
      }

      try {
        const form = new FormData()
        form.append('image', file)
        const result = await uploadCapture(form) as { captureId: string; status: string }
        const status: UploadStatus = result.status === 'possible_duplicate' ? 'duplicate' : 'processing'
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status, captureId: result.captureId } : u))
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Upload failed'
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error } : u))
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Document</h1>
          <div className={`text-xs mt-0.5 font-medium ${isOnline ? 'text-green-600' : 'text-orange-500'}`}>
            {isOnline ? 'Online' : 'Offline — uploads will sync automatically'}
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); router.replace('/login') }}
          className="text-sm text-gray-400 hover:text-gray-600">Logout</button>
      </div>

      <button
        onClick={() => cameraInputRef.current?.click()}
        className="w-full aspect-square max-h-64 bg-green-50 border-2 border-dashed border-green-400 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-green-100 active:scale-95 transition-all"
      >
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-green-700 font-semibold text-lg">Take Photo</span>
      </button>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={e => handleFiles(e.target.files)} />

      <button onClick={() => fileInputRef.current?.click()}
        className="mt-4 w-full py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
        Upload from Gallery
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" multiple
        className="hidden" onChange={e => handleFiles(e.target.files)} />

      {uploads.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Uploads</h2>
          {uploads.map(u => <UploadItem key={u.id} item={u} />)}
        </div>
      )}
    </div>
  )
}
