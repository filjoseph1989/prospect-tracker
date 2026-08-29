const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDatabase, saveDatabase, initDatabase, exportToCSV } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize DB
initDatabase();

// Helper to auto-update company stage based on its contacts
function computeCompanyStage(company) {
  const contacts = company.contacts || [];
  const anyBooked = contacts.some(c => c.appointmentStatus === 'Appointment Booked');
  const anyReplied = contacts.some(c => c.emailStatus === 'Replied' || c.linkedinStatus === 'Replied');
  const anyConnected = contacts.some(c => c.linkedinStatus === 'Connected');
  const anyPending = contacts.some(c => c.linkedinStatus === 'Pending');
  const anyEmailed = contacts.some(c => ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied'].includes(c.emailStatus));

  if (anyBooked) return 'Appointment Booked';
  if (anyReplied) return 'In Discussion';
  if (anyConnected && anyEmailed) return 'Multi-Channel Outreach (Email & LI)';
  if (anyConnected) return 'LinkedIn Connected';
  if (anyEmailed && anyPending) return 'Multi-Channel Outreach (Email & LI)';
  if (anyEmailed) return 'Email Sent';
  if (anyPending) return 'LinkedIn Pending';
  if (contacts.some(c => c.email || c.linkedinUrl)) return 'Ready for Outreach';
  return company.stage || 'To Research';
}

// GET all prospects
app.get('/api/prospects', (req, res) => {
  try {
    const data = getDatabase();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single prospect
app.get('/api/prospects/:id', (req, res) => {
  try {
    const data = getDatabase();
    const item = data.find(p => p.id === req.params.id || p.rank === parseInt(req.params.id, 10));
    if (!item) return res.status(404).json({ error: 'Prospect not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE company
app.put('/api/prospects/:id', (req, res) => {
  try {
    const data = getDatabase();
    const index = data.findIndex(p => p.id === req.params.id || p.rank === parseInt(req.params.id, 10));
    if (index === -1) return res.status(404).json({ error: 'Prospect not found' });

    const updated = {
      ...data[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    data[index] = updated;
    saveDatabase(data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD contact to company
app.post('/api/prospects/:id/contacts', (req, res) => {
  try {
    const data = getDatabase();
    const index = data.findIndex(p => p.id === req.params.id || p.rank === parseInt(req.params.id, 10));
    if (index === -1) return res.status(404).json({ error: 'Prospect not found' });

    const company = data[index];
    const newContactId = `contact_${company.rank}_${(company.contacts || []).length + 1}_${Date.now().toString().slice(-4)}`;

    const newContact = {
      id: newContactId,
      name: req.body.name || 'New Contact',
      role: req.body.role || 'Key Decision Maker',
      email: req.body.email || '',
      additionalEmails: req.body.additionalEmails || [],
      linkedinUrl: req.body.linkedinUrl || '',
      linkedinStatus: req.body.linkedinStatus || 'Not Started',
      linkedinConnectedBy: req.body.linkedinConnectedBy || '',
      linkedinLastContactDate: req.body.linkedinLastContactDate || '',
      emailStatus: req.body.emailStatus || 'Not Sent',
      emailContactedBy: req.body.emailContactedBy || '',
      emailLastContactDate: req.body.emailLastContactDate || '',
      appointmentStatus: req.body.appointmentStatus || 'Not Booked',
      notes: req.body.notes || ''
    };

    // Remove placeholder contact (e.g. "Key Contact (To Identify)") when adding a real contact
    company.contacts = (company.contacts || []).filter(c => {
      const isPlaceholder = (c.name || '').toLowerCase().includes('to identify') || c.name === 'Key Contact (To Identify)';
      return !isPlaceholder;
    });
    company.contacts.push(newContact);
    company.stage = company.stage || 'To Do';
    company.updatedAt = new Date().toISOString();

    data[index] = company;
    saveDatabase(data);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE specific contact
app.put('/api/prospects/:id/contacts/:contactId', (req, res) => {
  try {
    const data = getDatabase();
    const index = data.findIndex(p => p.id === req.params.id || p.rank === parseInt(req.params.id, 10));
    if (index === -1) return res.status(404).json({ error: 'Prospect not found' });

    const company = data[index];
    const contactIndex = (company.contacts || []).findIndex(c => c.id === req.params.contactId);
    if (contactIndex === -1) return res.status(404).json({ error: 'Contact not found' });

    const updatedContact = {
      ...company.contacts[contactIndex],
      ...req.body
    };

    company.contacts[contactIndex] = updatedContact;
    company.stage = company.stage || 'To Do';
    company.updatedAt = new Date().toISOString();

    data[index] = company;
    saveDatabase(data);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE contact
app.delete('/api/prospects/:id/contacts/:contactId', (req, res) => {
  try {
    const data = getDatabase();
    const index = data.findIndex(p => p.id === req.params.id || p.rank === parseInt(req.params.id, 10));
    if (index === -1) return res.status(404).json({ error: 'Prospect not found' });

    const company = data[index];
    company.contacts = (company.contacts || []).filter(c => c.id !== req.params.contactId);
    company.stage = company.stage || 'To Do';
    company.updatedAt = new Date().toISOString();

    data[index] = company;
    saveDatabase(data);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats summary
app.get('/api/stats', (req, res) => {
  try {
    const data = getDatabase();
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
app.get('/api/export/csv', (req, res) => {
  try {
    const data = getDatabase();
    const csvString = exportToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prospects_outreach_updated.csv"');
    res.send(csvString);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXPORT to JSON
app.get('/api/export/json', (req, res) => {
  try {
    const data = getDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="prospects_backup.json"');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESET to original CSV
app.post('/api/reset', (req, res) => {
  try {
    const data = initDatabase(true);
    res.json({ message: 'Database reset from original CSV', count: data.length });
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
  console.log(`ProspectPulse Server listening on http://localhost:${PORT}`);
});
