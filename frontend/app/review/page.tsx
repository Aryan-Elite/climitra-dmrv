'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCaptures } from '@/src/lib/api'
import ReviewShell from '@/src/components/ReviewShell'

interface Capture {
  id: string
  status: string
  document_type: string | null
  uploaded_at: string
  thumbnail_url?: string
}

const STATUS_COLORS: Record<string, string> = {
  needs_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  escalated: 'bg-purple-100 text-purple-700',
  possible_duplicate: 'bg-orange-100 text-orange-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-slate-100 text-slate-500',
}

const TABS = ['needs_review', 'possible_duplicate', 'escalated', 'approved', 'rejected', '']

export default function ReviewPage() {
  const router = useRouter()
  const [captures, setCaptures] = useState<Capture[]>([])
  const [status, setStatus] = useState('needs_review')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (status) params.status = status
      const res = await getCaptures(params) as { captures: Capture[] }
      setCaptures(res.captures || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) return router.replace('/login')
    load()
  }, [router, load])

  return (
    <ReviewShell>
      <div style={{ paddingLeft: 16, paddingRight: 140, paddingTop: 28 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Review Queue</h1>
          <p className="text-sm text-slate-400 mt-1">Documents waiting for your review</p>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                status === s
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}>
              {s ? s.replace(/_/g, ' ') : 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : captures.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No captures found</div>
        ) : (
          <div className="space-y-3">
            {captures.map(c => (
              <button key={c.id} onClick={() => router.push(`/review/${c.id}`)}
                className="w-full bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all text-left">
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt="thumbnail" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-slate-100" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 capitalize">{c.document_type?.replace(/_/g, ' ') || 'Unknown type'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(c.uploaded_at).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-500'}`}>
                  {c.status.replace(/_/g, ' ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </ReviewShell>
  )
}
