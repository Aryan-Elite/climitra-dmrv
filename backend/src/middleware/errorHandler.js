function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${err.message}`)

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message })
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
}

module.exports = errorHandler
