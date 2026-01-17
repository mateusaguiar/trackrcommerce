#!/usr/bin/env node

/**
 * TrackrCommerce Data Import Script - Step 1: Create Profiles
 * 
 * This script reads a CSV file and generates SQL to insert profiles
 * 
 * IMPORTANT: Users must be created in Supabase Auth FIRST
 * Instructions:
 * 1. Go to Supabase Dashboard → Authentication → Users
 * 2. Click "Add user" for each user you want to import
 * 3. Create with email and password
 * 4. Copy the user ID (UUID)
 * 5. Update the CSV with the UUID in the first column
 * 6. Run this script to generate SQL
 * 7. Execute the generated SQL in Supabase SQL Editor
 */

import fs from 'fs';
import path from 'path';

// Parse CSV
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

// Escape single quotes in strings
function escapeSQL(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Generate SQL for profiles
function generateProfilesSQL(csvFile) {
  const profiles = parseCSV(csvFile);
  
  let sql = '-- Step 1: Create Profiles\n';
  sql += '-- Prerequisites: Users must be created in Supabase Auth first\n';
  sql += '-- ID column should contain the UUID from Supabase Auth Users\n\n';
  
  profiles.forEach(profile => {
    const id = profile.id; // UUID from Auth
    const email = escapeSQL(profile.email);
    const full_name = escapeSQL(profile.full_name);
    const role = escapeSQL(profile.role); // master, brand_admin, influencer, user
    
    sql += `INSERT INTO public.profiles (id, email, full_name, role, created_at)\n`;
    sql += `VALUES (${escapeSQL(id)}, ${email}, ${full_name}, ${role}, NOW())\n`;
    sql += `ON CONFLICT (id) DO NOTHING;\n\n`;
  });
  
  return sql;
}

// Main
const csvFile = process.argv[2];

if (!csvFile) {
  console.error('Usage: node 1_profiles.js <csv_file>');
  console.error('Example: node 1_profiles.js profiles.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`File not found: ${csvFile}`);
  process.exit(1);
}

const sql = generateProfilesSQL(csvFile);
const outputFile = 'profiles_import.sql';

fs.writeFileSync(outputFile, sql);
console.log(`✓ Generated SQL: ${outputFile}`);
console.log(`\nNext steps:`);
console.log(`1. Review ${outputFile}`);
console.log(`2. Open Supabase SQL Editor`);
console.log(`3. Copy and paste the SQL`);
console.log(`4. Run the script`);
console.log(`5. Then run: node 2_brands.js brands.csv`);
