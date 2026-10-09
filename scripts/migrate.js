import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from '../src/db/pool.js';

try {
  const sql = await readFile(
    new URL('../src/db/migrations/001_initial.sql', import.meta.url),
    'utf8'
  );

  await pool.query(sql);
  console.log('Migration 001 applied successfully.');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}