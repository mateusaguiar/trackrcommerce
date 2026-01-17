#!/usr/bin/env node

/**
 * TrackrCommerce Data Import Script - Step 5: Create Coupons
 * 
 * This script reads a CSV file and generates SQL to insert coupons
 * 
 * Prerequisites: Brands and Influencers must exist
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

function generateCouponsSQL(csvFile) {
  const coupons = parseCSV(csvFile);
  
  let sql = '-- Step 5: Create Coupons\n';
  sql += '-- Prerequisites: Brands and Influencers must exist\n';
  sql += '-- brand_id should match an existing brand ID\n';
  sql += '-- influencer_id should match an existing influencer ID\n\n';
  
  coupons.forEach(coupon => {
    const id = generateUUID();
    const code = escapeSQL(coupon.code);
    const brand_id = escapeSQL(coupon.brand_id);
    const influencer_id = escapeSQL(coupon.influencer_id);
    const discount_pct = coupon.discount_pct || '10';
    const is_active = coupon.is_active === 'false' ? 'false' : 'true';
    
    sql += `INSERT INTO public.coupons (id, code, brand_id, influencer_id, discount_pct, is_active, created_at)\n`;
    sql += `VALUES (${id}, ${code}, ${brand_id}, ${influencer_id}, ${discount_pct}, ${is_active}, NOW())\n`;
    sql += `ON CONFLICT DO NOTHING;\n\n`;
  });
  
  return sql;
}

const csvFile = process.argv[2];

if (!csvFile) {
  console.error('Usage: node 5_coupons.js <csv_file>');
  console.error('Example: node 5_coupons.js coupons.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`File not found: ${csvFile}`);
  process.exit(1);
}

const sql = generateCouponsSQL(csvFile);
const outputFile = 'coupons_import.sql';

fs.writeFileSync(outputFile, sql);
console.log(`✓ Generated SQL: ${outputFile}`);
console.log(`\nNext steps:`);
console.log(`1. Review ${outputFile}`);
console.log(`2. Open Supabase SQL Editor`);
console.log(`3. Copy and paste the SQL`);
console.log(`4. Run the script`);
console.log(`5. Note down the generated coupon IDs`);
console.log(`6. Then run: node 6_conversions.js conversions.csv`);
