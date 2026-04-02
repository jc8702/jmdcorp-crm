import dotenv from 'dotenv';
dotenv.config();
import { sql } from './api/lib/_db';

async function migrate() {
  console.log('Iniciando migração...');
  try {
    // 1. Billings - erp
    await sql`ALTER TABLE billings ADD COLUMN IF NOT EXISTS erp TEXT`;
    console.log('Coluna erp adicionada a billings.');

    // 2. Kanban Items - date_time, visit_format, description
    await sql`ALTER TABLE kanban_items ADD COLUMN IF NOT EXISTS date_time TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE kanban_items ADD COLUMN IF NOT EXISTS visit_format TEXT`;
    await sql`ALTER TABLE kanban_items ADD COLUMN IF NOT EXISTS description TEXT`;
    console.log('Colunas adicionadas a kanban_items.');

    // 3. Clients - codigo_erp (já deve existir, mas garantindo)
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS codigo_erp TEXT`;
    console.log('Coluna codigo_erp adicionada a clients.');

    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (e) {
    console.error('Erro na migração:', e);
    process.exit(1);
  }
}

migrate();
