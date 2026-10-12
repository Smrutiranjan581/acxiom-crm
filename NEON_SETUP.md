# Neon PostgreSQL Setup Guide for AcxiomCRM

This guide explains how to connect AcxiomCRM to **Neon PostgreSQL** (serverless Postgres) for full database persistence.

---

## 1. Create a Free Neon Database

1. Go to [https://neon.tech](https://neon.tech) and create a free account (Sign in with GitHub or Google).
2. Click **Create Project**:
   - **Project name**: `acxiomcrm`
   - **Postgres version**: `16` or `17` (Default)
   - **Region**: Choose the region closest to you (e.g., `AWS US East (Ohio)` or `Asia Pacific (Singapore)`).
3. Click **Create Project**.

---

## 2. Obtain Your Connection String

Once the project is created, the Neon Dashboard displays your **Connection Details**:
1. In the **Connection string** dropdown, select **Node.js** or **Postgres** (with Pooling or Direct).
2. Copy the connection string. It looks like this:
   ```env
   postgresql://neondb_owner:npg_xYzA1234@ep-quiet-star-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## 3. Configure Your Environment Variables

Open or create `.env.local` in the project root (`crm-dashboard-ui-design/`):

```env
# Neon PostgreSQL Connection String
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-ENDPOINT.us-east-2.aws.neon.tech/neondb?sslmode=require"

# JWT Secret for Session Cookies
JWT_SECRET="acxiomcrm-secure-production-jwt-secret-key-32-chars-long"

# Next.js API Base URL (Relative /api for fullstack)
NEXT_PUBLIC_API_URL="/api"
```

---

## 4. Run Schema Migration & Initial Seeding

The application includes an **automated schema initialization** feature.

### Option A: Automatic Auto-Migration (Recommended)
When you start the development server:
```bash
npm run dev
```
As soon as the app loads or any API endpoint is called, `ensureDb()` will:
1. Detect your Neon PostgreSQL database.
2. Automatically create all 7 required tables:
   - `users` (with password hashing and lockout fields)
   - `customers` (with uniqueness constraints on email & phone)
   - `leads` (with statuses, expected value, conversion support)
   - `opportunities` (with Amount > 0 check and stage tracking)
   - `follow_ups` (with date checks and status)
   - `activities` (calls, meetings, emails, tasks)
   - `audit_logs` (immutable event log)
3. Seed initial demo users with `bcryptjs` password hashing!

### Option B: Run Migration via Neon Web Console (Manual)
If you prefer running SQL directly in Neon:
1. In the Neon Console, click **SQL Editor** on the left menu.
2. Open the file [`lib/db/schema.sql`](./lib/db/schema.sql).
3. Copy its entire content, paste into Neon SQL Editor, and click **Run**.

---

## 5. Seeded Accounts & Credentials

The database comes pre-seeded with 3 roles ready for testing:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `aarav.mehta@acxiomcrm.com` | `Demo@123` | Full application admin, user management, audit logs, all records |
| **Manager** | `priya.sharma@acxiomcrm.com` | `Demo@123` | Team pipeline, opportunity forecasting, management reports |
| **Sales Executive** | `rohan.verma@acxiomcrm.com` | `Demo@123` | Assigned accounts, leads, opportunities & scheduled follow-ups |

---

## 6. Testing the Connection

You can check your database status anytime at the diagnostic endpoint:
```
GET http://localhost:3000/api/setup
```
It returns:
```json
{
  "neonConfigured": true,
  "databaseUrl": "postgresql://neondb_owner:****@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require",
  "mode": "Neon PostgreSQL (Connected)",
  "instruction": "Neon PostgreSQL is active."
}
```

---

## 7. Business Validations & Security Rules

- **Account Lockout**: 5 failed login attempts will lock the account for 15 minutes. An administrator can unlock it under `/admin/users`.
- **Customer Uniqueness**: Unique Email and Unique Phone are enforced at the database level and server API.
- **Opportunity Rules**: Amount must be greater than 0; Probability must be 0–100; Expected Close Date cannot be in the past for active deals.
- **Follow-Up Rules**: Follow-up date cannot be earlier than today for planned/new activities.
- **Lead Conversion**: Automatically creates a Customer and Opportunity and marks the Lead as `Converted`.
- **Audit Logging**: Every login, failed login, logout, create, update, delete, and role change is logged to the database.
