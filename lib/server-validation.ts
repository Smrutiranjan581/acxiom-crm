import { customersRepo } from '@/lib/db/repo'
import { todayISO } from '@/lib/format'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/

export class ValidationError extends Error {
  status: number
  field?: string
  constructor(message: string, status = 400, field?: string) {
    super(message)
    this.status = status
    this.field = field
  }
}

export const serverValidation = {
  // Validate Customer
  async validateCustomer(
    data: {
      name?: string
      email?: string
      phone?: string
      company?: string
      status?: string
    },
    excludeId?: string
  ) {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Customer name is required', 400, 'name')
    }
    if (data.name.trim().length > 100) {
      throw new ValidationError('Customer name cannot exceed 100 characters', 400, 'name')
    }

    if (!data.email || data.email.trim() === '') {
      throw new ValidationError('Customer email is required', 400, 'email')
    }
    if (!EMAIL_RE.test(data.email.trim())) {
      throw new ValidationError('Enter a valid email address', 400, 'email')
    }

    if (!data.phone || data.phone.trim() === '') {
      throw new ValidationError('Customer phone is required', 400, 'phone')
    }
    if (!PHONE_RE.test(data.phone.trim())) {
      throw new ValidationError('Enter a valid phone number (10–15 digits)', 400, 'phone')
    }

    // Uniqueness checks (Section 17.5 & 17.7)
    const existingEmail = await customersRepo.findByEmail(data.email, excludeId)
    if (existingEmail) {
      throw new ValidationError('A customer with this email address already exists', 409, 'email')
    }

    const existingPhone = await customersRepo.findByPhone(data.phone, excludeId)
    if (existingPhone) {
      throw new ValidationError('A customer with this phone number already exists', 409, 'phone')
    }
  },

  // Validate Lead
  validateLead(data: {
    name?: string
    email?: string
    phone?: string
    status?: string
    expectedValue?: number | string
  }) {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Lead name is mandatory', 400, 'name')
    }
    if (data.email && !EMAIL_RE.test(data.email.trim())) {
      throw new ValidationError('Enter a valid email address', 400, 'email')
    }
    if (data.phone && !PHONE_RE.test(data.phone.trim())) {
      throw new ValidationError('Enter a valid phone number (10–15 digits)', 400, 'phone')
    }

    const validStatuses = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost']
    if (data.status && !validStatuses.includes(data.status)) {
      throw new ValidationError(`Invalid lead status. Allowed: ${validStatuses.join(', ')}`, 400, 'status')
    }

    if (data.expectedValue !== undefined) {
      const val = Number(data.expectedValue)
      if (Number.isNaN(val) || val < 0) {
        throw new ValidationError('Expected value must be a valid positive number', 400, 'expectedValue')
      }
    }
  },

  // Validate Opportunity
  validateOpportunity(data: {
    name?: string
    amount?: number | string
    probability?: number | string
    expectedCloseDate?: string
    stage?: string
  }) {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Opportunity name is required', 400, 'name')
    }

    const amount = Number(data.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      throw new ValidationError('Opportunity Amount must be greater than 0', 400, 'amount')
    }

    if (data.probability !== undefined && data.probability !== '') {
      const prob = Number(data.probability)
      if (Number.isNaN(prob) || prob < 0 || prob > 100) {
        throw new ValidationError('Probability must be between 0 and 100', 400, 'probability')
      }
    }

    if (data.expectedCloseDate) {
      const today = todayISO()
      const isPast = data.expectedCloseDate.slice(0, 10) < today
      const isActive = !['Won', 'Lost'].includes(data.stage || 'Qualification')
      if (isPast && isActive) {
        throw new ValidationError('Expected Close Date cannot be in the past for an active Opportunity', 400, 'expectedCloseDate')
      }
    }
  },

  // Validate Follow-Up
  validateFollowUp(data: {
    subject?: string
    date?: string
    status?: string
  }) {
    if (!data.subject || data.subject.trim() === '') {
      throw new ValidationError('Follow-up subject is required', 400, 'subject')
    }

    if (data.date) {
      const today = todayISO()
      const isPast = data.date.slice(0, 10) < today
      const isPlannedOrNew = !data.status || data.status === 'Planned'
      if (isPast && isPlannedOrNew) {
        throw new ValidationError('Follow-up date cannot be earlier than today for a new/planned follow-up', 400, 'date')
      }
    }
  },
}
