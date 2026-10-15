// Usage: pnpm run import "path/to/Prospects.csv"
const path = require('path');
const { pool, initDatabase, importProspectsFromCSV } = require('./db');

async function main() {
  const csvArg = process.argv[2];
  if (!csvArg) {
    console.error('Usage: pnpm run import <path-to-prospects.csv>');
    process.exit(1);
  }

  await initDatabase();
  const count = await importProspectsFromCSV(path.resolve(csvArg));
  console.log(`Imported ${count} prospects.`);
}

main()
  .catch(err => {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
