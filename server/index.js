// server/index.js

require('dotenv').config()
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const admin    = require('firebase-admin')

const app = express()

app.use(cors())
app.use(express.json())

// connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

// initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

// middleware to verify Firebase ID token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split('Bearer ')[1]
    : null

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

// define Log schema & model
const logSchema = new mongoose.Schema({
  date_played: { type: Date,   required: true },
  boardgame:   { type: String, required: true },
  players:     [String],
  points:      [Number],
  winner:      String,
  uid:         String
})

const Log = mongoose.model('Log', logSchema)

// POST /api/logs → create a new game play log
app.post('/api/logs', authMiddleware, async (req, res) => {
  try {
    const { date_played, boardgame, players, points, winner } = req.body

    const log = new Log({
      date_played: new Date(date_played),
      boardgame,
      players,
      points,
      winner,
      uid: req.uid
    })

    await log.save()
    res.status(201).json({ message: 'Logged successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save log' })
  }
})

app.post('/log', async (req, res) => {
  try {
    const payload = req.body;
    // Save to a generic collection for compatibility with Cloudflare
    const LogGeneric = mongoose.model('LogGeneric', new mongoose.Schema({}, { strict: false }), 'mainLogs');
    await LogGeneric.create(payload);
    res.status(201).json({ message: 'Logged successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
