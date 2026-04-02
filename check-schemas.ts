import { Client } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const SOURCE_URL = "postgresql://neondb_owner:npg_Xp2nuVN0lrwH@ep-sparkling-star-acxm6azi-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const TARGET_URL = "postgresql://neondb_owner:npg_Xp2nuVN0lrwH@ep-winter-unit-acsitpn6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function compare() {
  const c1 = new Client(SOURCE_URL);
  const c2 = new Client(TARGET_URL);
  try {
    await c1.connect();
    await c2.connect();
    
    const query = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'billings' ORDER BY column_name";
    
    const res1 = await c1.query(query);
    const res2 = await c2.query(query);
    
    console.log('--- SOURCE (Restore) ---');
    console.table(res1.rows);
    
    console.log('\n--- TARGET (Production) ---');
    console.table(res2.rows);
    
    await c1.end();
    await c2.end();
  } catch (e) {
    console.error(e);
  }
}

compare();
