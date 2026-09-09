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
  bulkUpdateCompanyStage,
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

// BULK UPDATE company stages
app.post('/api/prospects/bulk-stage', async (req, res) => {
  try {
    const { companyIds, stage, setter, channel } = req.body || {};
    if (!Array.isArray(companyIds) || companyIds.length === 0 || !stage) {
      return res.status(400).json({ error: 'companyIds array and stage are required' });
    }
    const today = new Date().toISOString().split('T')[0];
    const updatedIds = await bulkUpdateCompanyStage(companyIds, stage, setter, today, channel);
    res.json({ message: `Updated ${updatedIds.length} companies to ${stage}`, updatedCount: updatedIds.length, updatedIds });
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

// Helper to filter prospects by tab/stage for export
function filterProspectsForExport(data, filterTarget, channel = '') {
  let list = data;
  if (channel === 'linkedin') {
    list = list.filter(p => (p.contacts || []).some(c => Boolean(c.linkedinUrl && c.linkedinUrl.trim())));
  }
  if (!filterTarget || filterTarget === 'all') return list;
  const target = filterTarget.toLowerCase().trim();
  const getStage = (p) => {
    if (channel === 'email') return (p.emailStage || p.stage || '').trim();
    if (channel === 'linkedin') return (p.linkedinStage || p.stage || '').trim();
    return (p.stage || '').trim();
  };

  if (target === 'qualified') {
    return list.filter(p => {
      const s = getStage(p);
      return s === 'Qualified' || s === 'Done' || s === 'Appointment Booked' || s === 'Completed';
    });
  }
  if (target === 'disqualified') {
    return list.filter(p => {
      const s = getStage(p);
      return s === 'Disqualified' || s === 'Not a Fit' || s === 'Bounced' || s === 'Rejected' || s === 'Lost';
    });
  }
  if (target === 'in-review' || target === 'in_review' || target === 'in review') {
    return list.filter(p => {
      const s = getStage(p);
      return s === 'In Review' || s === 'In Progress' || s === 'Follow-Up' || s === 'Follow-up' || s === 'Follow-up Due' || s === 'Follow-up 1' || s === 'Follow-up 2' || s === 'Contacted' || s === 'Email Sent' || s === 'LinkedIn Pending' || s === 'LinkedIn Connected' || s === 'In Discussion';
    });
  }
  if (target === 'todo' || target === 'to-do' || target === 'to do') {
    return list.filter(p => {
      const s = getStage(p);
      return !['Qualified', 'Done', 'Appointment Booked', 'Completed', 'Disqualified', 'Not a Fit', 'Bounced', 'Rejected', 'Lost', 'In Review', 'In Progress', 'Follow-Up', 'Follow-up', 'Follow-up Due', 'Follow-up 1', 'Follow-up 2', 'Contacted', 'Email Sent', 'LinkedIn Pending', 'LinkedIn Connected', 'In Discussion'].includes(s);
    });
  }
  return list.filter(p => getStage(p).toLowerCase() === target);
}

// EXPORT to CSV (supports ?tab=qualified or ?stage=Qualified and ?channel=email)
app.get('/api/export/csv', async (req, res) => {
  try {
    const { stage, tab, channel } = req.query;
    let data = await getProspects();
    const filterTarget = tab || stage || '';
    data = filterProspectsForExport(data, filterTarget, channel);

    const csvString = exportToCSV(data);
    const dateStr = new Date().toISOString().split('T')[0];
    const prefix = channel ? `${channel}_` : '';
    const filename = filterTarget ? `${prefix}${filterTarget.toLowerCase()}_prospects_${dateStr}.csv` : `${prefix}prospects_outreach_updated_${dateStr}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvString);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXPORT specific companies or filter via POST
app.post('/api/export/csv', async (req, res) => {
  try {
    const { companyIds, tab, stage, channel } = req.body || {};
    let data = await getProspects();

    if (Array.isArray(companyIds) && companyIds.length > 0) {
      const idSet = new Set(companyIds);
      data = data.filter(p => idSet.has(p.id));
    } else if (tab || stage) {
      data = filterProspectsForExport(data, tab || stage, channel);
    }

    const csvString = exportToCSV(data);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = (tab || stage) ? `${(tab || stage).toLowerCase()}_prospects_${dateStr}.csv` : `prospects_export_${dateStr}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
