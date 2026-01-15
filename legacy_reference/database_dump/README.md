# Database

## Overview
This folder contains SQL scripts to create and verify the PostgreSQL schema used by the dashboard.

## Requirements
- PostgreSQL (15+ recommended)
- A database created manually (example name: `rga_dashboard`)

## Setup (SQL scripts)
### Option A: pgAdmin / manual SQL
1. Create database (example): `rga_dashboard`
2. Connect to that database
3. Run:
   - `database/sql/setup_rga_dashboard.sql`

This script:
- Creates `uuid-ossp` extension
- Creates core tables for multi-tenant dashboard (tenants, users, roles, integrations, campaigns, metrics, etc.)

### Option B: Reference schema file
- `database/sql/schema.sql` contains the same/related DDL in a more compact format.

## Verify Database
### Single file
Run:
- `database/verify/verify_database.sql`

What it checks:
- Table count (expected baseline)
- Table list
- Extension presence
- Index and FK counts
- Basic data presence checks

### Split verification files
Folder: `database/verify/`

Run in order:
- `01_tables_count.sql`
- `02_list_tables.sql`
- `03_extensions.sql`
- `04_indexes_count.sql`
- `05_foreign_keys_count.sql`
- `06_tenants_data.sql`
- `07_users_data.sql`
- `08_triggers.sql`
- `09_functions.sql`
- `10_table_sizes.sql`
- `11_constraints.sql`
- `12_key_indexes.sql`
- `99_health_check.sql`

## Admin User
- `database/sql/create_admin_user.sql` can be used to create an initial admin user (use carefully).

## Notes
- The backend also uses Prisma (`backend/prisma/schema.prisma`) for DB access.
- Ensure backend `DATABASE_URL` points to the correct database.
