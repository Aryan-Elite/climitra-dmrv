const express = require('express')
const { authenticate } = require('../middleware/auth')
const getSupabase = require('../lib/supabase')

const router = express.Router()

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const supabase = getSupabase()
    const { data: captures, error } = await supabase.from('captures').select('status')
    if (error) throw error

    const counts = { total: 0, pending: 0, processing: 0, needs_review: 0, approved: 0, rejected: 0, escalated: 0, possible_duplicate: 0 }
    for (const c of captures || []) {
      counts.total++
      if (counts[c.status] !== undefined) counts[c.status]++
    }

    const { data: fields } = await supabase.from('capture_fields').select('confidence')
    const avg_confidence = fields?.length
      ? fields.reduce((sum, f) => sum + (f.confidence || 0), 0) / fields.length
      : null

    res.json({ ...counts, avg_confidence: avg_confidence ? +avg_confidence.toFixed(3) : null })
  } catch (err) {
    next(err)
  }
})

module.exports = router
