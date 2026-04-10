import dotenv from 'dotenv';
dotenv.config();
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log('Database connected:', result);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

test();
