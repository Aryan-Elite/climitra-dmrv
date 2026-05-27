'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getDashboardStats, getCaptures } from '@/src/lib/api'
import ReviewShell from '@/src/components/ReviewShell'

interface Stats {
  total: number
  pending: number
  processing: number
  needs_review: number
  approved: number
  rejected: number
  escalated: number
  possible_duplicate: number
  avg_confidence: number | null
}

interface Capture {
  id: string
  status: string
  document_type: string | null
  uploaded_at: string
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

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm`}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent || 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) return router.replace('/login')
    loadAll()
  }, [router])

  async function loadAll() {
    try {
      const [s, c] = await Promise.all([getDashboardStats(), getCaptures()]) as unknown as [Stats, { captures: Capture[] }]
      setStats(s)
      setCaptures(c.captures || [])
    } catch { /* ignore */ }
  }

  const filtered = statusFilter ? captures.filter(c => c.status === statusFilter) : captures

  return (
    <ReviewShell>
      <div style={{ paddingLeft: 16, paddingRight: 140, paddingTop: 28 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Operations overview</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
            <StatCard label="Total Captures" value={stats.total} />
            <StatCard label="Needs Review" value={stats.needs_review} accent="text-yellow-600" />
            <StatCard label="Approved" value={stats.approved} accent="text-green-600" />
            <StatCard label="Avg Confidence"
              value={stats.avg_confidence ? `${Math.round(stats.avg_confidence * 100)}%` : '—'}
              accent={stats.avg_confidence && stats.avg_confidence >= 0.85 ? 'text-green-600' : 'text-yellow-600'} />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700">All Captures</h2>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50">
              <option value="">All statuses</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm">No captures</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(c => (
                <button key={c.id} onClick={() => router.push(`/review/${c.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 capitalize">{c.document_type?.replace(/_/g, ' ') || 'Unknown'}</p>
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
      </div>
    </ReviewShell>
  )
}
