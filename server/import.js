// Usage: pnpm run import "path/to/Prospects.csv"
//        pnpm run import:brief "path/to/Brief.csv"
//        pnpm run import:summary "path/to/Summary.csv"
const path = require('path');
const { pool, initDatabase, importProspectsFromCSV, importBriefFromCSV, importSummaryFromCSV } = require('./db');

const IMPORTERS = {
  prospects: importProspectsFromCSV,
  brief: importBriefFromCSV,
  summary: importSummaryFromCSV,
};

async function main() {
  const [kind, csvArg] = process.argv.slice(2);
  if (!IMPORTERS[kind] || !csvArg) {
    console.error('Usage: node server/import.js <prospects|brief> <path-to-csv>');
    process.exit(1);
  }

  await initDatabase();
  const count = await IMPORTERS[kind](path.resolve(csvArg));
  console.log(`Imported ${count} ${kind} rows.`);
}

main()
  .catch(err => {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
