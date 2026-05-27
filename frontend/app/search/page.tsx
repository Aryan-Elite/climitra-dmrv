'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCaptures, exportCaptures } from '@/src/lib/api'
import ReviewShell from '@/src/components/ReviewShell'

interface Capture {
  id: string
  status: string
  document_type: string | null
  uploaded_at: string
}

export default function SearchPage() {
  const router = useRouter()
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState({ status: '', document_type: '', date_from: '', date_to: '' })

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) router.replace('/login')
  }, [router])

  function setFilter(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  async function search() {
    setLoading(true)
    setSearched(true)
    try {
      const params: Record<string, string> = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await getCaptures(params) as { captures: Capture[] }
      setCaptures(res.captures || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  async function downloadCsv() {
    try {
      const params: Record<string, string> = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const csv = await exportCaptures(params)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'captures.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  return (
    <ReviewShell>
      <div style={{ paddingLeft: 16, paddingRight: 140, paddingTop: 28 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Search & Reconciliation</h1>
          <p className="text-sm text-slate-400 mt-1">Filter and export capture records</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Status</label>
              <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50">
                <option value="">All</option>
                {['needs_review', 'approved', 'rejected', 'escalated', 'possible_duplicate', 'processing', 'pending'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Document Type</label>
              <select value={filters.document_type} onChange={e => setFilter('document_type', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50">
                <option value="">All</option>
                {['weighbridge_slip', 'moisture_reading', 'dispatch_challan', 'other'].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">From Date</label>
              <input type="date" value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">To Date</label>
              <input type="date" value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={search} disabled={loading}
              className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-sm">
              {loading ? 'Searching...' : 'Search'}
            </button>
            {captures.length > 0 && (
              <button onClick={downloadCsv}
                className="px-6 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV ({captures.length})
              </button>
            )}
          </div>
        </div>

        {searched && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            {captures.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-sm">No results found</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {captures.map(c => (
                  <button key={c.id} onClick={() => router.push(`/review/${c.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 capitalize">{c.document_type?.replace(/_/g, ' ') || 'Unknown'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(c.uploaded_at).toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ReviewShell>
  )
}
