require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { 
  initDatabase, 
  getProspects, 
  getProspectById, 
  updateCompany, 
  addContact, 
  updateContact, 
  deleteContact, 
  reorderContacts,
  exportToCSV 
} = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize DB schema & migrate data if empty
initDatabase().catch(err => {
  console.error('Database initialization failed:', err);
});

// GET all prospects
app.get('/api/prospects', async (req, res) => {
  try {
    const data = await getProspects();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single prospect
app.get('/api/prospects/:id', async (req, res) => {
  try {
    const item = await getProspectById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Prospect not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE company stage or details
app.put('/api/prospects/:id', async (req, res) => {
  try {
    const updated = await updateCompany(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Prospect not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD contact to company
app.post('/api/prospects/:id/contacts', async (req, res) => {
  try {
    const updated = await addContact(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Prospect not found' });
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REORDER contacts
app.put('/api/prospects/:id/contacts/reorder', async (req, res) => {
  try {
    const { orderedContactIds } = req.body;
    if (!Array.isArray(orderedContactIds)) {
      return res.status(400).json({ error: 'orderedContactIds must be an array' });
    }
    const updated = await reorderContacts(req.params.id, orderedContactIds);
    if (!updated) return res.status(404).json({ error: 'Prospect not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE specific contact
app.put('/api/prospects/:id/contacts/:contactId', async (req, res) => {
  try {
    const updated = await updateContact(req.params.id, req.params.contactId, req.body);
    if (!updated) return res.status(404).json({ error: 'Contact or prospect not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE contact
app.delete('/api/prospects/:id/contacts/:contactId', async (req, res) => {
  try {
    const updated = await deleteContact(req.params.id, req.params.contactId);
    if (!updated) return res.status(404).json({ error: 'Contact or prospect not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats summary
app.get('/api/stats', async (req, res) => {
  try {
    const data = await getProspects();
    const totalCompanies = data.length;
    const multiContactCompanies = data.filter(c => (c.contacts || []).length > 1).length;
    
    let totalContacts = 0;
    let linkedinStats = { notStarted: 0, notConnected: 0, pending: 0, connected: 0, replied: 0 };
    let emailStats = { notSent: 0, sent: 0, followUp1: 0, followUp2: 0, replied: 0, bounced: 0 };
    let appointmentStats = { notBooked: 0, inDiscussion: 0, booked: 0 };
    let priorityBreakdown = { A: 0, B: 0, C: 0 };
    let stageBreakdown = {};

    data.forEach(c => {
      priorityBreakdown[c.priority] = (priorityBreakdown[c.priority] || 0) + 1;
      stageBreakdown[c.stage] = (stageBreakdown[c.stage] || 0) + 1;

      (c.contacts || []).forEach(contact => {
        totalContacts++;
        
        // LinkedIn
        const liStatus = (contact.linkedinStatus || 'Not Started').toLowerCase();
        if (liStatus === 'connected') linkedinStats.connected++;
        else if (liStatus === 'pending') linkedinStats.pending++;
        else if (liStatus === 'not connected') linkedinStats.notConnected++;
        else if (liStatus === 'replied') linkedinStats.replied++;
        else linkedinStats.notStarted++;

        // Email
        const eStatus = (contact.emailStatus || 'Not Sent').toLowerCase();
        if (eStatus === 'sent') emailStats.sent++;
        else if (eStatus === 'follow-up 1') emailStats.followUp1++;
        else if (eStatus === 'follow-up 2') emailStats.followUp2++;
        else if (eStatus === 'replied') emailStats.replied++;
        else if (eStatus === 'bounced') emailStats.bounced++;
        else emailStats.notSent++;

        // Appointment
        const apt = (contact.appointmentStatus || 'Not Booked').trim();
        if (apt === 'Appointment Booked' || (apt.toLowerCase().includes('booked') && !apt.toLowerCase().includes('not'))) {
          appointmentStats.booked++;
        } else if (apt === 'In Discussion' || apt.toLowerCase().includes('discussion') || apt.toLowerCase().includes('progress')) {
          appointmentStats.inDiscussion++;
        } else {
          appointmentStats.notBooked++;
        }
      });
    });

    res.json({
      totalCompanies,
      multiContactCompanies,
      totalContacts,
      linkedinStats,
      emailStats,
      appointmentStats,
      priorityBreakdown,
      stageBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXPORT to CSV
app.get('/api/export/csv', async (req, res) => {
  try {
    const data = await getProspects();
    const csvString = exportToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prospects_outreach_updated.csv"');
    res.send(csvString);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXPORT to JSON
app.get('/api/export/json', async (req, res) => {
  try {
    const data = await getProspects();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="prospects_backup.json"');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESET to original CSV
app.post('/api/reset', async (req, res) => {
  try {
    await initDatabase(true);
    const data = await getProspects();
    res.json({ message: 'PostgreSQL database reset from original CSV', count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  console.log(`ProspectPulse Server (PostgreSQL) listening on http://localhost:${PORT}`);
});
