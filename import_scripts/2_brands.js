#!/usr/bin/env node

/**
 * TrackrCommerce Data Import Script - Step 2: Create Brands
 * 
 * This script reads a CSV file and generates SQL to insert brands
 * 
 * Prerequisites: Profiles must exist (run 1_profiles.js first)
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

function generateBrandsSQL(csvFile) {
  const brands = parseCSV(csvFile);
  
  let sql = '-- Step 2: Create Brands\n';
  sql += '-- Prerequisites: Profiles must exist\n';
  sql += '-- owner_id should match a profile ID\n\n';
  
  brands.forEach(brand => {
    const id = generateUUID();
    const name = escapeSQL(brand.name);
    const nuvemshop_store_id = brand.nuvemshop_store_id ? escapeSQL(brand.nuvemshop_store_id) : 'NULL';
    const owner_id = escapeSQL(brand.owner_id); // This should be a profile ID (UUID)
    const is_real = brand.is_real === 'false' ? 'false' : 'true';
    
    sql += `INSERT INTO public.brands (id, name, nuvemshop_store_id, owner_id, is_real, created_at)\n`;
    sql += `VALUES (${id}, ${name}, ${nuvemshop_store_id}, ${owner_id}, ${is_real}, NOW())\n`;
    sql += `ON CONFLICT DO NOTHING;\n\n`;
  });
  
  return sql;
}

const csvFile = process.argv[2];

if (!csvFile) {
  console.error('Usage: node 2_brands.js <csv_file>');
  console.error('Example: node 2_brands.js brands.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`File not found: ${csvFile}`);
  process.exit(1);
}

const sql = generateBrandsSQL(csvFile);
const outputFile = 'brands_import.sql';

fs.writeFileSync(outputFile, sql);
console.log(`✓ Generated SQL: ${outputFile}`);
console.log(`\nNext steps:`);
console.log(`1. Review ${outputFile}`);
console.log(`2. Open Supabase SQL Editor`);
console.log(`3. Copy and paste the SQL`);
console.log(`4. Run the script`);
console.log(`5. Note down the generated brand IDs`);
console.log(`6. Then run: node 3_brand_secrets.js brand_secrets.csv`);
