#!/usr/bin/env node

/**
 * TrackrCommerce Data Import Script - Step 6: Create Conversions
 * 
 * This script reads a CSV file and generates SQL to insert conversions (sales)
 * 
 * Prerequisites: Brands and Coupons must exist
 */

import fs from 'fs';

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return row;
  });
  
  return data;
}

function escapeSQL(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function generateUUID() {
  return 'gen_random_uuid()';
}

function generateConversionsSQL(csvFile) {
  const conversions = parseCSV(csvFile);
  
  let sql = '-- Step 6: Create Conversions (Sales)\n';
  sql += '-- Prerequisites: Brands and Coupons must exist\n';
  sql += '-- brand_id should match an existing brand ID\n';
  sql += '-- coupon_id should match an existing coupon ID (can be NULL if no coupon)\n\n';
  
  conversions.forEach(conversion => {
    const id = generateUUID();
    const order_id = escapeSQL(conversion.order_id);
    const brand_id = escapeSQL(conversion.brand_id);
    const coupon_id = conversion.coupon_id ? escapeSQL(conversion.coupon_id) : 'NULL';
    const order_amount = conversion.order_amount || '0.00';
    const commission_amount = conversion.commission_amount || '0.00';
    const status = escapeSQL(conversion.status || 'paid'); // paid, confirmed, completed, pending, cancelled
    const order_is_real = conversion.order_is_real === 'false' ? 'false' : 'true';
    const sale_date = conversion.sale_date ? `'${conversion.sale_date}'` : 'NOW()';
    const metadata = conversion.metadata ? escapeSQL(conversion.metadata) : 'NULL';
    
    sql += `INSERT INTO public.conversions (id, order_id, brand_id, coupon_id, order_amount, commission_amount, status, order_is_real, sale_date, metadata, created_at)\n`;
    sql += `VALUES (${id}, ${order_id}, ${brand_id}, ${coupon_id}, ${order_amount}, ${commission_amount}, ${status}, ${order_is_real}, ${sale_date}, ${metadata}::jsonb, NOW())\n`;
    sql += `ON CONFLICT DO NOTHING;\n\n`;
  });
  
  return sql;
}

const csvFile = process.argv[2];

if (!csvFile) {
  console.error('Usage: node 6_conversions.js <csv_file>');
  console.error('Example: node 6_conversions.js conversions.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`File not found: ${csvFile}`);
  process.exit(1);
}

const sql = generateConversionsSQL(csvFile);
const outputFile = 'conversions_import.sql';

fs.writeFileSync(outputFile, sql);
console.log(`✓ Generated SQL: ${outputFile}`);
console.log(`\nNext steps:`);
console.log(`1. Review ${outputFile}`);
console.log(`2. Open Supabase SQL Editor`);
console.log(`3. Copy and paste the SQL`);
console.log(`4. Run the script`);
console.log(`5. Your data import is complete!`);
