# AcxiomCRM — Enterprise Full-Stack CRM Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://acxiom-crm-alpha.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/PostgreSQL-Neon%20DB-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)

A comprehensive, production-ready full-stack Customer Relationship Management (CRM) application built according to enterprise functional requirements. Featuring multi-tier role-based access control (RBAC), sales pipeline tracking, customer 360 view, activity logging, audit trails, and interactive analytics reporting.

---

## 🚀 Live Application

- **Production URL**: **[https://acxiom-crm-alpha.vercel.app](https://acxiom-crm-alpha.vercel.app)**
- **GitHub Repository**: **[https://github.com/Smrutiranjan581/acxiom-crm](https://github.com/Smrutiranjan581/acxiom-crm)**

---

## 🔑 Demo Login Credentials

You can log in and test different authorization permissions using any of the pre-configured role accounts:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `aarav.mehta@acxiomcrm.com` | `Demo@123` | Full system access, User Management, Audit Logs, Delete permissions |
| **Manager** | `priya.sharma@acxiomcrm.com` | `Demo@123` | Team pipeline overview, Reports, Customer & Deal management |
| **Sales Executive** | `rohan.verma@acxiomcrm.com` | `Demo@123` | Assigned Leads, Opportunities, Activities, and Follow-ups |

---

## ✨ Key Features

- **Dashboard & Analytics**: Real-time KPI summaries, Won vs Open Revenue tracking, dynamic pipeline stage distribution, and upcoming follow-ups schedule.
- **Sales Pipeline Management**: Complete deal lifecycles across Qualification, Proposal, Negotiation, Closed Won, and Closed Lost stages.
- **Lead Qualification & Conversion**: Capture leads, track sources (Website, Referral, LinkedIn), and convert qualified leads to Customers & Opportunities in one click.
- **Customer 360 View**: Centralized directory with activity history, linked deals, contact records, and quick-filter statuses.
- **Follow-ups & Activity Logging**: Schedule calls, meetings, tasks, and follow-ups with overdue alerts and automated chronological timelines.
- **Multi-Role RBAC**: Strict server-side and client-side authorization rules for Admin, Manager, and Sales Executive.
- **Security & Audit Logs**: Immutable audit log records tracking all entity creations, updates, and deletions with timestamps and user attribution.
- **Export & Reporting**: 8 comprehensive analytical views with real-time CSV data export.
- **Clean UI & Modern UX**: Centered Dialog Modals with smooth backdrop animations, accessible Shadcn/Base-UI components, Dark/Light theme toggle, and keyboard shortcuts.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 16 (App Router & Turbopack), React 19, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend / API**: Next.js Route Handlers (RESTful architecture) with server-side validation.
- **Database & Storage**: PostgreSQL via `@neondatabase/serverless` (Neon DB) with automatic schema migration and resilient in-memory fallback.
- **Authentication**: JWT session tokens via `jose`, password hashing via `bcryptjs`.
- **Deployment**: Vercel Serverless Edge infrastructure.

---

## 💻 Local Setup & Development

```bash
# 1. Clone repository
git clone https://github.com/Smrutiranjan581/acxiom-crm.git
cd acxiom-crm

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for Neon DB connection)
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application locally.
