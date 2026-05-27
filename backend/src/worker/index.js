require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const { ocrQueue } = require('../lib/queue')
const { processOcrJob } = require('./ocrProcessor')

console.log('Worker started, waiting for jobs...')

ocrQueue.process(async (job) => {
  console.log(`Processing job ${job.id} for capture ${job.data.captureId}`)
  await processOcrJob(job.data)
  console.log(`Job ${job.id} completed`)
})

ocrQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message)
})
