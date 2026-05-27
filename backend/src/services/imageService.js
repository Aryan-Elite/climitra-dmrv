const sharp = require('sharp')
const crypto = require('crypto')

async function preprocessImage(buffer) {
  return sharp(buffer)
    .rotate()
    .normalize()
    .sharpen()
    .grayscale()
    .jpeg({ quality: 90 })
    .toBuffer()
}

async function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function checkDuplicate(supabase, hash) {
  const { data } = await supabase
    .from('captures')
    .select('id, image_path')
    .eq('image_hash', hash)
    .limit(1)
    .single()
  return data || null
}

async function uploadToStorage(supabase, buffer, filename, bucket) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error('Storage upload failed: ' + error.message)
}

module.exports = { preprocessImage, computeHash, checkDuplicate, uploadToStorage }
