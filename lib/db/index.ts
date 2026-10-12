import { Pool, neon } from '@neondatabase/serverless'
import { hashPassword } from '@/lib/auth'
import type {
  Activity,
  AuditLog,
  Customer,
  FollowUp,
  Lead,
  Opportunity,
  User,
} from '@/types'

const databaseUrl = process.env.DATABASE_URL

let pool: Pool | null = null

export function getPool(): Pool | null {
  if (!databaseUrl) return null
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl })
  }
  return pool
}

export function isNeonConfigured(): boolean {
  return !!databaseUrl && databaseUrl.includes('neon')
}

// In-Memory store for when DATABASE_URL is not set yet
class MemoryStore {
  users: User[] = []
  customers: Customer[] = []
  leads: Lead[] = []
  opportunities: Opportunity[] = []
  followUps: FollowUp[] = []
  activities: Activity[] = []
  auditLogs: AuditLog[] = []
  passwordHashes: Map<string, string> = new Map()
  initialized = false
}

const memoryStore = new MemoryStore()

// Initial seed data generator
async function getInitialSeeds() {
  const defaultHash = await hashPassword('Demo@123')

  const users: (User & { passwordHash: string })[] = [
    {
      id: 'u1',
      name: 'Aarav Mehta',
      email: 'aarav.mehta@acxiomcrm.com',
      phone: '+91 98200 11001',
      role: 'Admin',
      active: true,
      lockedOut: false,
      createdAt: '2025-01-10T09:00:00Z',
      lastLogin: new Date().toISOString(),
      passwordHash: defaultHash,
    },
    {
      id: 'u2',
      name: 'Priya Sharma',
      email: 'priya.sharma@acxiomcrm.com',
      phone: '+91 98200 11002',
      role: 'Manager',
      active: true,
      lockedOut: false,
      createdAt: '2025-01-15T09:00:00Z',
      lastLogin: new Date().toISOString(),
      passwordHash: defaultHash,
    },
    {
      id: 'u3',
      name: 'Rohan Verma',
      email: 'rohan.verma@acxiomcrm.com',
      phone: '+91 98200 11003',
      role: 'SalesExecutive',
      active: true,
      lockedOut: false,
      createdAt: '2025-02-01T09:00:00Z',
      lastLogin: new Date().toISOString(),
      passwordHash: defaultHash,
    },
    {
      id: 'u4',
      name: 'Neha Kapoor',
      email: 'neha.kapoor@acxiomcrm.com',
      phone: '+91 98200 11004',
      role: 'SalesExecutive',
      active: true,
      lockedOut: false,
      createdAt: '2025-02-05T09:00:00Z',
      lastLogin: new Date().toISOString(),
      passwordHash: defaultHash,
    },
  ]

  const customers: Customer[] = []
  const leads: Lead[] = []
  const opportunities: Opportunity[] = []
  const followUps: FollowUp[] = []
  const activities: Activity[] = []
  const auditLogs: AuditLog[] = []

  return { users, customers, leads, opportunities, followUps, activities, auditLogs }
}

// Database Initialization (Creates tables in Neon Postgres and seeds initial data)
export async function initDb(): Promise<{ success: boolean; message: string }> {
  const pool = getPool()
  const seeds = await getInitialSeeds()

  if (!pool) {
    // Initialize in-memory
    memoryStore.users = seeds.users.map(({ passwordHash, ...u }) => u)
    seeds.users.forEach((u) => memoryStore.passwordHashes.set(u.email.toLowerCase(), u.passwordHash))
    memoryStore.customers = []
    memoryStore.leads = []
    memoryStore.opportunities = []
    memoryStore.followUps = []
    memoryStore.activities = []
    memoryStore.auditLogs = []
    memoryStore.initialized = true

    return {
      success: true,
      message: 'Running with clean local storage (all demo data removed). Set DATABASE_URL to your Neon PostgreSQL connection string to persist to Neon DB.',
    }
  }

  try {
    const client = await pool.connect()
    try {
      // 1. Create tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(30),
            role VARCHAR(30) NOT NULL DEFAULT 'SalesExecutive',
            active BOOLEAN NOT NULL DEFAULT TRUE,
            failed_login_count INT NOT NULL DEFAULT 0,
            lockout_until TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(50) PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            company VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            phone VARCHAR(30) UNIQUE NOT NULL,
            address TEXT,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Prospect',
            owner_id VARCHAR(50) NOT NULL REFERENCES users(id),
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(50) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS leads (
            id VARCHAR(50) PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            company VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL,
            phone VARCHAR(30),
            source VARCHAR(50) NOT NULL DEFAULT 'Website',
            status VARCHAR(30) NOT NULL DEFAULT 'New',
            priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
            expected_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
            owner_id VARCHAR(50) NOT NULL REFERENCES users(id),
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS opportunities (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            lead_id VARCHAR(50) REFERENCES leads(id),
            amount NUMERIC(14, 2) NOT NULL,
            stage VARCHAR(50) NOT NULL DEFAULT 'Qualification',
            probability INT NOT NULL DEFAULT 20,
            expected_close_date DATE NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Open',
            owner_id VARCHAR(50) NOT NULL REFERENCES users(id),
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS follow_ups (
            id VARCHAR(50) PRIMARY KEY,
            customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
            lead_id VARCHAR(50) REFERENCES leads(id),
            related_type VARCHAR(30) NOT NULL,
            related_id VARCHAR(50) NOT NULL,
            subject VARCHAR(200) NOT NULL,
            date TIMESTAMPTZ NOT NULL,
            type VARCHAR(30) NOT NULL DEFAULT 'Call',
            status VARCHAR(30) NOT NULL DEFAULT 'Planned',
            owner_id VARCHAR(50) NOT NULL REFERENCES users(id),
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS activities (
            id VARCHAR(50) PRIMARY KEY,
            type VARCHAR(30) NOT NULL DEFAULT 'Call',
            subject VARCHAR(200) NOT NULL,
            related_type VARCHAR(30) NOT NULL,
            related_id VARCHAR(50) NOT NULL,
            date TIMESTAMPTZ NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Pending',
            owner_id VARCHAR(50) NOT NULL REFERENCES users(id),
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            action VARCHAR(50) NOT NULL,
            entity VARCHAR(50) NOT NULL,
            record_id VARCHAR(50),
            old_value TEXT,
            new_value TEXT,
            ip_address VARCHAR(50),
            timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Check if users exist, if not seed
      const userRes = await client.query('SELECT count(*) FROM users')
      if (parseInt(userRes.rows[0].count, 10) === 0) {
        // Seed users
        for (const u of seeds.users) {
          await client.query(
            `INSERT INTO users (id, name, email, password_hash, phone, role, active, failed_login_count, created_at, last_login)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [u.id, u.name, u.email, u.passwordHash, u.phone, u.role, u.active, 0, u.createdAt, u.lastLogin]
          )
        }

        // Seed customers
        for (const c of seeds.customers) {
          await client.query(
            `INSERT INTO customers (id, code, name, company, email, phone, address, city, state, status, owner_id, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [c.id, c.code, c.name, c.company, c.email, c.phone, c.address, c.city, c.state, c.status, c.ownerId, c.notes, c.createdAt]
          )
        }

        // Seed leads
        for (const l of seeds.leads) {
          await client.query(
            `INSERT INTO leads (id, code, name, company, email, phone, source, status, priority, expected_value, owner_id, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [l.id, l.code, l.name, l.company, l.email, l.phone, l.source, l.status, l.priority, l.expectedValue, l.ownerId, l.notes, l.createdAt]
          )
        }

        // Seed opportunities
        for (const o of seeds.opportunities) {
          await client.query(
            `INSERT INTO opportunities (id, name, customer_id, amount, stage, probability, expected_close_date, status, owner_id, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [o.id, o.name, o.customerId, o.amount, o.stage, o.probability, o.expectedCloseDate, 'Open', o.ownerId, o.notes, o.createdAt]
          )
        }

        // Seed follow-ups
        for (const f of seeds.followUps) {
          await client.query(
            `INSERT INTO follow_ups (id, related_type, related_id, subject, date, type, status, owner_id, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [f.id, f.relatedType, f.relatedId, f.subject, f.date, f.type, f.status, f.ownerId, f.notes, f.date]
          )
        }

        // Seed activities
        for (const a of seeds.activities) {
          await client.query(
            `INSERT INTO activities (id, type, subject, related_type, related_id, date, status, owner_id, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [a.id, a.type, a.subject, a.relatedType, a.relatedId, a.date, a.status, a.ownerId, a.description, a.date]
          )
        }

        // Seed audit logs
        for (const log of seeds.auditLogs) {
          await client.query(
            `INSERT INTO audit_logs (id, user_id, action, entity, record_id, old_value, new_value, ip_address, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [log.id, log.userId, log.action, log.entity, log.recordId, log.oldValue, log.newValue, log.ipAddress, log.timestamp]
          )
        }
      }

      return { success: true, message: 'Neon PostgreSQL connected and schema verified.' }
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Failed to initialize Neon PostgreSQL:', error)
    return { success: false, message: error.message || 'Database initialization error' }
  }
}

// Ensure database is initialized at least once
let initPromise: Promise<any> | null = null
export async function ensureDb() {
  if (!initPromise) {
    initPromise = initDb()
  }
  return initPromise
}

export { memoryStore }
