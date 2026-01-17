#!/usr/bin/env node

/**
 * TrackrCommerce Data Import Script - Step 4: Create Influencers
 * 
 * This script reads a CSV file and generates SQL to insert influencers
 * 
 * Prerequisites: Profiles and Brands must exist
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

function generateInfluencersSQL(csvFile) {
  const influencers = parseCSV(csvFile);
  
  let sql = '-- Step 4: Create Influencers\n';
  sql += '-- Prerequisites: Profiles and Brands must exist\n';
  sql += '-- brand_id should match an existing brand ID\n';
  sql += '-- profile_id should match an existing profile ID (influencer user)\n\n';
  
  influencers.forEach(influencer => {
    const id = generateUUID();
    const brand_id = escapeSQL(influencer.brand_id); // UUID from brands table
    const profile_id = escapeSQL(influencer.profile_id); // UUID from profiles table
    const name = escapeSQL(influencer.name);
    const social_handle = influencer.social_handle ? escapeSQL(influencer.social_handle) : 'NULL';
    const commission_rate = influencer.commission_rate || '10.00';
    
    sql += `INSERT INTO public.influencers (id, brand_id, profile_id, name, social_handle, commission_rate, created_at)\n`;
    sql += `VALUES (${id}, ${brand_id}, ${profile_id}, ${name}, ${social_handle}, ${commission_rate}, NOW())\n`;
    sql += `ON CONFLICT DO NOTHING;\n\n`;
  });
  
  return sql;
}

const csvFile = process.argv[2];

if (!csvFile) {
  console.error('Usage: node 4_influencers.js <csv_file>');
  console.error('Example: node 4_influencers.js influencers.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`File not found: ${csvFile}`);
  process.exit(1);
}

const sql = generateInfluencersSQL(csvFile);
const outputFile = 'influencers_import.sql';

fs.writeFileSync(outputFile, sql);
console.log(`✓ Generated SQL: ${outputFile}`);
console.log(`\nNext steps:`);
console.log(`1. Review ${outputFile}`);
console.log(`2. Open Supabase SQL Editor`);
console.log(`3. Copy and paste the SQL`);
console.log(`4. Run the script`);
console.log(`5. Note down the generated influencer IDs`);
console.log(`6. Then run: node 5_coupons.js coupons.csv`);
