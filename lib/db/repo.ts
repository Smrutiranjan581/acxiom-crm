import { ensureDb, getPool, memoryStore } from '@/lib/db'
import type {
  Activity,
  AuditAction,
  AuditLog,
  Customer,
  FollowUp,
  Lead,
  Opportunity,
  Role,
  User,
} from '@/types'

// -------------------------------------------------------------
// USERS REPO
// -------------------------------------------------------------
export const usersRepo = {
  async list(): Promise<User[]> {
    await ensureDb()
    const pool = getPool()
    if (!pool) return [...memoryStore.users]

    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, active,
              failed_login_count as "failedLoginCount",
              (lockout_until IS NOT NULL AND lockout_until > NOW()) as "lockedOut",
              created_at as "createdAt", last_login as "lastLogin"
       FROM users ORDER BY created_at ASC`
    )
    return rows
  },

  async findByEmail(email: string): Promise<(User & { passwordHash: string; failedLoginCount: number; lockoutUntil: string | null }) | null> {
    await ensureDb()
    const cleanEmail = email.trim().toLowerCase()
    const pool = getPool()
    if (!pool) {
      const u = memoryStore.users.find((x) => x.email.toLowerCase() === cleanEmail)
      if (!u) return null
      const hash = memoryStore.passwordHashes.get(cleanEmail) || ''
      return {
        ...u,
        passwordHash: hash,
        failedLoginCount: (u as any).failedLoginCount || 0,
        lockoutUntil: (u as any).lockoutUntil || null,
      }
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash as "passwordHash", phone, role, active,
              failed_login_count as "failedLoginCount",
              lockout_until as "lockoutUntil",
              (lockout_until IS NOT NULL AND lockout_until > NOW()) as "lockedOut",
              created_at as "createdAt", last_login as "lastLogin"
       FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    )
    return rows[0] || null
  },

  async findById(id: string): Promise<User | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) return memoryStore.users.find((u) => u.id === id) || null

    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, active,
              failed_login_count as "failedLoginCount",
              (lockout_until IS NOT NULL AND lockout_until > NOW()) as "lockedOut",
              created_at as "createdAt", last_login as "lastLogin"
       FROM users WHERE id = $1`,
      [id]
    )
    return rows[0] || null
  },

  async create(user: User, passwordHash: string): Promise<User> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      memoryStore.users.push(user)
      memoryStore.passwordHashes.set(user.email.toLowerCase(), passwordHash)
      return user
    }

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, phone, role, active, created_at, last_login)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [user.id, user.name, user.email, passwordHash, user.phone, user.role, user.active, user.createdAt, user.lastLogin]
    )
    return user
  },

  async update(id: string, patch: Partial<User & { passwordHash?: string }>): Promise<User | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.users.findIndex((u) => u.id === id)
      if (idx === -1) return null
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...patch }
      if (patch.passwordHash) {
        memoryStore.passwordHashes.set(memoryStore.users[idx].email.toLowerCase(), patch.passwordHash)
      }
      return memoryStore.users[idx]
    }

    const updates: string[] = []
    const values: any[] = []
    let p = 1

    if (patch.name !== undefined) { updates.push(`name = $${p++}`); values.push(patch.name) }
    if (patch.email !== undefined) { updates.push(`email = $${p++}`); values.push(patch.email) }
    if (patch.phone !== undefined) { updates.push(`phone = $${p++}`); values.push(patch.phone) }
    if (patch.role !== undefined) { updates.push(`role = $${p++}`); values.push(patch.role) }
    if (patch.active !== undefined) { updates.push(`active = $${p++}`); values.push(patch.active) }
    if (patch.passwordHash !== undefined) { updates.push(`password_hash = $${p++}`); values.push(patch.passwordHash) }
    if (patch.lastLogin !== undefined) { updates.push(`last_login = $${p++}`); values.push(patch.lastLogin) }

    if (updates.length > 0) {
      values.push(id)
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${p}`, values)
    }
    return this.findById(id)
  },

  async recordFailedLogin(id: string): Promise<{ failedCount: number; lockedOut: boolean }> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const u = memoryStore.users.find((x) => x.id === id) as any
      if (!u) return { failedCount: 0, lockedOut: false }
      u.failedLoginCount = (u.failedLoginCount || 0) + 1
      if (u.failedLoginCount >= 5) {
        u.lockedOut = true
        u.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
      return { failedCount: u.failedLoginCount, lockedOut: !!u.lockedOut }
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET failed_login_count = failed_login_count + 1,
           lockout_until = CASE WHEN failed_login_count + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE lockout_until END
       WHERE id = $1
       RETURNING failed_login_count, (lockout_until IS NOT NULL AND lockout_until > NOW()) as "lockedOut"`,
      [id]
    )
    return {
      failedCount: rows[0]?.failed_login_count || 0,
      lockedOut: !!rows[0]?.lockedOut,
    }
  },

  async resetFailedLogin(id: string): Promise<void> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const u = memoryStore.users.find((x) => x.id === id) as any
      if (u) {
        u.failedLoginCount = 0
        u.lockedOut = false
        u.lockoutUntil = null
        u.lastLogin = new Date().toISOString()
      }
      return
    }

    await pool.query(
      `UPDATE users SET failed_login_count = 0, lockout_until = NULL, last_login = NOW() WHERE id = $1`,
      [id]
    )
  },

  async unlock(id: string): Promise<void> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const u = memoryStore.users.find((x) => x.id === id) as any
      if (u) {
        u.failedLoginCount = 0
        u.lockedOut = false
        u.lockoutUntil = null
      }
      return
    }

    await pool.query(`UPDATE users SET failed_login_count = 0, lockout_until = NULL WHERE id = $1`, [id])
  },
}

// -------------------------------------------------------------
// CUSTOMERS REPO
// -------------------------------------------------------------
export const customersRepo = {
  async list(ownerId?: string): Promise<Customer[]> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      return ownerId ? memoryStore.customers.filter((c) => c.ownerId === ownerId) : [...memoryStore.customers]
    }

    const query = ownerId
      ? `SELECT id, code, name, company, email, phone, address, city, state, status,
                owner_id as "ownerId", notes, created_at as "createdAt"
         FROM customers WHERE owner_id = $1 ORDER BY created_at DESC`
      : `SELECT id, code, name, company, email, phone, address, city, state, status,
                owner_id as "ownerId", notes, created_at as "createdAt"
         FROM customers ORDER BY created_at DESC`
    const { rows } = await pool.query(query, ownerId ? [ownerId] : [])
    return rows
  },

  async findById(id: string): Promise<Customer | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) return memoryStore.customers.find((c) => c.id === id) || null

    const { rows } = await pool.query(
      `SELECT id, code, name, company, email, phone, address, city, state, status,
              owner_id as "ownerId", notes, created_at as "createdAt"
       FROM customers WHERE id = $1`,
      [id]
    )
    return rows[0] || null
  },

  async findByEmail(email: string, excludeId?: string): Promise<Customer | null> {
    await ensureDb()
    const clean = email.trim().toLowerCase()
    const pool = getPool()
    if (!pool) {
      return memoryStore.customers.find((c) => c.email.toLowerCase() === clean && c.id !== excludeId) || null
    }

    const query = excludeId
      ? `SELECT id, code, name, email FROM customers WHERE LOWER(email) = $1 AND id != $2`
      : `SELECT id, code, name, email FROM customers WHERE LOWER(email) = $1`
    const params = excludeId ? [clean, excludeId] : [clean]
    const { rows } = await pool.query(query, params)
    return rows[0] || null
  },

  async findByPhone(phone: string, excludeId?: string): Promise<Customer | null> {
    await ensureDb()
    const clean = phone.replace(/[^0-9]/g, '')
    const pool = getPool()
    if (!pool) {
      return memoryStore.customers.find((c) => c.phone.replace(/[^0-9]/g, '') === clean && c.id !== excludeId) || null
    }

    const query = excludeId
      ? `SELECT id, code, name, phone FROM customers WHERE regexp_replace(phone, '[^0-9]', '', 'g') = $1 AND id != $2`
      : `SELECT id, code, name, phone FROM customers WHERE regexp_replace(phone, '[^0-9]', '', 'g') = $1`
    const params = excludeId ? [clean, excludeId] : [clean]
    const { rows } = await pool.query(query, params)
    return rows[0] || null
  },

  async create(customer: Customer, createdBy?: string): Promise<Customer> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      memoryStore.customers.unshift(customer)
      return customer
    }

    await pool.query(
      `INSERT INTO customers (id, code, name, company, email, phone, address, city, state, status, owner_id, notes, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        customer.id, customer.code, customer.name, customer.company, customer.email, customer.phone,
        customer.address, customer.city, customer.state, customer.status, customer.ownerId, customer.notes,
        customer.createdAt, createdBy || customer.ownerId,
      ]
    )
    return customer
  },

  async update(id: string, patch: Partial<Customer>): Promise<Customer | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.customers.findIndex((c) => c.id === id)
      if (idx === -1) return null
      memoryStore.customers[idx] = { ...memoryStore.customers[idx], ...patch }
      return memoryStore.customers[idx]
    }

    const updates: string[] = []
    const values: any[] = []
    let p = 1

    if (patch.name !== undefined) { updates.push(`name = $${p++}`); values.push(patch.name) }
    if (patch.company !== undefined) { updates.push(`company = $${p++}`); values.push(patch.company) }
    if (patch.email !== undefined) { updates.push(`email = $${p++}`); values.push(patch.email) }
    if (patch.phone !== undefined) { updates.push(`phone = $${p++}`); values.push(patch.phone) }
    if (patch.address !== undefined) { updates.push(`address = $${p++}`); values.push(patch.address) }
    if (patch.city !== undefined) { updates.push(`city = $${p++}`); values.push(patch.city) }
    if (patch.state !== undefined) { updates.push(`state = $${p++}`); values.push(patch.state) }
    if (patch.status !== undefined) { updates.push(`status = $${p++}`); values.push(patch.status) }
    if (patch.ownerId !== undefined) { updates.push(`owner_id = $${p++}`); values.push(patch.ownerId) }
    if (patch.notes !== undefined) { updates.push(`notes = $${p++}`); values.push(patch.notes) }

    if (updates.length > 0) {
      values.push(id)
      await pool.query(`UPDATE customers SET ${updates.join(', ')} WHERE id = $${p}`, values)
    }
    return this.findById(id)
  },

  async delete(id: string): Promise<boolean> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.customers.findIndex((c) => c.id === id)
      if (idx === -1) return false
      memoryStore.customers.splice(idx, 1)
      return true
    }

    const { rowCount } = await pool.query(`DELETE FROM customers WHERE id = $1`, [id])
    return (rowCount ?? 0) > 0
  },
}

// -------------------------------------------------------------
// LEADS REPO
// -------------------------------------------------------------
export const leadsRepo = {
  async list(ownerId?: string): Promise<Lead[]> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      return ownerId ? memoryStore.leads.filter((l) => l.ownerId === ownerId) : [...memoryStore.leads]
    }

    const query = ownerId
      ? `SELECT id, code, name, company, email, phone, source, status, priority,
                expected_value::float as "expectedValue", owner_id as "ownerId", notes, created_at as "createdAt"
         FROM leads WHERE owner_id = $1 ORDER BY created_at DESC`
      : `SELECT id, code, name, company, email, phone, source, status, priority,
                expected_value::float as "expectedValue", owner_id as "ownerId", notes, created_at as "createdAt"
         FROM leads ORDER BY created_at DESC`
    const { rows } = await pool.query(query, ownerId ? [ownerId] : [])
    return rows
  },

  async findById(id: string): Promise<Lead | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) return memoryStore.leads.find((l) => l.id === id) || null

    const { rows } = await pool.query(
      `SELECT id, code, name, company, email, phone, source, status, priority,
              expected_value::float as "expectedValue", owner_id as "ownerId", notes, created_at as "createdAt"
       FROM leads WHERE id = $1`,
      [id]
    )
    return rows[0] || null
  },

  async create(lead: Lead): Promise<Lead> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      memoryStore.leads.unshift(lead)
      return lead
    }

    await pool.query(
      `INSERT INTO leads (id, code, name, company, email, phone, source, status, priority, expected_value, owner_id, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        lead.id, lead.code, lead.name, lead.company, lead.email, lead.phone,
        lead.source, lead.status, lead.priority, lead.expectedValue, lead.ownerId, lead.notes, lead.createdAt,
      ]
    )
    return lead
  },

  async update(id: string, patch: Partial<Lead>): Promise<Lead | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.leads.findIndex((l) => l.id === id)
      if (idx === -1) return null
      memoryStore.leads[idx] = { ...memoryStore.leads[idx], ...patch }
      return memoryStore.leads[idx]
    }

    const updates: string[] = []
    const values: any[] = []
    let p = 1

    if (patch.name !== undefined) { updates.push(`name = $${p++}`); values.push(patch.name) }
    if (patch.company !== undefined) { updates.push(`company = $${p++}`); values.push(patch.company) }
    if (patch.email !== undefined) { updates.push(`email = $${p++}`); values.push(patch.email) }
    if (patch.phone !== undefined) { updates.push(`phone = $${p++}`); values.push(patch.phone) }
    if (patch.source !== undefined) { updates.push(`source = $${p++}`); values.push(patch.source) }
    if (patch.status !== undefined) { updates.push(`status = $${p++}`); values.push(patch.status) }
    if (patch.priority !== undefined) { updates.push(`priority = $${p++}`); values.push(patch.priority) }
    if (patch.expectedValue !== undefined) { updates.push(`expected_value = $${p++}`); values.push(patch.expectedValue) }
    if (patch.ownerId !== undefined) { updates.push(`owner_id = $${p++}`); values.push(patch.ownerId) }
    if (patch.notes !== undefined) { updates.push(`notes = $${p++}`); values.push(patch.notes) }

    if (updates.length > 0) {
      values.push(id)
      await pool.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = $${p}`, values)
    }
    return this.findById(id)
  },

  async delete(id: string): Promise<boolean> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.leads.findIndex((l) => l.id === id)
      if (idx === -1) return false
      memoryStore.leads.splice(idx, 1)
      return true
    }

    const { rowCount } = await pool.query(`DELETE FROM leads WHERE id = $1`, [id])
    return (rowCount ?? 0) > 0
  },
}

// -------------------------------------------------------------
// OPPORTUNITIES REPO
// -------------------------------------------------------------
export const opportunitiesRepo = {
  async list(ownerId?: string): Promise<Opportunity[]> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      return ownerId ? memoryStore.opportunities.filter((o) => o.ownerId === ownerId) : [...memoryStore.opportunities]
    }

    const query = ownerId
      ? `SELECT id, name, customer_id as "customerId", lead_id as "leadId",
                amount::float, stage, probability, to_char(expected_close_date, 'YYYY-MM-DD') as "expectedCloseDate",
                owner_id as "ownerId", notes, created_at as "createdAt"
         FROM opportunities WHERE owner_id = $1 ORDER BY created_at DESC`
      : `SELECT id, name, customer_id as "customerId", lead_id as "leadId",
                amount::float, stage, probability, to_char(expected_close_date, 'YYYY-MM-DD') as "expectedCloseDate",
                owner_id as "ownerId", notes, created_at as "createdAt"
         FROM opportunities ORDER BY created_at DESC`
    const { rows } = await pool.query(query, ownerId ? [ownerId] : [])
    return rows
  },

  async findById(id: string): Promise<Opportunity | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) return memoryStore.opportunities.find((o) => o.id === id) || null

    const { rows } = await pool.query(
      `SELECT id, name, customer_id as "customerId", lead_id as "leadId",
              amount::float, stage, probability, to_char(expected_close_date, 'YYYY-MM-DD') as "expectedCloseDate",
              owner_id as "ownerId", notes, created_at as "createdAt"
       FROM opportunities WHERE id = $1`,
      [id]
    )
    return rows[0] || null
  },

  async create(opp: Opportunity): Promise<Opportunity> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      memoryStore.opportunities.unshift(opp)
      return opp
    }

    await pool.query(
      `INSERT INTO opportunities (id, name, customer_id, lead_id, amount, stage, probability, expected_close_date, status, owner_id, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        opp.id, opp.name, opp.customerId, opp.leadId || null, opp.amount,
        opp.stage, opp.probability, opp.expectedCloseDate, 'Open', opp.ownerId, opp.notes, opp.createdAt,
      ]
    )
    return opp
  },

  async update(id: string, patch: Partial<Opportunity>): Promise<Opportunity | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.opportunities.findIndex((o) => o.id === id)
      if (idx === -1) return null
      memoryStore.opportunities[idx] = { ...memoryStore.opportunities[idx], ...patch }
      return memoryStore.opportunities[idx]
    }

    const updates: string[] = []
    const values: any[] = []
    let p = 1

    if (patch.name !== undefined) { updates.push(`name = $${p++}`); values.push(patch.name) }
    if (patch.customerId !== undefined) { updates.push(`customer_id = $${p++}`); values.push(patch.customerId) }
    if (patch.leadId !== undefined) { updates.push(`lead_id = $${p++}`); values.push(patch.leadId) }
    if (patch.amount !== undefined) { updates.push(`amount = $${p++}`); values.push(patch.amount) }
    if (patch.stage !== undefined) { updates.push(`stage = $${p++}`); values.push(patch.stage) }
    if (patch.probability !== undefined) { updates.push(`probability = $${p++}`); values.push(patch.probability) }
    if (patch.expectedCloseDate !== undefined) { updates.push(`expected_close_date = $${p++}`); values.push(patch.expectedCloseDate) }
    if (patch.ownerId !== undefined) { updates.push(`owner_id = $${p++}`); values.push(patch.ownerId) }
    if (patch.notes !== undefined) { updates.push(`notes = $${p++}`); values.push(patch.notes) }

    if (updates.length > 0) {
      values.push(id)
      await pool.query(`UPDATE opportunities SET ${updates.join(', ')} WHERE id = $${p}`, values)
    }
    return this.findById(id)
  },

  async delete(id: string): Promise<boolean> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.opportunities.findIndex((o) => o.id === id)
      if (idx === -1) return false
      memoryStore.opportunities.splice(idx, 1)
      return true
    }

    const { rowCount } = await pool.query(`DELETE FROM opportunities WHERE id = $1`, [id])
    return (rowCount ?? 0) > 0
  },
}

// -------------------------------------------------------------
// FOLLOW-UPS REPO
// -------------------------------------------------------------
export const followUpsRepo = {
  async list(ownerId?: string): Promise<FollowUp[]> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      return ownerId ? memoryStore.followUps.filter((f) => f.ownerId === ownerId) : [...memoryStore.followUps]
    }

    const query = ownerId
      ? `SELECT id, related_type as "relatedType", related_id as "relatedId", subject,
                date, type, status, owner_id as "ownerId", notes
         FROM follow_ups WHERE owner_id = $1 ORDER BY date ASC`
      : `SELECT id, related_type as "relatedType", related_id as "relatedId", subject,
                date, type, status, owner_id as "ownerId", notes
         FROM follow_ups ORDER BY date ASC`
    const { rows } = await pool.query(query, ownerId ? [ownerId] : [])
    return rows
  },

  async findById(id: string): Promise<FollowUp | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) return memoryStore.followUps.find((f) => f.id === id) || null

    const { rows } = await pool.query(
      `SELECT id, related_type as "relatedType", related_id as "relatedId", subject,
              date, type, status, owner_id as "ownerId", notes
       FROM follow_ups WHERE id = $1`,
      [id]
    )
    return rows[0] || null
  },

  async create(followUp: FollowUp): Promise<FollowUp> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      memoryStore.followUps.unshift(followUp)
      return followUp
    }

    await pool.query(
      `INSERT INTO follow_ups (id, related_type, related_id, subject, date, type, status, owner_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        followUp.id, followUp.relatedType, followUp.relatedId, followUp.subject,
        followUp.date, followUp.type, followUp.status, followUp.ownerId, followUp.notes,
      ]
    )
    return followUp
  },

  async update(id: string, patch: Partial<FollowUp>): Promise<FollowUp | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.followUps.findIndex((f) => f.id === id)
      if (idx === -1) return null
      memoryStore.followUps[idx] = { ...memoryStore.followUps[idx], ...patch }
      return memoryStore.followUps[idx]
    }

    const updates: string[] = []
    const values: any[] = []
    let p = 1

    if (patch.subject !== undefined) { updates.push(`subject = $${p++}`); values.push(patch.subject) }
    if (patch.relatedType !== undefined) { updates.push(`related_type = $${p++}`); values.push(patch.relatedType) }
    if (patch.relatedId !== undefined) { updates.push(`related_id = $${p++}`); values.push(patch.relatedId) }
    if (patch.date !== undefined) { updates.push(`date = $${p++}`); values.push(patch.date) }
    if (patch.type !== undefined) { updates.push(`type = $${p++}`); values.push(patch.type) }
    if (patch.status !== undefined) { updates.push(`status = $${p++}`); values.push(patch.status) }
    if (patch.ownerId !== undefined) { updates.push(`owner_id = $${p++}`); values.push(patch.ownerId) }
    if (patch.notes !== undefined) { updates.push(`notes = $${p++}`); values.push(patch.notes) }

    if (updates.length > 0) {
      values.push(id)
      await pool.query(`UPDATE follow_ups SET ${updates.join(', ')} WHERE id = $${p}`, values)
    }
    return this.findById(id)
  },

  async delete(id: string): Promise<boolean> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.followUps.findIndex((f) => f.id === id)
      if (idx === -1) return false
      memoryStore.followUps.splice(idx, 1)
      return true
    }

    const { rowCount } = await pool.query(`DELETE FROM follow_ups WHERE id = $1`, [id])
    return (rowCount ?? 0) > 0
  },
}

// -------------------------------------------------------------
// ACTIVITIES REPO
// -------------------------------------------------------------
export const activitiesRepo = {
  async list(ownerId?: string): Promise<Activity[]> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      return ownerId ? memoryStore.activities.filter((a) => a.ownerId === ownerId) : [...memoryStore.activities]
    }

    const query = ownerId
      ? `SELECT id, type, subject, related_type as "relatedType", related_id as "relatedId",
                date, status, owner_id as "ownerId", description
         FROM activities WHERE owner_id = $1 ORDER BY date DESC`
      : `SELECT id, type, subject, related_type as "relatedType", related_id as "relatedId",
                date, status, owner_id as "ownerId", description
         FROM activities ORDER BY date DESC`
    const { rows } = await pool.query(query, ownerId ? [ownerId] : [])
    return rows
  },

  async findById(id: string): Promise<Activity | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) return memoryStore.activities.find((a) => a.id === id) || null

    const { rows } = await pool.query(
      `SELECT id, type, subject, related_type as "relatedType", related_id as "relatedId",
              date, status, owner_id as "ownerId", description
       FROM activities WHERE id = $1`,
      [id]
    )
    return rows[0] || null
  },

  async create(activity: Activity): Promise<Activity> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      memoryStore.activities.unshift(activity)
      return activity
    }

    await pool.query(
      `INSERT INTO activities (id, type, subject, related_type, related_id, date, status, owner_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        activity.id, activity.type, activity.subject, activity.relatedType, activity.relatedId,
        activity.date, activity.status, activity.ownerId, activity.description,
      ]
    )
    return activity
  },

  async update(id: string, patch: Partial<Activity>): Promise<Activity | null> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.activities.findIndex((a) => a.id === id)
      if (idx === -1) return null
      memoryStore.activities[idx] = { ...memoryStore.activities[idx], ...patch }
      return memoryStore.activities[idx]
    }

    const updates: string[] = []
    const values: any[] = []
    let p = 1

    if (patch.type !== undefined) { updates.push(`type = $${p++}`); values.push(patch.type) }
    if (patch.subject !== undefined) { updates.push(`subject = $${p++}`); values.push(patch.subject) }
    if (patch.relatedType !== undefined) { updates.push(`related_type = $${p++}`); values.push(patch.relatedType) }
    if (patch.relatedId !== undefined) { updates.push(`related_id = $${p++}`); values.push(patch.relatedId) }
    if (patch.date !== undefined) { updates.push(`date = $${p++}`); values.push(patch.date) }
    if (patch.status !== undefined) { updates.push(`status = $${p++}`); values.push(patch.status) }
    if (patch.ownerId !== undefined) { updates.push(`owner_id = $${p++}`); values.push(patch.ownerId) }
    if (patch.description !== undefined) { updates.push(`description = $${p++}`); values.push(patch.description) }

    if (updates.length > 0) {
      values.push(id)
      await pool.query(`UPDATE activities SET ${updates.join(', ')} WHERE id = $${p}`, values)
    }
    return this.findById(id)
  },

  async delete(id: string): Promise<boolean> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      const idx = memoryStore.activities.findIndex((a) => a.id === id)
      if (idx === -1) return false
      memoryStore.activities.splice(idx, 1)
      return true
    }

    const { rowCount } = await pool.query(`DELETE FROM activities WHERE id = $1`, [id])
    return (rowCount ?? 0) > 0
  },
}

// -------------------------------------------------------------
// AUDIT LOGS REPO
// -------------------------------------------------------------
export const auditLogsRepo = {
  async list(filters?: { userId?: string; action?: string; entity?: string; limit?: number }): Promise<AuditLog[]> {
    await ensureDb()
    const pool = getPool()
    if (!pool) {
      let res = [...memoryStore.auditLogs]
      if (filters?.userId) res = res.filter((l) => l.userId === filters.userId)
      if (filters?.action) res = res.filter((l) => l.action === filters.action)
      if (filters?.entity) res = res.filter((l) => l.entity === filters.entity)
      return res.slice(0, filters?.limit || 100)
    }

    const where: string[] = []
    const values: any[] = []
    let p = 1

    if (filters?.userId) { where.push(`user_id = $${p++}`); values.push(filters.userId) }
    if (filters?.action) { where.push(`action = $${p++}`); values.push(filters.action) }
    if (filters?.entity) { where.push(`entity = $${p++}`); values.push(filters.entity) }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const limit = filters?.limit || 100
    values.push(limit)

    const { rows } = await pool.query(
      `SELECT id, user_id as "userId", action, entity, record_id as "recordId",
              old_value as "oldValue", new_value as "newValue", ip_address as "ipAddress", timestamp
       FROM audit_logs
       ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${p}`,
      values
    )
    return rows
  },

  async create(log: {
    userId: string
    action: AuditAction
    entity: string
    recordId?: string
    oldValue?: string
    newValue?: string
    ipAddress?: string
  }): Promise<AuditLog> {
    await ensureDb()
    const item: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      recordId: log.recordId || '—',
      oldValue: log.oldValue || '—',
      newValue: log.newValue || '—',
      ipAddress: log.ipAddress || '127.0.0.1',
      timestamp: new Date().toISOString(),
    }

    const pool = getPool()
    if (!pool) {
      memoryStore.auditLogs.unshift(item)
      return item
    }

    await pool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity, record_id, old_value, new_value, ip_address, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [item.id, item.userId, item.action, item.entity, item.recordId, item.oldValue, item.newValue, item.ipAddress, item.timestamp]
    )
    return item
  },
}
