# Security Guide - TrackrCommerce

## 🔐 Security Best Practices

This document outlines security best practices for developing and deploying TrackrCommerce.

---

## Environment Variables & Secrets Management

### ⚠️ CRITICAL: Never Commit Secrets

**NEVER commit the following to version control:**
- `.env.local` - Your local environment variables with real credentials
- `*_import.sql` - Generated SQL files that may contain sensitive data
- Any files containing API keys, tokens, passwords, or access credentials

### Setting Up Local Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to https://app.supabase.com/project/_/settings/api
   - Copy the **Project URL** to `VITE_SUPABASE_URL`
   - Copy the **anon/public key** to `VITE_SUPABASE_ANON_KEY`

3. Edit `.env.local` with your actual values
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

4. **Verify** `.env.local` is in `.gitignore` before committing any changes

### Production Deployment (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL` - Your production Supabase URL
   - `VITE_SUPABASE_ANON_KEY` - Your production Supabase anon key

**Never use the same credentials for development and production!**

---

## Credential Rotation

### When to Rotate Credentials

Rotate your credentials immediately if:
- They were accidentally committed to version control
- A team member with access leaves the project
- You suspect unauthorized access
- As part of regular security maintenance (every 90 days recommended)

### How to Rotate Supabase Credentials

1. **Generate new keys:**
   - Go to Supabase Project Settings → API
   - Click "Reset" next to the anon key
   - Copy the new key

2. **Update all environments:**
   - Update `.env.local` for local development
   - Update Vercel environment variables for production
   - Notify all team members to update their local `.env.local`

3. **Revoke old credentials:**
   - Old anon keys are automatically invalidated when reset
   - Monitor logs for any failed authentication attempts

---

## Nuvemshop API Tokens

### Secure Token Storage

- API tokens for Nuvemshop are stored in the `brand_secrets` table in Supabase
- This table has Row Level Security (RLS) enabled
- Tokens are encrypted at rest by Supabase
- Never include real tokens in sample CSV files

### Token Management

1. **Never commit tokens to the repository:**
   - The `sample_brand_secrets.csv` file contains FAKE tokens only
   - Replace with real tokens only during import, never commit them

2. **Rotate Nuvemshop tokens regularly:**
   - Generate new API tokens in Nuvemshop dashboard
   - Update the `brand_secrets` table via Supabase SQL editor
   - Test integration after rotation

---

## Data Import Scripts Security

### Import Script Best Practices

1. **Use sample data for testing:**
   - All `sample_*.csv` files contain fake/test data
   - Never replace sample data with real data in the repository

2. **Generated SQL files:**
   - Files matching `*_import.sql` are auto-ignored by git
   - These may contain sensitive data from your CSV imports
   - Delete them after importing to Supabase

3. **Secure import process:**
   ```bash
   # Run import script
   node import_scripts/3_brand_secrets.js your_secrets.csv
   
   # Review the generated SQL (outside repo)
   cat brand_secrets_import.sql
   
   # Import to Supabase
   # Copy SQL to Supabase SQL Editor and run
   
   # Delete the generated file
   rm brand_secrets_import.sql
   ```

---

## Row Level Security (RLS)

### Database Security

TrackrCommerce uses Supabase Row Level Security to protect data:

- **Profiles**: Users can only view/edit their own profile
- **Brands**: Users can only access brands they own or are affiliated with
- **Conversions**: Brand admins see only their brand's sales data
- **Brand Secrets**: Only accessible via backend, never exposed to client

### RLS Policies

All tables have RLS enabled. Policies are defined in:
- `database-schema-adjustments.sql`
- `RLS_ARCHITECTURE_GUIDE.sql`

**Never disable RLS on production tables!**

---

## Client-Side Security

### Supabase Anon Key

The `VITE_SUPABASE_ANON_KEY` is safe to expose in client-side code because:
- It's designed to be public (hence "anon")
- Row Level Security (RLS) protects data access
- It cannot perform admin operations

However, **never expose**:
- Service role keys
- Private API keys
- User passwords or tokens

### Data Validation

- All user inputs are validated on the client
- Server-side validation is enforced by Supabase RLS
- SQL injection is prevented by using parameterized queries

---

## Security Checklist

### Before Every Commit

- [ ] Check that no `.env.local` files are being committed
- [ ] Verify no `*_import.sql` files are included
- [ ] Search for hardcoded credentials in changed files
- [ ] Review console.log statements for sensitive data leaks

### Before Deployment

- [ ] All environment variables set in Vercel
- [ ] Production credentials different from development
- [ ] RLS policies enabled on all tables
- [ ] No test/demo data in production database

### Regular Maintenance

- [ ] Rotate Supabase credentials every 90 days
- [ ] Review Supabase access logs for anomalies
- [ ] Update dependencies for security patches
- [ ] Audit user access and permissions

---

## Incident Response

### If Credentials Are Exposed

1. **Immediate action (within 1 hour):**
   - Rotate all exposed credentials immediately
   - Check Supabase logs for unauthorized access
   - Disable compromised accounts if any

2. **Investigation (within 24 hours):**
   - Review all database access logs
   - Identify what data may have been accessed
   - Document the timeline of exposure

3. **Remediation:**
   - Update all affected systems with new credentials
   - Notify affected users if personal data was exposed
   - Implement additional security measures to prevent recurrence

4. **Prevention:**
   - Add pre-commit hooks to scan for secrets
   - Enable secret scanning on GitHub (if public repo)
   - Train team on security best practices

---

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Contact

For security concerns or to report vulnerabilities, contact the project maintainer immediately.

**Last Updated:** 2026-01-21
