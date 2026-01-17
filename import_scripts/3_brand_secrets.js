#!/usr/bin/env node

/**
 * TrackrCommerce Data Import Script - Step 3: Create Brand Secrets
 * 
 * This script reads a CSV file and generates SQL to insert brand secrets
 * 
 * Prerequisites: Brands must exist (run 2_brands.js first)
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

function generateBrandSecretsSQL(csvFile) {
  const secrets = parseCSV(csvFile);
  
  let sql = '-- Step 3: Create Brand Secrets\n';
  sql += '-- Prerequisites: Brands must exist\n';
  sql += '-- brand_id should match an existing brand ID\n\n';
  
  secrets.forEach(secret => {
    const id = generateUUID();
    const brand_id = escapeSQL(secret.brand_id); // UUID from brands table
    const access_token = escapeSQL(secret.access_token); // Nuvemshop API token
    
    sql += `INSERT INTO public.brand_secrets (id, brand_id, access_token, created_at)\n`;
    sql += `VALUES (${id}, ${brand_id}, ${access_token}, NOW())\n`;
    sql += `ON CONFLICT (brand_id) DO UPDATE SET access_token = ${access_token};\n\n`;
  });
  
  return sql;
}

const csvFile = process.argv[2];

if (!csvFile) {
  console.error('Usage: node 3_brand_secrets.js <csv_file>');
  console.error('Example: node 3_brand_secrets.js brand_secrets.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`File not found: ${csvFile}`);
  process.exit(1);
}

const sql = generateBrandSecretsSQL(csvFile);
const outputFile = 'brand_secrets_import.sql';

fs.writeFileSync(outputFile, sql);
console.log(`✓ Generated SQL: ${outputFile}`);
console.log(`\nNext steps:`);
console.log(`1. Review ${outputFile}`);
console.log(`2. Open Supabase SQL Editor`);
console.log(`3. Copy and paste the SQL`);
console.log(`4. Run the script`);
console.log(`5. Then run: node 4_influencers.js influencers.csv`);
