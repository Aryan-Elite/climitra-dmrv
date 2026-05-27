require('dotenv').config()
const express = require('express')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')
const authRoutes = require('./routes/auth')
const captureRoutes = require('./routes/captures')
const dashboardRoutes = require('./routes/dashboard')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/captures', captureRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(errorHandler)

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
