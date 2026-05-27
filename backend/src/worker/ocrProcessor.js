const getSupabase = require('../lib/supabase')
const getOpenAI = require('../lib/openai')
const PROMPT = require('./ocrPrompt')

async function processOcrJob({ captureId, imagePath, bucket }) {
  const supabase = getSupabase()

  await supabase.from('captures').update({ status: 'processing' }).eq('id', captureId)
  await logEvent(supabase, captureId, 'processing_started', null, 'system')

  const imageBase64 = await downloadImage(supabase, bucket, imagePath)
  const fields = await runOcr(imageBase64)
  await saveFields(supabase, captureId, fields)

  const docType = fields.find(f => f.field_name === 'document_type')?.value || null
  await supabase.from('captures').update({ status: 'needs_review', document_type: docType }).eq('id', captureId)
  await logEvent(supabase, captureId, 'ocr_completed', null, 'system')
}

async function downloadImage(supabase, bucket, imagePath) {
  const { data, error } = await supabase.storage.from(bucket).download(imagePath)
  if (error) throw new Error('Failed to download image: ' + error.message)
  const buffer = Buffer.from(await data.arrayBuffer())
  return buffer.toString('base64')
}

async function runOcr(imageBase64) {
  const openai = getOpenAI()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } },
      ],
    }],
  })

  const content = response.choices[0].message.content
  const json = content.match(/\{[\s\S]*\}/)
  if (!json) throw new Error('OCR returned invalid JSON')
  return JSON.parse(json[0]).fields
}

async function saveFields(supabase, captureId, fields) {
  const rows = fields
    .filter(f => f.value !== null)
    .map(f => ({
      capture_id: captureId,
      field_name: f.field_name,
      ocr_value: f.value,
      current_value: f.value,
      confidence: f.confidence,
      is_human_corrected: false,
    }))

  const { error } = await supabase.from('capture_fields').insert(rows)
  if (error) throw new Error('Failed to save fields: ' + error.message)
}

async function logEvent(supabase, captureId, eventType, actorId, actorType) {
  await supabase.from('capture_events').insert({
    capture_id: captureId, event_type: eventType,
    actor_id: actorId, actor_type: actorType,
  })
}

module.exports = { processOcrJob }
