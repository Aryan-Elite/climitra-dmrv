const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const getSupabase = require('../lib/supabase')

const router = express.Router()

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const { data: user, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
