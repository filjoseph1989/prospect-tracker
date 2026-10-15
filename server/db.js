require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fil:@localhost:5432/prospect_tracker_v2'
});

// CSV header -> prospects column. Header names match the Senpai "Prospects" sheet export.
const CSV_COLUMNS = {
  '#': 'rank',
  'Company': 'company',
  'Segment': 'segment',
  'Location': 'location',
  'Website': 'website',
  'Est. revenue (our estimate)': 'est_revenue',
  'Observation (from source)': 'observation',
  'Inference (our assessment)': 'inference',
  'Suggested Senpai service': 'suggested_service',
  'Contact': 'contact',
  'Source': 'source',
  'Evidence (A/B)': 'evidence',
  'Fit (2–5)': 'fit',
  'Max revenue (£M)': 'max_revenue_m',
  'Outreach status': 'outreach_status',
  'Date contacted': 'date_contacted',
  'Reply / notes': 'reply_notes',
  'Next step': 'next_step',
};

// Matches the "Outreach status" drop-down on the Prospects sheet, in its order
const OUTREACH_STATUSES = [
  'Not contacted',
  'Verified',
  'Contacted',
  'Replied',
  'Call booked',
  'Handed to Panu',
  'Not interested',
  'Bad data',
];

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prospects (
      id SERIAL PRIMARY KEY,
      rank INTEGER UNIQUE NOT NULL,
      company VARCHAR(255) NOT NULL,
      segment VARCHAR(255) DEFAULT '',
      location VARCHAR(255) DEFAULT '',
      website TEXT DEFAULT '',
      est_revenue VARCHAR(100) DEFAULT '',
      observation TEXT DEFAULT '',
      inference TEXT DEFAULT '',
      suggested_service TEXT DEFAULT '',
      contact TEXT DEFAULT '',
      source TEXT DEFAULT '',
      evidence VARCHAR(10) DEFAULT '',
      fit SMALLINT,
      max_revenue_m NUMERIC(10, 2),
      outreach_status VARCHAR(100) DEFAULT 'Not contacted',
      date_contacted DATE,
      reply_notes TEXT DEFAULT '',
      next_step TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS brief_items (
      id SERIAL PRIMARY KEY,
      position INTEGER UNIQUE NOT NULL,
      section TEXT,
      label TEXT DEFAULT '',
      body TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS summary_items (
      id SERIAL PRIMARY KEY,
      position INTEGER UNIQUE NOT NULL,
      kind VARCHAR(20) NOT NULL,
      label TEXT DEFAULT '',
      body TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS excluded_items (
      id SERIAL PRIMARY KEY,
      position INTEGER UNIQUE NOT NULL,
      kind VARCHAR(20) NOT NULL,
      label TEXT DEFAULT '',
      body TEXT DEFAULT ''
    );
  `);
}

// Replaces a whole single-document table (brief, summary) inside one transaction.
async function replaceDocumentRows(table, columns, items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${table}`);
    for (const item of items) {
      await client.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})`,
        columns.map(c => item[c])
      );
    }
    await client.query('COMMIT');
    return items.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Brief sheet layout: title row, intro row, then numbered section headings ("1. Who we are")
// each followed by label/body rows. Title and intro are stored with section = NULL.
function parseBriefCSV(csvPath) {
  const rows = parse(fs.readFileSync(csvPath, 'utf-8'), {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }).filter(r => r.some(cell => cell !== ''));

  if (rows.length < 2) throw new Error(`Brief CSV ${csvPath} has too few rows`);

  const items = [
    { section: null, label: 'title', body: rows[0][0] },
    { section: null, label: 'intro', body: rows[1][0] },
  ];
  let section = null;
  rows.slice(2).forEach(([label = '', body = '']) => {
    if (/^\d+\.\s/.test(label) && !body) {
      section = label;
      return;
    }
    if (!section) throw new Error(`Brief row "${label}" appears before any section heading`);
    items.push({ section, label, body });
  });
  return items.map((item, idx) => ({ ...item, position: idx }));
}

// The brief is one document, so a re-import replaces it wholesale.
async function importBriefFromCSV(csvPath) {
  return replaceDocumentRows('brief_items', ['position', 'section', 'label', 'body'], parseBriefCSV(csvPath));
}

async function getBrief() {
  const { rows } = await pool.query('SELECT section, label, body FROM brief_items ORDER BY position ASC');
  const brief = { title: '', intro: '', sections: [] };
  rows.forEach(row => {
    if (row.section === null) {
      brief[row.label] = row.body;
      return;
    }
    let current = brief.sections[brief.sections.length - 1];
    if (!current || current.title !== row.section) {
      current = { title: row.section, items: [] };
      brief.sections.push(current);
    }
    current.items.push({ label: row.label, body: row.body });
  });
  return brief;
}

// The sheet export has a title/notes block above the real header row, so find the row starting with '#'.
function parseProspectsCSV(csvPath) {
  const rows = parse(fs.readFileSync(csvPath, 'utf-8'), {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  const headerIdx = rows.findIndex(r => r[0] === '#');
  if (headerIdx === -1) throw new Error(`No header row starting with '#' found in ${csvPath}`);

  const header = rows[headerIdx];
  const missing = Object.keys(CSV_COLUMNS).filter(h => !header.includes(h));
  if (missing.length) throw new Error(`CSV is missing columns: ${missing.join(', ')}`);

  return rows.slice(headerIdx + 1)
    .filter(r => /^\d+$/.test(r[0]))
    .map(r => {
      const record = {};
      header.forEach((h, i) => {
        if (CSV_COLUMNS[h]) record[CSV_COLUMNS[h]] = r[i] ?? '';
      });
      record.rank = parseInt(record.rank, 10);
      record.fit = record.fit === '' ? null : parseInt(record.fit, 10);
      record.max_revenue_m = record.max_revenue_m === '' ? null : parseFloat(record.max_revenue_m);
      record.date_contacted = record.date_contacted || null;
      record.outreach_status = record.outreach_status || 'Not contacted';
      return record;
    });
}

// Upserts by rank so re-importing an updated sheet refreshes rows instead of duplicating them.
async function importProspectsFromCSV(csvPath) {
  const records = parseProspectsCSV(csvPath);
  const columns = Object.values(CSV_COLUMNS);
  const updates = columns.filter(c => c !== 'rank').map(c => `${c} = EXCLUDED.${c}`).join(', ');
  const sql = `
    INSERT INTO prospects (${columns.join(', ')})
    VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
    ON CONFLICT (rank) DO UPDATE SET ${updates}, updated_at = NOW()
  `;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const record of records) {
      await client.query(sql, columns.map(c => record[c]));
    }
    await client.query('COMMIT');
    return records.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getProspects() {
  const { rows } = await pool.query(`
    SELECT id, rank, company, segment, location, website, est_revenue, observation, inference,
           suggested_service, contact, source, evidence, fit,
           max_revenue_m::float AS max_revenue_m, outreach_status,
           TO_CHAR(date_contacted, 'YYYY-MM-DD') AS date_contacted, reply_notes, next_step
    FROM prospects
    ORDER BY rank ASC
  `);
  return rows;
}

// Returns the updated status, or null when no prospect has that id
async function updateProspectStatus(id, status) {
  if (!OUTREACH_STATUSES.includes(status)) {
    const err = new Error(`Unknown outreach status: ${status}`);
    err.statusCode = 400;
    throw err;
  }
  const { rows } = await pool.query(
    'UPDATE prospects SET outreach_status = $1, updated_at = NOW() WHERE id = $2 RETURNING outreach_status',
    [status, id]
  );
  return rows[0]?.outreach_status ?? null;
}

// The Summary sheet's counts are live formulas over the Prospects sheet, so only its fixed text is
// stored (title, fit meanings, notes); getSummary recomputes the counts from prospects. The status
// list comes from OUTREACH_STATUSES, so the sheet's status block is skipped.
const SUMMARY_HEADINGS = [
  { prefix: 'Checks', kind: null },
  { prefix: 'Fit score', kind: 'fit' },
  { prefix: 'Segment', kind: null },
  { prefix: 'Outreach progress', kind: null },
  { prefix: 'How the list was built', kind: 'note' },
];

function parseSummaryCSV(csvPath) {
  const rows = parse(fs.readFileSync(csvPath, 'utf-8'), {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }).filter(r => r.some(cell => cell !== ''));

  const items = [{ kind: 'title', label: '', body: rows[0][0] }];
  const seen = new Set();
  let kind = null;
  rows.slice(1).forEach(([label = '', value = '', meaning = '']) => {
    const heading = SUMMARY_HEADINGS.find(h => label.startsWith(h.prefix));
    if (heading) {
      seen.add(heading.prefix);
      kind = heading.kind;
      if (kind === 'note') items.push({ kind: 'note_title', label: '', body: label });
      return;
    }
    if (kind === 'fit') items.push({ kind, label, body: meaning });
    if (kind === 'note') items.push({ kind, label, body: value });
  });

  const missing = SUMMARY_HEADINGS.filter(h => !seen.has(h.prefix)).map(h => h.prefix);
  if (missing.length) throw new Error(`Summary CSV is missing sections: ${missing.join(', ')}`);
  return items.map((item, idx) => ({ ...item, position: idx }));
}

async function importSummaryFromCSV(csvPath) {
  return replaceDocumentRows('summary_items', ['position', 'kind', 'label', 'body'], parseSummaryCSV(csvPath));
}

async function getSummary() {
  const [{ rows: items }, { rows: [checks] }, { rows: fitCounts }, { rows: segments }, { rows: statusCounts }] = await Promise.all([
    pool.query('SELECT kind, label, body FROM summary_items ORDER BY position ASC'),
    pool.query(`
      SELECT COUNT(*)::int AS total,
             MAX(max_revenue_m)::float AS max_revenue,
             COUNT(*) FILTER (WHERE max_revenue_m > 50)::int AS above_cap,
             COUNT(*) FILTER (WHERE max_revenue_m = 50)::int AS at_cap,
             COUNT(*) FILTER (WHERE evidence = 'A')::int AS evidence_a,
             COUNT(*) FILTER (WHERE evidence = 'B')::int AS evidence_b,
             COUNT(*) FILTER (WHERE contact LIKE '%†%')::int AS personal_email,
             COUNT(*) FILTER (WHERE contact NOT LIKE '%@%')::int AS no_email
      FROM prospects
    `),
    pool.query('SELECT fit, COUNT(*)::int AS count FROM prospects GROUP BY fit'),
    pool.query('SELECT segment, COUNT(*)::int AS count FROM prospects GROUP BY segment ORDER BY count DESC, segment ASC'),
    pool.query('SELECT outreach_status AS status, COUNT(*)::int AS count FROM prospects GROUP BY outreach_status'),
  ]);

  const fitCountMap = Object.fromEntries(fitCounts.map(r => [String(r.fit), r.count]));
  const statusCountMap = Object.fromEntries(statusCounts.map(r => [r.status, r.count]));
  // Statuses imported from outside the drop-down still need to be counted somewhere
  const extraStatuses = Object.keys(statusCountMap).filter(s => !OUTREACH_STATUSES.includes(s));

  return {
    title: items.find(i => i.kind === 'title')?.body || '',
    total: checks.total,
    checks: [
      { label: 'Companies in the list', value: checks.total },
      { label: 'Highest estimated revenue', value: checks.max_revenue == null ? '–' : `£${checks.max_revenue.toFixed(1)}M` },
      { label: 'Rows with estimated max above £50M', value: checks.above_cap, tone: checks.above_cap > 0 ? 'bad' : 'good' },
      { label: 'Rows with estimated max exactly at £50M (at the limit)', value: checks.at_cap, tone: checks.at_cap > 0 ? 'warn' : 'good' },
      { label: 'Evidence A: company website read', value: checks.evidence_a },
      { label: 'Evidence B: third-party directory', value: checks.evidence_b },
      { label: 'Personal-name email address (†)', value: checks.personal_email },
      { label: 'No email address (phone or form only)', value: checks.no_email },
    ],
    fit: items
      .filter(i => i.kind === 'fit')
      .map(i => ({ score: Number(i.label), meaning: i.body, count: fitCountMap[i.label] || 0 })),
    segments,
    statuses: [...OUTREACH_STATUSES, ...extraStatuses].map(status => ({ status, count: statusCountMap[status] || 0 })),
    notesTitle: items.find(i => i.kind === 'note_title')?.body || '',
    notes: items.filter(i => i.kind === 'note').map(i => ({ label: i.label, body: i.body })),
  };
}

// Excluded sheet: a title row, then a "Company | Reason" header, then one row per excluded company
// (some rows name several small companies together).
function parseExcludedCSV(csvPath) {
  const rows = parse(fs.readFileSync(csvPath, 'utf-8'), {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }).filter(r => r.some(cell => cell !== ''));

  const headerIdx = rows.findIndex(r => r[0] === 'Company' && r[1] === 'Reason');
  if (headerIdx === -1) throw new Error(`No "Company | Reason" header row found in ${csvPath}`);

  const items = [{ kind: 'title', label: '', body: rows[0][0] }];
  rows.slice(headerIdx + 1).forEach(([company = '', reason = '']) => {
    items.push({ kind: 'company', label: company, body: reason });
  });
  return items.map((item, idx) => ({ ...item, position: idx }));
}

async function importExcludedFromCSV(csvPath) {
  return replaceDocumentRows('excluded_items', ['position', 'kind', 'label', 'body'], parseExcludedCSV(csvPath));
}

async function getExcluded() {
  const { rows } = await pool.query('SELECT kind, label, body FROM excluded_items ORDER BY position ASC');
  return {
    title: rows.find(r => r.kind === 'title')?.body || '',
    companies: rows.filter(r => r.kind === 'company').map(r => ({ company: r.label, reason: r.body })),
  };
}

module.exports = {
  pool,
  initDatabase,
  OUTREACH_STATUSES,
  importProspectsFromCSV,
  getProspects,
  updateProspectStatus,
  importBriefFromCSV,
  getBrief,
  importSummaryFromCSV,
  getSummary,
  importExcludedFromCSV,
  getExcluded,
};
