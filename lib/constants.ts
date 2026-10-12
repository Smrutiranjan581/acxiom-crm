export const CUSTOMER_STATUSES = ['Active', 'Inactive', 'Prospect', 'Blocked'] as const
export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'] as const
export const LEAD_SOURCES = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Event', 'Email Campaign'] as const
export const PRIORITIES = ['Low', 'Medium', 'High'] as const
export const STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const
export const OPEN_STAGES = ['Qualification', 'Proposal', 'Negotiation'] as const
export const FOLLOW_UP_STATUSES = ['Planned', 'Completed', 'Missed', 'Cancelled'] as const
export const ACTIVITY_TYPES = ['Call', 'Meeting', 'Email', 'Task'] as const
export const ACTIVITY_STATUSES = ['Pending', 'In Progress', 'Completed'] as const
export const RELATED_TYPES = ['Customer', 'Lead', 'Opportunity'] as const
export const ROLES = ['Admin', 'Manager', 'SalesExecutive'] as const

export const STAGE_PROBABILITY: Record<string, number> = {
  Qualification: 20,
  Proposal: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
}
