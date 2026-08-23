const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const CSV_PATHS = [
  path.resolve(__dirname, '../Copy of UK_residential_property_automation_prospects_100.xlsx - 100 Prospects (1).csv'),
  path.resolve(__dirname, '../../Copy of UK_residential_property_automation_prospects_100.xlsx - 100 Prospects (1).csv')
];
const CSV_PATH = CSV_PATHS.find(p => fs.existsSync(p)) || CSV_PATHS[0];
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'prospects.json');

const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/[^\s,\n]+/g;

function cleanString(str) {
  if (!str) return '';
  return str.trim();
}

function parseCSVToData() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV file not found at ${CSV_PATH}`);
  }

  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  const companies = [];

  records.forEach((r, idx) => {
    const rank = parseInt(r['Rank'] || idx + 1, 10);
    const name = cleanString(r['Company']);
    if (!name) return;

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

    // Extract all emails from both Email and LinkedIn fields
    const emailsInEmail = rawEmail.match(emailRegex) || [];
    const emailsInLi = rawLi.match(emailRegex) || [];
    const allEmails = Array.from(new Set([...emailsInEmail, ...emailsInLi]));

    // Extract all LinkedIn links
    const liInLi = rawLi.match(linkedinRegex) || [];
    const liInEmail = rawEmail.match(linkedinRegex) || [];
    const allLi = Array.from(new Set([...liInLi, ...liInEmail]));

    // Extract people
    let peopleNames = [];
    const rawPeopleNormalized = rawPeople.replace(/\r\n/g, '\n');
    if (rawPeopleNormalized.includes('\n')) {
      peopleNames = rawPeopleNormalized.split('\n').map(p => p.trim().replace(/^[,;\s]+|[,;\s]+$/g, '')).filter(Boolean);
    } else if (rawPeopleNormalized.includes(',')) {
      peopleNames = rawPeopleNormalized.split(',').map(p => p.trim()).filter(Boolean);
    } else if (rawPeopleNormalized) {
      peopleNames = [rawPeopleNormalized];
    }

    const contacts = [];

    if (peopleNames.length > 0) {
      peopleNames.forEach((personName, pIdx) => {
        const nameParts = personName.toLowerCase().split(/\s+/).filter(w => !['mirpm', 'mnaea', 'mrics', 'bsc', 'hons', 'mrrics'].includes(w));
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';

        // Match email
        let matchedEmail = '';
        if (allEmails.length === 1 && peopleNames.length === 1) {
          matchedEmail = allEmails[0];
        } else if (allEmails.length > 0) {
          const found = allEmails.find(e => {
            const el = e.toLowerCase();
            return (firstName.length > 2 && el.includes(firstName)) || (lastName.length > 2 && el.includes(lastName));
          });
          if (found) {
            matchedEmail = found;
          } else if (peopleNames.length === allEmails.length) {
            matchedEmail = allEmails[pIdx];
          }
        }

        // Match LinkedIn
        let matchedLi = '';
        if (allLi.length === 1 && peopleNames.length === 1) {
          matchedLi = allLi[0];
        } else if (allLi.length > 0) {
          const foundLi = allLi.find(l => {
            const ll = l.toLowerCase();
            return (firstName.length > 2 && ll.includes(firstName)) || (lastName.length > 2 && ll.includes(lastName));
          });
          if (foundLi) {
            matchedLi = foundLi;
          } else if (allLi.length === peopleNames.length) {
            matchedLi = allLi[pIdx];
          }
        }

        // Determine LinkedIn outreach status
        let cLiStatus = 'Not Started';
        let cLiBy = '';
        let cLiDate = '';

        if (matchedLi) {
          if (rawLiConn.toLowerCase() === 'connected' || rawLiConn.toLowerCase() === 'yes') {
            cLiStatus = 'Connected';
            cLiBy = rawLiOf || 'Fil';
            cLiDate = '2026-08-20';
          } else if (rawLiConn.toLowerCase() === 'pending') {
            cLiStatus = 'Pending';
            cLiBy = rawLiOf || 'Fil';
            cLiDate = '2026-08-20';
          } else {
            cLiStatus = 'Not Connected';
          }
        }

        // Determine Email outreach status
        let cEmailStatus = 'Not Sent';
        let cEmailBy = '';
        let cEmailDate = '';

        if (matchedEmail && ['yes', 'true', 'sent'].includes(rawEmailCont.toLowerCase())) {
          cEmailStatus = 'Sent';
          cEmailBy = rawEmailBy || 'Fil';
          cEmailDate = '2026-08-20';
        }

        // Determine Role
        let role = 'Key Decision Maker';
        if (personName.toLowerCase().includes('ceo') || rawPeople.toLowerCase().includes('ceo')) role = 'CEO / Executive';
        if (notes.toLowerCase().includes(personName.toLowerCase() + ' is the founder') || (notes.toLowerCase().includes('founder') && personName.toLowerCase().includes('ackrill'))) {
          role = 'Founder';
        }
        if (personName.toLowerCase().includes('phil johns')) role = 'Managing Director / Key Contact';
        if (personName.toLowerCase().includes('sam mitchell')) role = 'CEO / Primary Contact';

        contacts.push({
          id: `contact_${rank}_${pIdx + 1}`,
          name: personName,
          role: role,
          email: matchedEmail,
          additionalEmails: allEmails.filter(e => e !== matchedEmail),
          linkedinUrl: matchedLi,
          linkedinStatus: cLiStatus,
          linkedinConnectedBy: cLiBy,
          linkedinLastContactDate: cLiDate,
          emailStatus: cEmailStatus,
          emailContactedBy: cEmailBy,
          emailLastContactDate: cEmailDate,
          appointmentStatus: 'Not Booked',
          notes: ''
        });
      });
    } else {
      const defaultEmail = allEmails[0] || '';
      const defaultLi = allLi[0] || '';

      let cLiStatus = 'Not Started';
      let cLiBy = '';
      if (defaultLi) {
        if (rawLiConn.toLowerCase() === 'connected' || rawLiConn.toLowerCase() === 'yes') {
          cLiStatus = 'Connected';
          cLiBy = rawLiOf || 'Fil';
        } else if (rawLiConn.toLowerCase() === 'pending') {
          cLiStatus = 'Pending';
          cLiBy = rawLiOf || 'Fil';
        } else {
          cLiStatus = 'Not Connected';
        }
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

    // Determine overall company appointment setting stage
    let overallStage = 'To Research';
    const anyConnected = contacts.some(c => c.linkedinStatus === 'Connected');
    const anyPending = contacts.some(c => c.linkedinStatus === 'Pending');
    const anyEmailed = contacts.some(c => c.emailStatus === 'Sent' || c.emailStatus === 'Follow-up 1' || c.emailStatus === 'Replied');
    const anyBooked = contacts.some(c => c.appointmentStatus === 'Appointment Booked');

    if (anyBooked) {
      overallStage = 'Appointment Booked';
    } else if (anyConnected && anyEmailed) {
      overallStage = 'In Discussion (Multi-Channel)';
    } else if (anyConnected) {
      overallStage = 'LinkedIn Connected';
    } else if (anyEmailed && anyPending) {
      overallStage = 'Multi-Channel Outreach (Email & LI)';
    } else if (anyEmailed) {
      overallStage = 'Email Sent';
    } else if (anyPending) {
      overallStage = 'LinkedIn Pending';
    } else if (contacts.some(c => c.email || c.linkedinUrl)) {
      overallStage = 'Ready for Outreach';
    }

    companies.push({
      id: `comp_${rank}`,
      rank: rank,
      name: name,
      website: website,
      businessModel: businessModel,
      revenue: revenue,
      employees: employees,
      priority: priority.toUpperCase(),
      qualification: qualification,
      automationOpportunities: automationOpps,
      notes: notes,
      stage: overallStage,
      contacts: contacts,
      updatedAt: new Date().toISOString()
    });
  });

  return companies;
}

function initDatabase(force = false) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH) && !force) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Existing db corrupted, re-parsing CSV...', e);
    }
  }

  const initialData = parseCSVToData();
  saveDatabase(initialData);
  console.log(`Initialized database with ${initialData.length} companies at ${DB_PATH}`);
  return initialData;
}

function getDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    return initDatabase(true);
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e) {
    return initDatabase(true);
  }
}

function saveDatabase(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

function exportToCSV(data) {
  const rows = data.map(company => {
    const people = company.contacts.map(c => c.name).join('\n');
    const emails = company.contacts.map(c => c.email).filter(Boolean).join('\n');
    const lis = company.contacts.map(c => c.linkedinUrl).filter(Boolean).join('\n');
    
    // Summary status
    const liStatuses = company.contacts.map(c => c.linkedinStatus).filter(s => s !== 'Not Started');
    const liConnected = liStatuses.includes('Connected') ? 'Connected' : (liStatuses.includes('Pending') ? 'Pending' : '');
    const liOf = company.contacts.map(c => c.linkedinConnectedBy).filter(Boolean)[0] || '';
    
    const emailStatuses = company.contacts.map(c => c.emailStatus);
    const emailContacted = emailStatuses.some(s => ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied'].includes(s)) ? 'Yes' : 'No';
    const emailBy = company.contacts.map(c => c.emailContactedBy).filter(Boolean)[0] || '';

    return {
      'Rank': company.rank,
      'Company': company.name,
      'Revenue / revenue status': company.revenue,
      'Employees': company.employees,
      'Business model': company.businessModel,
      'Likely automation opportunities': company.automationOpportunities,
      'Priority': company.priority,
      'Qualification': company.qualification,
      'CEO / CTO / VP': people,
      'E-mail': emails,
      'Linkedin': lis,
      'LinkedIn Connected': liConnected,
      'LinkedIn Of': liOf,
      'Email Contacted': emailContacted,
      'Email Contacted By': emailBy,
      'Website': company.website,
      'Notes': company.notes
    };
  });

  return stringify(rows, { header: true });
}

module.exports = {
  CSV_PATH,
  DB_PATH,
  parseCSVToData,
  initDatabase,
  getDatabase,
  saveDatabase,
  exportToCSV
};
