const { v4: uuidv4 } = require('uuid')
const getSupabase = require('../lib/supabase')
const { ocrQueue } = require('../lib/queue')
const { preprocessImage, computeHash, checkDuplicate, uploadToStorage } = require('./imageService')

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET

async function createCapture(fileBuffer, uploadedBy) {
  const supabase = getSupabase()
  const processed = await preprocessImage(fileBuffer)
  const hash = await computeHash(processed)

  const duplicate = await checkDuplicate(supabase, hash)
  if (duplicate) return { captureId: duplicate.id, status: 'possible_duplicate', duplicateOf: duplicate.id }

  const filename = `${uuidv4()}.jpg`
  await uploadToStorage(supabase, processed, filename, BUCKET)

  const { data: capture, error } = await supabase
    .from('captures')
    .insert({ image_bucket: BUCKET, image_path: filename, image_hash: hash, uploaded_by: uploadedBy, status: 'pending' })
    .select()
    .single()

  if (error) throw new Error('Failed to create capture: ' + error.message)

  await logEvent(supabase, capture.id, 'uploaded', uploadedBy, 'human')
  await ocrQueue.add({ captureId: capture.id, imagePath: filename, bucket: BUCKET })

  return { captureId: capture.id, status: 'processing' }
}

async function logEvent(supabase, captureId, eventType, actorId, actorType, extras = {}) {
  await supabase.from('capture_events').insert({
    capture_id: captureId, event_type: eventType,
    actor_id: actorId, actor_type: actorType, ...extras,
  })
}

module.exports = { createCapture, logEvent }
