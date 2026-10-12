-- AcxiomCRM PostgreSQL Database Schema
-- Compatible with Neon PostgreSQL (https://neon.tech) and standard Postgres

-- 1. Users Table (Authentication, Roles, Lockout)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(30) NOT NULL DEFAULT 'SalesExecutive', -- 'Admin', 'Manager', 'SalesExecutive'
    active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_count INT NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ
);

-- 2. Customers Table
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
    status VARCHAR(30) NOT NULL DEFAULT 'Prospect', -- 'Active', 'Inactive', 'Prospect', 'Blocked'
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    source VARCHAR(50) NOT NULL DEFAULT 'Website', -- 'Website', 'Referral', 'Cold Call', 'Social Media', 'Event', 'Email Campaign'
    status VARCHAR(30) NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
    expected_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    stage VARCHAR(50) NOT NULL DEFAULT 'Qualification', -- 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'
    probability INT NOT NULL DEFAULT 20 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open', -- 'Open', 'Won', 'Lost'
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Follow-Ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    related_type VARCHAR(30) NOT NULL, -- 'Customer', 'Lead', 'Opportunity'
    related_id VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'Call', -- 'Call', 'Meeting', 'Email', 'Task'
    status VARCHAR(30) NOT NULL DEFAULT 'Planned', -- 'Planned', 'Completed', 'Missed', 'Cancelled'
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Activities Table
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(30) NOT NULL DEFAULT 'Call', -- 'Call', 'Meeting', 'Email', 'Task'
    subject VARCHAR(200) NOT NULL,
    related_type VARCHAR(30) NOT NULL, -- 'Customer', 'Lead', 'Opportunity'
    related_id VARCHAR(50) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending', -- 'Completed', 'Pending', 'In Progress'
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Log Table (Append-only, tracks security & CRM changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'Login', 'Failed Login', 'Create', 'Update', 'Delete', 'Role Change', 'Logout', 'Security'
    entity VARCHAR(50) NOT NULL, -- 'Customer', 'Lead', 'Opportunity', 'Follow-Up', 'Activity', 'User', 'Session'
    record_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_follow_ups_owner ON follow_ups(owner_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(date);
CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
