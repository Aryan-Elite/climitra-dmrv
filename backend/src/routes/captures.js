const express = require('express')
const { authenticate } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { createCapture, logEvent } = require('../services/captureService')
const getSupabase = require('../lib/supabase')

const router = express.Router()

const VALID_STATUSES = ['approved', 'rejected', 'escalated']

function getImageUrl(supabase, bucket, path, width) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: { width, quality: 80 },
  })
  return data.publicUrl
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const supabase = getSupabase()
    const { status, document_type, vehicle_number, date_from, date_to, confidence_threshold } = req.query

    let query = supabase.from('captures').select('*').order('uploaded_at', { ascending: false })
    if (status) query = query.eq('status', status)
    if (document_type) query = query.eq('document_type', document_type)
    if (vehicle_number) query = query.ilike('id', `%${vehicle_number}%`)
    if (date_from) query = query.gte('uploaded_at', date_from)
    if (date_to) query = query.lte('uploaded_at', date_to)

    const { data: captures, error } = await query
    if (error) throw error

    let results = captures || []
    if (confidence_threshold) {
      const threshold = parseFloat(confidence_threshold)
      const { data: lowConf } = await supabase
        .from('capture_fields')
        .select('capture_id')
        .lt('confidence', threshold)
      const ids = new Set((lowConf || []).map(r => r.capture_id))
      results = results.filter(c => ids.has(c.id))
    }

    results = results.map(c => ({
      ...c,
      thumbnail_url: getImageUrl(supabase, c.image_bucket, c.image_path, 400),
    }))

    res.json({ captures: results })
  } catch (err) {
    next(err)
  }
})

router.post('/upload', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' })
    const result = await createCapture(req.file.buffer, req.user.id)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/export', authenticate, async (req, res, next) => {
  try {
    const supabase = getSupabase()
    const { status, document_type, date_from, date_to } = req.query

    let query = supabase.from('captures').select('*, capture_fields(field_name, current_value, confidence, is_human_corrected)')
      .order('uploaded_at', { ascending: false })
    if (status) query = query.eq('status', status)
    if (document_type) query = query.eq('document_type', document_type)
    if (date_from) query = query.gte('uploaded_at', date_from)
    if (date_to) query = query.lte('uploaded_at', date_to)

    const { data: captures, error } = await query
    if (error) throw error

    const rows = (captures || []).map(c => {
      const fields = Object.fromEntries((c.capture_fields || []).map(f => [f.field_name, f.current_value]))
      return { id: c.id, status: c.status, uploaded_at: c.uploaded_at, ...fields }
    })

    const headers = ['id', 'status', 'uploaded_at', 'weight', 'moisture_percentage', 'vehicle_number', 'date', 'document_type', 'driver_id']
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="captures.csv"')
    res.send(csv)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const supabase = getSupabase()
    const { data: capture, error } = await supabase
      .from('captures')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !capture) return res.status(404).json({ error: 'Capture not found' })

    const { data: fields } = await supabase
      .from('capture_fields')
      .select('*')
      .eq('capture_id', req.params.id)

    const { data: events } = await supabase
      .from('capture_events')
      .select('*')
      .eq('capture_id', req.params.id)
      .order('created_at', { ascending: true })

    const image_url = getImageUrl(supabase, capture.image_bucket, capture.image_path, 1200)
    res.json({ capture: { ...capture, image_url }, fields: fields || [], events: events || [] })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/fields', authenticate, async (req, res, next) => {
  try {
    const supabase = getSupabase()
    const { field_name, new_value } = req.body
    if (!field_name || new_value === undefined) return res.status(400).json({ error: 'field_name and new_value required' })

    const { data: field, error } = await supabase
      .from('capture_fields')
      .select('*')
      .eq('capture_id', req.params.id)
      .eq('field_name', field_name)
      .single()

    if (error || !field) return res.status(404).json({ error: 'Field not found' })

    await supabase.from('capture_fields').update({
      current_value: new_value, is_human_corrected: true,
      corrected_by: req.user.id, corrected_at: new Date().toISOString(),
    }).eq('id', field.id)

    await logEvent(supabase, req.params.id, 'field_corrected', req.user.id, 'human', {
      field_name, old_value: field.current_value, new_value,
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const supabase = getSupabase()
    const { status, note } = req.body
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` })

    const { error } = await supabase.from('captures').update({ status }).eq('id', req.params.id)
    if (error) throw error

    await logEvent(supabase, req.params.id, `capture_${status}`, req.user.id, 'human', { note })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
