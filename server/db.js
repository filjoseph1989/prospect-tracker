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
  `);
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

module.exports = {
  pool,
  initDatabase,
  importProspectsFromCSV,
  getProspects,
};
