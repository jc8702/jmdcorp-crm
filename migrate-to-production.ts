import { Client } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

// Configurações dos bancos
const SOURCE_URL = "postgresql://neondb_owner:npg_Xp2nuVN0lrwH@ep-sparkling-star-acxm6azi-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const TARGET_URL = "postgresql://neondb_owner:npg_Xp2nuVN0lrwH@ep-winter-unit-acsitpn6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrateData() {
  const source = new Client(SOURCE_URL);
  const target = new Client(TARGET_URL);

  console.log('Iniciando migração inteligente para o branch PRINCIPAL (production)...');

  try {
    await source.connect();
    await target.connect();

    // Tabelas para migrar
    const tables = ['clients', 'billings', 'kanban_items', 'monthly_goals', 'system_logs'];

    for (const table of tables) {
      console.log(`\n--- Tabela: ${table} ---`);
      
      // 1. Obter esquema do destino para saber quais colunas aceitar
      const targetColumnsRes = await target.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      const targetColumns = targetColumnsRes.rows.map(r => r.column_name);
      console.log(`Colunas alvo: ${targetColumns.join(', ')}`);

      // 2. Obter dados da origem
      const { rows } = await source.query(`SELECT * FROM ${table}`);
      console.log(`Registros na origem: ${rows.length}`);

      if (rows.length === 0) continue;

      // 3. Limpar destino
      await target.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      console.log(`Destino limpo.`);

      // 4. Mapear e Inserir
      for (const row of rows) {
        // Filtrar apenas as colunas que existem no destino
        const rowToInsert: any = {};
        targetColumns.forEach(col => {
          if (row.hasOwnProperty(col)) {
            rowToInsert[col] = row[col];
          }
        });

        const columns = Object.keys(rowToInsert);
        const values = Object.values(rowToInsert);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        await target.query(insertQuery, values);
      }
      
      // 5. Ajustar sequências de SERIAL se necessário
      if (targetColumns.includes('id')) {
        await target.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), MAX(id)) FROM ${table}`, [table]);
      }
      
      console.log(`Migração de ${table} OK.`);
    }

    console.log('\n--- RESTAURAÇÃO FINALIZADA COM SUCESSO NO PRODUCTION ---');
    
    await source.end();
    await target.end();
    process.exit(0);
  } catch (error) {
    console.error('ERRO:', error);
    process.exit(1);
  }
}

migrateData();
