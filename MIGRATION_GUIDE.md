# 🔧 Database Migration Guide

## Problem
Your CRM shows "Couldn't load today's numbers" and leads don't appear because your database schema is outdated. The database has `super_admin` role but the code expects `owner`, `admin`, or `member`.

## Solution: Apply v2 Migrations

### Step 1: Go to Supabase SQL Editor
1. Open: https://supabase.com/dashboard/project/hendwoizaxjhpwyaumsh/editor
2. Sign in to your Supabase account

### Step 2: Apply Migrations in Order

**⚠️ IMPORTANT: Run these in order! Each file is one transaction.**

#### 📄 Migration 1: Schema Update
1. Open `supabase/migrations/20260928090012_crm_v2_schema.sql` in your code editor
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for "Success. No rows returned" message

#### 📄 Migration 2: Functions
1. Open `supabase/migrations/20260928090013_crm_v2_functions.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for success message

#### 📄 Migration 3: Security (RLS Policies)
1. Open `supabase/migrations/20260928090014_crm_v2_security.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for success message

### Step 3: Verify
After all 3 migrations:

1. Go back to SQL Editor and run:
   ```sql
   SELECT id, email, full_name, role, is_active FROM profiles;
   ```

2. You should see your role as `owner` (not `super_admin`)

3. Check leads:
   ```sql
   SELECT id, brand_name, stage, owner_id FROM leads LIMIT 5;
   ```

### Step 4: Refresh Your CRM
1. Go to http://localhost:3000/crm
2. Press Cmd+Shift+R (hard refresh) to clear cache
3. The dashboard should now load with data!

## What These Migrations Do

1. **Schema (090012)**: 
   - Backs up old data to `crm_backup` schema
   - Converts `super_admin` → `owner`
   - Restructures tables (leads, contacts, tasks)
   - Migrates old statuses to new stages

2. **Functions (090013)**:
   - Adds workflow RPCs (log_outcome, create_quotation, etc.)
   - Dashboard queries
   - Lead assignment logic

3. **Security (090014)**:
   - Row Level Security policies
   - Access controls per role
   - API permissions

## If Something Goes Wrong

The migrations are safe - they back up your data first to `crm_backup` schema.

To check the backup:
```sql
SELECT * FROM crm_backup.leads_pre_v2;
```

## Alternative: Use Supabase CLI

If you prefer command line:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
npx supabase link --project-ref hendwoizaxjhpwyaumsh

# Apply migrations
npx supabase db push
```

---

**After completing these steps, your CRM will work correctly!** 🎉
