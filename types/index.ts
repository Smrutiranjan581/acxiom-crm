export type Role = 'Admin' | 'Manager' | 'SalesExecutive'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  active: boolean
  lockedOut: boolean
  createdAt: string
  lastLogin: string
}

export type CustomerStatus = 'Active' | 'Inactive' | 'Prospect' | 'Blocked'

export interface Customer {
  id: string
  code: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  status: CustomerStatus
  ownerId: string
  notes: string
  createdAt: string
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted' | 'Lost'
export type LeadSource = 'Website' | 'Referral' | 'Cold Call' | 'Social Media' | 'Event' | 'Email Campaign'
export type Priority = 'Low' | 'Medium' | 'High'

export interface Lead {
  id: string
  code: string
  name: string
  company: string
  email: string
  phone: string
  source: LeadSource
  status: LeadStatus
  priority: Priority
  expectedValue: number
  ownerId: string
  notes: string
  createdAt: string
}

export type OpportunityStage = 'Qualification' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'

export interface Opportunity {
  id: string
  name: string
  customerId: string
  leadId?: string
  stage: OpportunityStage
  amount: number
  probability: number
  expectedCloseDate: string
  ownerId: string
  notes: string
  createdAt: string
}

export type FollowUpStatus = 'Planned' | 'Completed' | 'Missed' | 'Cancelled'
export type ActivityType = 'Call' | 'Meeting' | 'Email' | 'Task'
export type RelatedType = 'Customer' | 'Lead' | 'Opportunity'

export interface FollowUp {
  id: string
  subject: string
  relatedType: RelatedType
  relatedId: string
  date: string
  type: ActivityType
  status: FollowUpStatus
  ownerId: string
  notes: string
}

export type ActivityStatus = 'Completed' | 'Pending' | 'In Progress'

export interface Activity {
  id: string
  type: ActivityType
  subject: string
  relatedType: RelatedType
  relatedId: string
  date: string
  status: ActivityStatus
  ownerId: string
  description: string
}

export type AuditAction = 'Login' | 'Failed Login' | 'Create' | 'Update' | 'Delete' | 'Role Change' | 'Logout'

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  entity: string
  recordId: string
  oldValue: string
  newValue: string
  ipAddress: string
  timestamp: string
}
