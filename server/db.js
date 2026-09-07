require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fil:@localhost:5432/prospect_tracker'
});

const CSV_PATHS = [
  path.resolve(__dirname, '../Prospects.csv')
];
const CSV_PATH = CSV_PATHS.find(p => fs.existsSync(p)) || CSV_PATHS[0];
const JSON_BACKUP_PATH = path.resolve(__dirname, '../data/prospects.json');
const LIST_TEXT_PATH = path.resolve(__dirname, '../list.text');

const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/[^\s,\n]+/g;

function cleanString(str) {
  if (!str) return '';
  return str.trim();
}

function getDeepseekMap() {
  const map = {};
  if (!fs.existsSync(LIST_TEXT_PATH)) return map;
  const listContent = fs.readFileSync(LIST_TEXT_PATH, 'utf-8');
  const lines = listContent.split('\n').filter(l => l.trim().length > 0);
  const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  lines.forEach(line => {
    const urlMatch = line.match(/(https:\/\/chat\.deepseek\.com\/[^\s|]+)/);
    if (!urlMatch) return;
    const url = urlMatch[1];
    let namePart = line.split('https://')[0].replace(/\(done\)/i, '').trim();
    map[normalize(namePart)] = url;
  });
  return map;
}

function parseCSVToData() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV file not found at ${CSV_PATH}`);
  }

  const deepseekMap = getDeepseekMap();
  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  const companies = [];
  const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  records.forEach((r, idx) => {
    const rank = parseInt(r['Rank'] || idx + 1, 10);
    const name = cleanString(r['Company']);
    if (!name) return;

    const normName = normalize(name);
    let deepseekUrl = deepseekMap[normName] || '';
    if (!deepseekUrl) {
      for (const [key, val] of Object.entries(deepseekMap)) {
        if (normName.includes(key) || key.includes(normName)) {
          deepseekUrl = val;
          break;
        }
      }
    }

    const rawPeople = cleanString(r['CEO / CTO / VP']);
    const rawEmail = cleanString(r['E-mail']);
    const rawLi = cleanString(r['Linkedin']);
    const rawLiConn = cleanString(r['LinkedIn Connected']);
    const rawLiOf = cleanString(r['LinkedIn Of']);
    const rawEmailCont = cleanString(r['Email Contacted']);
    const rawEmailBy = cleanString(r['Email Contacted By']);
    const notes = cleanString(r['Notes']);
    const website = cleanString(r['Website']);
    const priority = cleanString(r['Priority']) || 'B';
    const revenue = cleanString(r['Revenue / revenue status']);
    const employees = cleanString(r['Employees']);
    const businessModel = cleanString(r['Business model']);
    const automationOpps = cleanString(r['Likely automation opportunities']);
    const qualification = cleanString(r['Qualification']);

    const emailsInEmail = rawEmail.match(emailRegex) || [];
    const emailsInLi = rawLi.match(emailRegex) || [];
    const allEmails = Array.from(new Set([...emailsInEmail, ...emailsInLi]));

    const liInLi = rawLi.match(linkedinRegex) || [];
    const liInEmail = rawEmail.match(linkedinRegex) || [];
    const allLi = Array.from(new Set([...liInLi, ...liInEmail]));

    let peopleNames = [];
    if (rawPeople && rawPeople.toLowerCase() !== 'unknown' && rawPeople.toLowerCase() !== 'to research') {
      const cleanPeople = rawPeople
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '')
        .replace(/[0-9]/g, '');

      peopleNames = cleanPeople
        .split(/[,;\n\r&/]+|\band\b/i)
        .map(p => p.trim())
        .filter(p => p.length > 2 && !p.toLowerCase().includes('founder') && !p.toLowerCase().includes('director'));
    }

    const contacts = [];
    const count = Math.max(peopleNames.length, allEmails.length, allLi.length, 1);

    for (let i = 0; i < count; i++) {
      const pName = peopleNames[i] || (i === 0 ? '' : '');
      const pEmail = allEmails[i] || (i === 0 && allEmails.length === 1 ? allEmails[0] : '');
      const pLi = allLi[i] || (i === 0 && allLi.length === 1 ? allLi[0] : '');

      let cLiStatus = 'Not Started';
      let cLiBy = '';
      if (pLi) {
        if (['yes', 'true', 'connected'].includes(rawLiConn.toLowerCase())) {
          cLiStatus = 'Connected';
          cLiBy = rawLiOf || 'Fil';
        } else if (rawLiConn.toLowerCase().includes('pending')) {
          cLiStatus = 'Pending';
          cLiBy = rawLiOf || 'Fil';
        }
      }

      let cEmailStatus = 'Not Sent';
      let cEmailBy = '';
      if (pEmail && ['yes', 'true', 'sent'].includes(rawEmailCont.toLowerCase())) {
        cEmailStatus = 'Sent';
        cEmailBy = rawEmailBy || 'Fil';
      }

      if (pName || pEmail || pLi) {
        contacts.push({
          id: `contact_${rank}_${i + 1}`,
          name: pName || (pEmail ? pEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Key Executive'),
          role: i === 0 ? 'Managing Director / CEO' : 'Key Decision Maker',
          email: pEmail,
          additionalEmails: i === 0 ? allEmails.slice(1) : [],
          linkedinUrl: pLi,
          linkedinStatus: cLiStatus,
          linkedinConnectedBy: cLiBy,
          linkedinLastContactDate: cLiStatus !== 'Not Started' ? '2026-08-20' : '',
          emailStatus: cEmailStatus,
          emailContactedBy: cEmailBy,
          emailLastContactDate: cEmailStatus === 'Sent' ? '2026-08-20' : '',
          appointmentStatus: 'Not Booked',
          notes: ''
        });
      }
    }

    if (contacts.length === 0) {
      const defaultEmail = allEmails[0] || '';
      const defaultLi = allLi[0] || '';

      let cLiStatus = 'Not Started';
      let cLiBy = '';
      if (defaultLi && ['yes', 'true', 'connected'].includes(rawLiConn.toLowerCase())) {
        cLiStatus = 'Connected';
        cLiBy = rawLiOf || 'Fil';
      }

      let cEmailStatus = 'Not Sent';
      let cEmailBy = '';
      if (defaultEmail && ['yes', 'true', 'sent'].includes(rawEmailCont.toLowerCase())) {
        cEmailStatus = 'Sent';
        cEmailBy = rawEmailBy || 'Fil';
      }

      contacts.push({
        id: `contact_${rank}_1`,
        name: 'Key Contact (To Identify)',
        role: 'Executive / Decision Maker',
        email: defaultEmail,
        additionalEmails: allEmails.slice(1),
        linkedinUrl: defaultLi,
        linkedinStatus: cLiStatus,
        linkedinConnectedBy: cLiBy,
        linkedinLastContactDate: cLiStatus !== 'Not Started' ? '2026-08-20' : '',
        emailStatus: cEmailStatus,
        emailContactedBy: cEmailBy,
        emailLastContactDate: cEmailStatus === 'Sent' ? '2026-08-20' : '',
        appointmentStatus: 'Not Booked',
        notes: ''
      });
    }

    let overallStage = 'To Do';
    const anyConnected = contacts.some(c => c.linkedinStatus === 'Connected');
    const anyPending = contacts.some(c => c.linkedinStatus === 'Pending');
    const anyEmailed = contacts.some(c => c.emailStatus === 'Sent' || c.emailStatus === 'Follow-up 1' || c.emailStatus === 'Replied');
    const anyBooked = contacts.some(c => c.appointmentStatus === 'Appointment Booked');
    const workedBy = rawEmailBy || rawLiOf || (contacts[0] ? (contacts[0].emailContactedBy || contacts[0].linkedinConnectedBy) : '') || '';

    if (anyBooked) {
      overallStage = 'Qualified';
    } else if (anyConnected || anyEmailed || anyPending) {
      overallStage = 'In Review';
    } else {
      overallStage = 'To Do';
    }

    companies.push({
      id: `comp_${rank}`,
      rank: rank,
      name: name,
      website: website,
      deepseekUrl: deepseekUrl,
      businessModel: businessModel,
      revenue: revenue,
      employees: employees,
      priority: priority.toUpperCase(),
      qualification: qualification,
      automationOpportunities: automationOpps,
      notes: notes,
      stage: overallStage,
      workedBy: workedBy,
      lastContactDate: (anyConnected || anyEmailed || anyPending) ? '2026-08-20' : '',
      contacts: contacts,
      updatedAt: new Date().toISOString()
    });
  });

  return companies;
}

// Database schema initialization & auto-migration
async function initDatabase(force = false) {
  const client = await pool.connect();
  try {
    if (force) {
      await client.query('DROP TABLE IF EXISTS contacts CASCADE;');
      await client.query('DROP TABLE IF EXISTS companies CASCADE;');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(100) PRIMARY KEY,
        rank INTEGER UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        website TEXT DEFAULT '',
        business_model TEXT DEFAULT '',
        revenue VARCHAR(100) DEFAULT '',
        employees VARCHAR(100) DEFAULT '',
        priority VARCHAR(10) DEFAULT 'B',
        qualification TEXT DEFAULT '',
        automation_opportunities TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        stage VARCHAR(50) DEFAULT 'To Do',
        worked_by VARCHAR(100) DEFAULT '',
        last_contact_date VARCHAR(50) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        ai_links JSONB DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(100) PRIMARY KEY,
        company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) DEFAULT 'Key Decision Maker',
        email VARCHAR(255) DEFAULT '',
        additional_emails TEXT[] DEFAULT '{}',
        linkedin_url TEXT DEFAULT '',
        linkedin_status VARCHAR(100) DEFAULT 'Not Started',
        linkedin_connected_by VARCHAR(100) DEFAULT '',
        linkedin_last_contact_date VARCHAR(50) DEFAULT '',
        email_status VARCHAR(100) DEFAULT 'Not Sent',
        email_contacted_by VARCHAR(100) DEFAULT '',
        email_last_contact_date VARCHAR(50) DEFAULT '',
        email_sent_date VARCHAR(50) DEFAULT '',
        email_followup1_date VARCHAR(50) DEFAULT '',
        email_followup2_date VARCHAR(50) DEFAULT '',
        next_followup_date VARCHAR(50) DEFAULT '',
        appointment_status VARCHAR(100) DEFAULT 'Not Booked',
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_sent_date VARCHAR(50) DEFAULT '';
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_followup1_date VARCHAR(50) DEFAULT '';
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_followup2_date VARCHAR(50) DEFAULT '';
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_followup_date VARCHAR(50) DEFAULT '';
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS ai_links JSONB DEFAULT '[]'::jsonb;

      CREATE INDEX IF NOT EXISTS idx_companies_rank ON companies(rank);
      CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
    `);

    // Check if companies table is empty
    const checkRes = await client.query('SELECT COUNT(*) FROM companies');
    const count = parseInt(checkRes.rows[0].count, 10);

    if (count === 0 || force) {
      console.log('Seeding PostgreSQL database with prospect records...');
      let initialData = [];

      if (fs.existsSync(JSON_BACKUP_PATH)) {
        try {
          initialData = JSON.parse(fs.readFileSync(JSON_BACKUP_PATH, 'utf-8'));
        } catch (e) {
          console.warn('Could not load prospects.json, falling back to CSV:', e.message);
        }
      }

      if (!initialData || initialData.length === 0) {
        initialData = parseCSVToData();
      }

      const deepseekMap = getDeepseekMap();
      const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      for (const comp of initialData) {
        const normName = normalize(comp.name);
        const deepseekUrl = comp.deepseekUrl || deepseekMap[normName] || '';
        const aiLinks = comp.aiLinks || (deepseekUrl ? [{ id: `ds_${comp.id || comp.rank}`, label: 'DeepSeek', platform: 'deepseek', url: deepseekUrl }] : []);

        await client.query(`
          INSERT INTO companies (
            id, rank, name, website, business_model, revenue, employees,
            priority, qualification, automation_opportunities, notes, stage, worked_by,
            last_contact_date, updated_at, ai_links
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            ai_links = EXCLUDED.ai_links,
            stage = EXCLUDED.stage,
            worked_by = EXCLUDED.worked_by,
            last_contact_date = EXCLUDED.last_contact_date,
            updated_at = EXCLUDED.updated_at
        `, [
          comp.id || `comp_${comp.rank}`,
          comp.rank,
          comp.name,
          comp.website || '',
          comp.businessModel || '',
          comp.revenue || '',
          comp.employees || '',
          comp.priority || 'B',
          comp.qualification || '',
          comp.automationOpportunities || '',
          comp.notes || '',
          comp.stage || 'To Do',
          comp.workedBy || '',
          comp.lastContactDate || '',
          comp.updatedAt || new Date().toISOString(),
          JSON.stringify(aiLinks)
        ]);

        const contactsList = comp.contacts || [];
        for (const c of contactsList) {
          await client.query(`
            INSERT INTO contacts (
              id, company_id, name, role, email, additional_emails, linkedin_url,
              linkedin_status, linkedin_connected_by, linkedin_last_contact_date,
              email_status, email_contacted_by, email_last_contact_date,
              appointment_status, notes, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              role = EXCLUDED.role,
              email = EXCLUDED.email,
              linkedin_url = EXCLUDED.linkedin_url,
              linkedin_status = EXCLUDED.linkedin_status,
              email_status = EXCLUDED.email_status,
              updated_at = EXCLUDED.updated_at
          `, [
            c.id,
            comp.id || `comp_${comp.rank}`,
            c.name,
            c.role || 'Key Decision Maker',
            c.email || '',
            c.additionalEmails || [],
            c.linkedinUrl || '',
            c.linkedinStatus || 'Not Started',
            c.linkedinConnectedBy || '',
            c.linkedinLastContactDate || '',
            c.emailStatus || 'Not Sent',
            c.emailContactedBy || '',
            c.emailLastContactDate || '',
            c.appointmentStatus || 'Not Booked',
            c.notes || '',
            c.updatedAt || new Date().toISOString()
          ]);
        }
      }
      console.log(`Successfully seeded ${initialData.length} companies into PostgreSQL database.`);
    }
  } catch (err) {
    console.error('Error initializing PostgreSQL database:', err);
    throw err;
  } finally {
    client.release();
  }
}

function mapCompanyFromDb(row, contacts = []) {
  let aiLinks = [];
  if (Array.isArray(row.ai_links)) {
    aiLinks = row.ai_links;
  } else if (typeof row.ai_links === 'string' && row.ai_links) {
    try { aiLinks = JSON.parse(row.ai_links); } catch(e) {}
  }
  if (aiLinks.length === 0 && row.deepseek_url) {
    aiLinks = [{ id: `ds_${row.id}`, label: 'DeepSeek', platform: 'deepseek', url: row.deepseek_url }];
  }

  return {
    id: row.id,
    rank: row.rank,
    name: row.name,
    website: row.website || '',
    deepseekUrl: row.deepseek_url || '',
    aiLinks,
    businessModel: row.business_model || '',
    revenue: row.revenue || '',
    employees: row.employees || '',
    priority: row.priority || 'B',
    qualification: row.qualification || '',
    automationOpportunities: row.automation_opportunities || '',
    notes: row.notes || '',
    stage: row.stage || 'To Do',
    workedBy: row.worked_by || '',
    lastContactDate: row.last_contact_date || '',
    contacts: contacts.map(c => ({
      id: c.id,
      companyId: c.company_id,
      name: c.name,
      role: c.role || 'Key Decision Maker',
      email: c.email || '',
      additionalEmails: c.additional_emails || [],
      linkedinUrl: c.linkedin_url || '',
      linkedinStatus: c.linkedin_status || 'Not Started',
      linkedinConnectedBy: c.linkedin_connected_by || '',
      linkedinLastContactDate: c.linkedin_last_contact_date || '',
      emailStatus: c.email_status || 'Not Sent',
      emailContactedBy: c.email_contacted_by || '',
      emailLastContactDate: c.email_last_contact_date || '',
      emailSentDate: c.email_sent_date || '',
      emailFollowup1Date: c.email_followup1_date || '',
      emailFollowup2Date: c.email_followup2_date || '',
      nextFollowupDate: c.next_followup_date || '',
      appointmentStatus: c.appointment_status || 'Not Booked',
      notes: c.notes || ''
    })),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : new Date().toISOString()
  };
}

async function getProspects() {
  const client = await pool.connect();
  try {
    const companiesRes = await client.query('SELECT * FROM companies ORDER BY rank ASC');
    const contactsRes = await client.query('SELECT * FROM contacts ORDER BY display_order ASC, created_at DESC, id ASC');

    const contactsByCompany = {};
    contactsRes.rows.forEach(c => {
      if (!contactsByCompany[c.company_id]) {
        contactsByCompany[c.company_id] = [];
      }
      contactsByCompany[c.company_id].push(c);
    });

    return companiesRes.rows.map(comp => mapCompanyFromDb(comp, contactsByCompany[comp.id] || []));
  } finally {
    client.release();
  }
}

async function getProspectById(idOrRank) {
  const client = await pool.connect();
  try {
    const isRank = !isNaN(parseInt(idOrRank, 10)) && String(parseInt(idOrRank, 10)) === String(idOrRank);
    const query = isRank
      ? 'SELECT * FROM companies WHERE rank = $1'
      : 'SELECT * FROM companies WHERE id = $1';

    const compRes = await client.query(query, [isRank ? parseInt(idOrRank, 10) : idOrRank]);
    if (compRes.rows.length === 0) return null;

    const company = compRes.rows[0];
    const contactsRes = await client.query('SELECT * FROM contacts WHERE company_id = $1 ORDER BY display_order ASC, created_at DESC, id ASC', [company.id]);

    return mapCompanyFromDb(company, contactsRes.rows);
  } finally {
    client.release();
  }
}

async function updateCompany(idOrRank, updates) {
  const client = await pool.connect();
  try {
    const isRank = !isNaN(parseInt(idOrRank, 10)) && String(parseInt(idOrRank, 10)) === String(idOrRank);
    const findQuery = isRank
      ? 'SELECT * FROM companies WHERE rank = $1'
      : 'SELECT * FROM companies WHERE id = $1';

    const existing = await client.query(findQuery, [isRank ? parseInt(idOrRank, 10) : idOrRank]);
    if (existing.rows.length === 0) return null;

    const company = existing.rows[0];
    const newStage = updates.stage !== undefined ? updates.stage : company.stage;
    const newWorkedBy = updates.workedBy !== undefined ? updates.workedBy : company.worked_by;
    const newLastContact = updates.lastContactDate !== undefined ? updates.lastContactDate : company.last_contact_date;
    const newNotes = updates.notes !== undefined ? updates.notes : company.notes;
    const newPriority = updates.priority !== undefined ? updates.priority : company.priority;
    const newWebsite = updates.website !== undefined ? updates.website : company.website;
    const newName = updates.name !== undefined ? updates.name : company.name;
    const newBusinessModel = updates.businessModel !== undefined ? updates.businessModel : company.business_model;
    const newRevenue = updates.revenue !== undefined ? updates.revenue : company.revenue;
    const newEmployees = updates.employees !== undefined ? updates.employees : company.employees;
    const newAutomation = updates.automationOpportunities !== undefined ? updates.automationOpportunities : company.automation_opportunities;
    const newQualification = updates.qualification !== undefined ? updates.qualification : company.qualification;
    const newAiLinks = updates.aiLinks !== undefined 
      ? JSON.stringify(updates.aiLinks) 
      : (company.ai_links ? JSON.stringify(company.ai_links) : '[]');

    await client.query(`
      UPDATE companies
      SET stage = $1, worked_by = $2, last_contact_date = $3, notes = $4, priority = $5,
          website = $6, name = $7, business_model = $8, revenue = $9, employees = $10,
          automation_opportunities = $11, qualification = $12, ai_links = $13::jsonb, updated_at = NOW()
      WHERE id = $14
    `, [
      newStage, newWorkedBy, newLastContact, newNotes, newPriority,
      newWebsite, newName, newBusinessModel, newRevenue, newEmployees,
      newAutomation, newQualification, newAiLinks, company.id
    ]);

    return await getProspectById(company.id);
  } finally {
    client.release();
  }
}

async function bulkUpdateCompanyStage(ids, newStage, workedBy, lastContactDate) {
  const client = await pool.connect();
  try {
    const today = lastContactDate || new Date().toISOString().split('T')[0];
    const res = await client.query(`
      UPDATE companies
      SET stage = $1,
          worked_by = COALESCE($2, worked_by),
          last_contact_date = $3,
          updated_at = NOW()
      WHERE id = ANY($4::varchar[])
      RETURNING id;
    `, [newStage, workedBy || null, today, ids]);
    return res.rows.map(r => r.id);
  } finally {
    client.release();
  }
}

async function addContact(idOrRank, contactData) {
  const client = await pool.connect();
  try {
    const isRank = !isNaN(parseInt(idOrRank, 10)) && String(parseInt(idOrRank, 10)) === String(idOrRank);
    const findQuery = isRank
      ? 'SELECT * FROM companies WHERE rank = $1'
      : 'SELECT * FROM companies WHERE id = $1';

    const compRes = await client.query(findQuery, [isRank ? parseInt(idOrRank, 10) : idOrRank]);
    if (compRes.rows.length === 0) return null;
    const company = compRes.rows[0];

    // Remove placeholder contacts (e.g. "Key Contact (To Identify)")
    await client.query(`
      DELETE FROM contacts 
      WHERE company_id = $1 AND (LOWER(name) LIKE '%to identify%' OR name = 'Key Contact (To Identify)')
    `, [company.id]);

    // Shift existing contacts down so the new contact is placed on TOP
    await client.query(`
      UPDATE contacts 
      SET display_order = display_order + 1 
      WHERE company_id = $1
    `, [company.id]);

    const newContactId = `contact_${company.rank}_${Date.now().toString().slice(-6)}`;

    await client.query(`
      INSERT INTO contacts (
        id, company_id, name, role, email, additional_emails, linkedin_url,
        linkedin_status, linkedin_connected_by, linkedin_last_contact_date,
        email_status, email_contacted_by, email_last_contact_date,
        appointment_status, notes, display_order, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, NOW(), NOW())
    `, [
      newContactId,
      company.id,
      contactData.name || 'New Contact',
      contactData.role || 'Key Decision Maker',
      contactData.email || '',
      contactData.additionalEmails || [],
      contactData.linkedinUrl || '',
      contactData.linkedinStatus || 'Not Started',
      contactData.linkedinConnectedBy || '',
      contactData.linkedinLastContactDate || '',
      contactData.emailStatus || 'Not Sent',
      contactData.emailContactedBy || '',
      contactData.emailLastContactDate || '',
      contactData.appointmentStatus || 'Not Booked',
      contactData.notes || ''
    ]);

    await client.query('UPDATE companies SET updated_at = NOW() WHERE id = $1', [company.id]);
    return await getProspectById(company.id);
  } finally {
    client.release();
  }
}

async function updateContact(idOrRank, contactId, contactData) {
  const client = await pool.connect();
  try {
    const isRank = !isNaN(parseInt(idOrRank, 10)) && String(parseInt(idOrRank, 10)) === String(idOrRank);
    const findQuery = isRank
      ? 'SELECT * FROM companies WHERE rank = $1'
      : 'SELECT * FROM companies WHERE id = $1';

    const compRes = await client.query(findQuery, [isRank ? parseInt(idOrRank, 10) : idOrRank]);
    if (compRes.rows.length === 0) return null;
    const company = compRes.rows[0];

    const contactRes = await client.query('SELECT * FROM contacts WHERE id = $1 AND company_id = $2', [contactId, company.id]);
    if (contactRes.rows.length === 0) return null;

    const existing = contactRes.rows[0];
    const name = contactData.name !== undefined ? contactData.name : existing.name;
    const role = contactData.role !== undefined ? contactData.role : existing.role;
    const email = contactData.email !== undefined ? contactData.email : existing.email;
    const linkedinUrl = contactData.linkedinUrl !== undefined ? contactData.linkedinUrl : existing.linkedin_url;
    const linkedinStatus = contactData.linkedinStatus !== undefined ? contactData.linkedinStatus : existing.linkedin_status;
    const emailStatus = contactData.emailStatus !== undefined ? contactData.emailStatus : existing.email_status;
    const appointmentStatus = contactData.appointmentStatus !== undefined ? contactData.appointmentStatus : existing.appointment_status;
    const notes = contactData.notes !== undefined ? contactData.notes : existing.notes;
    const emailSentDate = contactData.emailSentDate !== undefined ? contactData.emailSentDate : (existing.email_sent_date || '');
    const emailFollowup1Date = contactData.emailFollowup1Date !== undefined ? contactData.emailFollowup1Date : (existing.email_followup1_date || '');
    const emailFollowup2Date = contactData.emailFollowup2Date !== undefined ? contactData.emailFollowup2Date : (existing.email_followup2_date || '');
    const nextFollowupDate = contactData.nextFollowupDate !== undefined ? contactData.nextFollowupDate : (existing.next_followup_date || '');
    const emailLastContactDate = contactData.emailLastContactDate !== undefined ? contactData.emailLastContactDate : (existing.email_last_contact_date || '');
    const linkedinLastContactDate = contactData.linkedinLastContactDate !== undefined ? contactData.linkedinLastContactDate : (existing.linkedin_last_contact_date || '');

    await client.query(`
      UPDATE contacts
      SET name = $1, role = $2, email = $3, linkedin_url = $4, linkedin_status = $5,
          email_status = $6, appointment_status = $7, notes = $8,
          email_sent_date = $9, email_followup1_date = $10, email_followup2_date = $11, next_followup_date = $12,
          email_last_contact_date = $13, linkedin_last_contact_date = $14,
          updated_at = NOW()
      WHERE id = $15 AND company_id = $16
    `, [
      name, role, email, linkedinUrl, linkedinStatus, 
      emailStatus, appointmentStatus, notes,
      emailSentDate, emailFollowup1Date, emailFollowup2Date, nextFollowupDate,
      emailLastContactDate, linkedinLastContactDate,
      contactId, company.id
    ]);

    await client.query('UPDATE companies SET updated_at = NOW() WHERE id = $1', [company.id]);
    return await getProspectById(company.id);
  } finally {
    client.release();
  }
}

async function deleteContact(idOrRank, contactId) {
  const client = await pool.connect();
  try {
    const isRank = !isNaN(parseInt(idOrRank, 10)) && String(parseInt(idOrRank, 10)) === String(idOrRank);
    const findQuery = isRank
      ? 'SELECT * FROM companies WHERE rank = $1'
      : 'SELECT * FROM companies WHERE id = $1';

    const compRes = await client.query(findQuery, [isRank ? parseInt(idOrRank, 10) : idOrRank]);
    if (compRes.rows.length === 0) return null;
    const company = compRes.rows[0];

    await client.query('DELETE FROM contacts WHERE id = $1 AND company_id = $2', [contactId, company.id]);
    await client.query('UPDATE companies SET updated_at = NOW() WHERE id = $1', [company.id]);

    return await getProspectById(company.id);
  } finally {
    client.release();
  }
}

function exportToCSV(companies) {
  const rows = [];

  companies.forEach(company => {
    let aiLinks = Array.isArray(company.aiLinks) ? [...company.aiLinks] : [];
    if (aiLinks.length === 0 && company.deepseekUrl) {
      aiLinks = [{ label: 'DeepSeek', url: company.deepseekUrl }];
    }
    const aiLinksStr = aiLinks
      .map(a => (a.label ? `${a.label}: ${a.url}` : a.url))
      .filter(Boolean)
      .join('\n');

    const contacts = (company.contacts && company.contacts.length > 0)
      ? company.contacts
      : [null];

    contacts.forEach(c => {
      const cName = c ? (c.name || '') : '';
      const cEmail = c ? (c.email || '') : '';
      const cRole = c ? (c.role || '') : '';
      const cLi = c ? (c.linkedinUrl || '') : '';
      const cLiStatus = c ? (c.linkedinStatus || 'Not Started') : 'Not Started';
      const cLiConnected = ['Connected', 'yes', 'true'].includes(cLiStatus.toLowerCase())
        ? 'Connected'
        : (cLiStatus.toLowerCase().includes('pending') ? 'Pending' : '');
      const cLiOf = c ? (c.linkedinConnectedBy || company.workedBy || '') : (company.workedBy || '');
      const cEmailStatus = c ? (c.emailStatus || 'Not Sent') : 'Not Sent';
      const cEmailContacted = ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied'].includes(cEmailStatus) ? 'Yes' : 'No';
      const cEmailBy = c ? (c.emailContactedBy || company.workedBy || '') : (company.workedBy || '');

      rows.push({
        'Rank': company.rank,
        'Name': cName,
        'Email': cEmail,
        'Company': company.name,
        'Role': cRole,
        'Website': company.website,
        'Linkedin': cLi,
        'LinkedIn Connected': cLiConnected,
        'LinkedIn Of': cLiOf,
        'Email Contacted': cEmailContacted,
        'Email Contacted By': cEmailBy,
        'Stage': company.stage,
        'Worked By': company.workedBy,
        'Last Contact': company.lastContactDate,
        'Priority': company.priority,
        'Revenue': company.revenue,
        'Employees': company.employees,
        'Business model': company.businessModel,
        'Automation Opportunities': company.automationOpportunities,
        'Qualification': company.qualification,
        'AI Links': aiLinksStr,
        'Notes': company.notes
      });
    });
  });

  return stringify(rows, { header: true });
}

async function reorderContacts(idOrRank, orderedContactIds) {
  const client = await pool.connect();
  try {
    const isRank = !isNaN(parseInt(idOrRank, 10)) && String(parseInt(idOrRank, 10)) === String(idOrRank);
    const findQuery = isRank
      ? 'SELECT * FROM companies WHERE rank = $1'
      : 'SELECT * FROM companies WHERE id = $1';

    const compRes = await client.query(findQuery, [isRank ? parseInt(idOrRank, 10) : idOrRank]);
    if (compRes.rows.length === 0) return null;
    const company = compRes.rows[0];

    if (Array.isArray(orderedContactIds)) {
      for (let i = 0; i < orderedContactIds.length; i++) {
        await client.query(
          'UPDATE contacts SET display_order = $1, updated_at = NOW() WHERE id = $2 AND company_id = $3',
          [i, orderedContactIds[i], company.id]
        );
      }
    }

    await client.query('UPDATE companies SET updated_at = NOW() WHERE id = $1', [company.id]);
    return await getProspectById(company.id);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
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
};
