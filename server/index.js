require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getProspects } = require('./db');

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
