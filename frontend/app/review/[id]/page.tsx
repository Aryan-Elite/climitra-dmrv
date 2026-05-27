'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCapture, correctField, updateCaptureStatus } from '@/src/lib/api'
import ReviewShell from '@/src/components/ReviewShell'

interface Field {
  id: string
  field_name: string
  ocr_value: string
  current_value: string
  confidence: number
  is_human_corrected: boolean
}

interface Event {
  id: string
  event_type: string
  actor_type: string
  field_name?: string
  old_value?: string
  new_value?: string
  created_at: string
}

interface Capture {
  id: string
  status: string
  document_type: string | null
  uploaded_at: string
  image_url?: string
}

function confidenceColor(c: number) {
  if (c >= 0.85) return 'text-green-600 bg-green-50 border-green-200'
  if (c >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function FieldRow({ field, captureId, onSaved }: { field: Field; captureId: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(field.current_value || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (value === field.current_value) { setEditing(false); return }
    setSaving(true)
    try {
      await correctField(captureId, field.field_name, value)
      onSaved()
      setEditing(false)
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {field.field_name.replace(/_/g, ' ')}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${confidenceColor(field.confidence)}`}>
          {Math.round(field.confidence * 100)}%
        </span>
      </div>
      {editing ? (
        <div className="flex gap-2 mt-1">
          <input value={value} onChange={e => setValue(e.target.value)}
            className="flex-1 text-sm border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50" />
          <button onClick={save} disabled={saving}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={() => { setEditing(false); setValue(field.current_value || '') }}
            className="text-sm px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-sm font-semibold text-slate-800">
            {field.current_value || <span className="text-slate-300 italic font-normal">—</span>}
            {field.is_human_corrected && field.current_value !== field.ocr_value &&
              <span className="ml-2 text-xs text-blue-500 font-medium">(edited)</span>}
          </span>
          <button onClick={() => setEditing(true)}
            className="text-xs text-slate-400 hover:text-blue-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex-shrink-0 ml-3">
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

const EVENT_COLORS: Record<string, string> = {
  uploaded: 'bg-slate-400',
  processing_started: 'bg-blue-400',
  ocr_completed: 'bg-green-400',
  field_corrected: 'bg-orange-400',
  capture_approved: 'bg-green-500',
  capture_rejected: 'bg-red-400',
  capture_escalated: 'bg-purple-400',
}

export default function ReviewDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [capture, setCapture] = useState<Capture | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getCapture(id) as { capture: Capture; fields: Field[]; events: Event[] }
      setCapture(res.capture)
      setFields(res.fields)
      setEvents(res.events)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) return router.replace('/login')
    load()
  }, [router, load])

  async function doAction(status: string) {
    setActioning(true)
    try {
      await updateCaptureStatus(id, status)
      router.push('/review')
    } catch { /* ignore */ } finally {
      setActioning(false)
    }
  }

  if (loading) return (
    <ReviewShell>
      <div className="flex items-center justify-center h-full py-40 text-slate-400">Loading...</div>
    </ReviewShell>
  )

  if (!capture) return (
    <ReviewShell>
      <div className="flex items-center justify-center h-full py-40 text-slate-400">Capture not found</div>
    </ReviewShell>
  )

  const isActionable = capture.status === 'needs_review' || capture.status === 'escalated'

  return (
    <ReviewShell>
      <div style={{ paddingLeft: 16, paddingRight: 140, paddingTop: 28 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/review')}
            className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-slate-800 capitalize flex-1">
            {capture.document_type?.replace(/_/g, ' ') || 'Document Review'}
          </h1>
          <span className="text-xs text-slate-400">{new Date(capture.uploaded_at).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: image */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {capture.image_url ? (
              <img src={capture.image_url} alt="capture" className="w-full h-auto" />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
                No image available
              </div>
            )}
          </div>

          {/* Right: fields + actions + audit */}
          <div className="flex flex-col gap-4">
            {/* Fields */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Extracted Fields</h2>
              {fields.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No fields extracted yet</p>
              ) : (
                fields.map(f => <FieldRow key={f.id} field={f} captureId={id} onSaved={load} />)
              )}
            </div>

            {/* Actions */}
            {isActionable && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Actions</h2>
                <div className="flex gap-3">
                  <button onClick={() => doAction('approved')} disabled={actioning}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    Approve
                  </button>
                  <button onClick={() => doAction('escalated')} disabled={actioning}
                    className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm">
                    Escalate
                  </button>
                  <button onClick={() => doAction('rejected')} disabled={actioning}
                    className="flex-1 py-2.5 bg-white text-red-500 text-sm font-bold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors border-2 border-red-200">
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Audit Trail</h2>
              {events.length === 0 ? (
                <p className="text-sm text-slate-400">No events yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100" />
                  <div className="space-y-4">
                    {events.map(e => (
                      <div key={e.id} className="flex items-start gap-3 relative">
                        <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ring-2 ring-white ${EVENT_COLORS[e.event_type] || 'bg-slate-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">
                            {e.event_type.replace(/_/g, ' ')}
                          </p>
                          {e.field_name && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {e.field_name.replace(/_/g, ' ')}: <span className="line-through">{e.old_value}</span> → <span className="text-blue-600 font-medium">{e.new_value}</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(e.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ReviewShell>
  )
}
