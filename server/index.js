require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  OUTREACH_STATUSES,
  CLASSIFICATIONS,
  initDatabase,
  getProspects,
  updateProspectStatus,
  updateProspectClassification,
  getChatLinks,
  addChatLink,
  deleteChatLink,
  getBrief,
  getSummary,
  getExcluded,
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

app.get('/api/classifications', (req, res) => {
  res.json(CLASSIFICATIONS);
});

app.patch('/api/prospects/:id/classification', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Prospect not found' });
    const classification = await updateProspectClassification(id, req.body?.classification);
    if (classification === null) return res.status(404).json({ error: 'Prospect not found' });
    res.json({ classification });
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error('Error updating prospect classification:', err);
    res.status(500).json({ error: 'Failed to update classification' });
  }
});

app.get('/api/prospects/:id/chat-links', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Prospect not found' });
    res.json(await getChatLinks(id));
  } catch (err) {
    console.error('Error fetching chat links:', err);
    res.status(500).json({ error: 'Failed to fetch chat links' });
  }
});

app.post('/api/prospects/:id/chat-links', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Prospect not found' });
    const link = await addChatLink(id, req.body?.url, req.body?.label);
    if (link === null) return res.status(404).json({ error: 'Prospect not found' });
    res.status(201).json(link);
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error('Error adding chat link:', err);
    res.status(500).json({ error: 'Failed to save link' });
  }
});

app.delete('/api/prospects/:id/chat-links/:linkId', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const linkId = Number(req.params.linkId);
    if (!Number.isInteger(id) || !Number.isInteger(linkId) || !(await deleteChatLink(id, linkId))) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting chat link:', err);
    res.status(500).json({ error: 'Failed to delete link' });
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

app.get('/api/excluded', async (req, res) => {
  try {
    res.json(await getExcluded());
  } catch (err) {
    console.error('Error fetching excluded companies:', err);
    res.status(500).json({ error: 'Failed to fetch excluded companies' });
  }
});

// template.xml is gitignored, so read it on each request (edits show up without a restart)
const PROMPT_TEMPLATE_PATH = path.resolve(__dirname, '../template.xml');

app.get('/api/prompt-template', (req, res) => {
  fs.readFile(PROMPT_TEMPLATE_PATH, 'utf8', (err, template) => {
    if (err) {
      console.error('Error reading prompt template:', err);
      return res.status(err.code === 'ENOENT' ? 404 : 500).json({
        error: err.code === 'ENOENT' ? 'template.xml not found in the project root' : 'Failed to read template.xml',
      });
    }
    res.type('text/plain').send(template);
  });
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
