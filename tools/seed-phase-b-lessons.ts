import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database/bazi.sqlite');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const insert = db.prepare('INSERT OR IGNORE INTO lessons (id, title_cn) VALUES (?, ?)');

const newLessons = [
  [8, '日元根氣與強弱進階'],
  [9, '格局取用：月令與古典用神'],
  [10, '八字體用觀念'],
  [11, '趨吉避凶實踐'],
] as const;

const run = db.transaction(() => {
  for (const [id, title] of newLessons) {
    const result = insert.run(id, title);
    console.log(`Lesson ${id} (${title}): ${result.changes > 0 ? 'inserted' : 'already exists'}`);
  }
});

run();

const rows = db.prepare('SELECT id, title_cn FROM lessons ORDER BY id').all() as Array<{ id: number; title_cn: string }>;
console.log('\nAll lessons in DB:');
rows.forEach((row) => console.log(`  ${row.id}: ${row.title_cn}`));

db.close();
