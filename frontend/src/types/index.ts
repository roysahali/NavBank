export interface User {
  id: number
  email: string
  full_name: string
  role: 'customer' | 'admin'
  mobile: string
  kyc_status: string
  is_active: boolean
  created_at: string
}

export interface Account {
  id: number
  account_number: string
  user_id: number
  account_type: 'savings' | 'current'
  balance: number
  status: 'active' | 'frozen'
  ifsc_code: string
  branch_name: string
  interest_rate: number
  created_at: string
}

export interface Transaction {
  id: number
  from_account_id: number | null
  to_account_id: number | null
  amount: number
  transaction_type: string
  transfer_mode: string | null
  category: string | null
  reference_number: string | null
  beneficiary_name: string | null
  status: string
  description: string
  created_at: string
}

export interface Beneficiary {
  id: number
  user_id: number
  name: string
  account_number: string
  ifsc_code: string
  bank_name: string
  alias: string | null
  is_active: boolean
  created_at: string
}

export interface UpiVpa {
  id: number
  vpa: string
  linked_account_id: number
  is_primary: boolean
  is_active: boolean
  created_at: string
}

export interface UpiTransaction {
  id: number
  sender_vpa: string
  receiver_vpa: string
  amount: number
  note: string | null
  upi_reference: string
  status: string
  created_at: string
}

export interface CreditCard {
  id: number
  user_id: number
  card_number: string
  card_type: string
  card_variant: string
  credit_limit: number
  outstanding_amount: number
  available_limit: number
  billing_date: number
  due_date_day: number
  minimum_due: number
  reward_points: number
  status: string
  cvv: string
  expiry_month: number
  expiry_year: number
  created_at: string
}

export interface CreditCardTransaction {
  id: number
  card_id: number
  amount: number
  merchant_name: string
  category: string
  transaction_type: string
  status: string
  created_at: string
}

export interface Loan {
  id: number
  user_id: number
  loan_type: 'home' | 'personal' | 'auto'
  loan_number: string
  principal_amount: number
  outstanding_amount: number
  interest_rate: number
  tenure_months: number
  emi_amount: number
  disbursed_date: string | null
  next_due_date: string
  status: string
  purpose: string | null
  linked_account_id: number
  created_at: string
}

export interface EmiScheduleItem {
  installment_number: number
  due_date: string
  emi_amount: number
  principal: number
  interest: number
  outstanding_after: number
  status: string
}

export interface DashboardSummary {
  total_balance: number
  accounts_count: number
  savings_balance: number
  current_balance: number
  total_cards: number
  active_loans: number
  total_outstanding_loans: number
}

export interface SpendingCategory {
  category: string
  amount: number
  percentage: number
}

export interface MonthlyFlow {
  month: string
  inflow: number
  outflow: number
}

export interface AiInsight {
  title: string
  message: string
  type: string
}

export interface AdminStats {
  total_users: number
  total_accounts: number
  total_balance: number
  total_transactions: number
  total_cards: number
  total_loans: number
}

export interface AccountWithOwner extends Account {
  owner_name: string
  owner_email: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  is_read: boolean
  related_url: string | null
  created_at: string
}

export interface SupportMessage {
  id: number
  ticket_id: number
  sender_id: number
  sender_name: string
  message: string
  is_admin_reply: boolean
  created_at: string
}

export interface SupportTicket {
  id: number
  user_id: number
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[]
}
