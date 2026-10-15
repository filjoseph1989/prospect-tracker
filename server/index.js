require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  OUTREACH_STATUSES,
  initDatabase,
  getProspects,
  updateProspectStatus,
  getBrief,
  getSummary,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

initDatabase().catch(err => {
  console.error('Database initialization failed:', err);
});

app.get('/api/prospects', async (req, res) => {
  try {
    res.json(await getProspects());
  } catch (err) {
    console.error('Error fetching prospects:', err);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

app.get('/api/statuses', (req, res) => {
  res.json(OUTREACH_STATUSES);
});

app.patch('/api/prospects/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Prospect not found' });
    const status = await updateProspectStatus(id, req.body?.status);
    if (status === null) return res.status(404).json({ error: 'Prospect not found' });
    res.json({ outreach_status: status });
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error('Error updating prospect status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.get('/api/brief', async (req, res) => {
  try {
    res.json(await getBrief());
  } catch (err) {
    console.error('Error fetching brief:', err);
    res.status(500).json({ error: 'Failed to fetch brief' });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    res.json(await getSummary());
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Serve static frontend build in production
const DIST_PATH = path.resolve(__dirname, '../dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
