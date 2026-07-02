import { format, parseISO } from 'date-fns'

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatINRShort(amount: number): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (absAmount >= 1_00_00_000) {
    return `${sign}₹${(absAmount / 1_00_00_000).toFixed(2)}Cr`
  }
  if (absAmount >= 1_00_000) {
    return `${sign}₹${(absAmount / 1_00_000).toFixed(2)}L`
  }
  if (absAmount >= 1_000) {
    return `${sign}₹${(absAmount / 1_000).toFixed(1)}K`
  }
  return formatINR(amount)
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy, hh:mm a')
  } catch {
    return dateStr
  }
}

export function maskAccount(num: string): string {
  if (!num) return '•••• ••••'
  return '•••• ' + num.slice(-4)
}

export function maskCardNumber(num: string): string {
  if (!num) return '•••• •••• •••• ••••'
  const clean = num.replace(/\s/g, '')
  const last4 = clean.slice(-4)
  return `•••• •••• •••• ${last4}`
}

export function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    food: '🍽️',
    dining: '🍽️',
    shopping: '🛍️',
    travel: '✈️',
    transport: '🚗',
    fuel: '⛽',
    entertainment: '🎬',
    healthcare: '🏥',
    medical: '🏥',
    education: '📚',
    utilities: '💡',
    rent: '🏠',
    groceries: '🛒',
    salary: '💰',
    investment: '📈',
    insurance: '🛡️',
    transfer: '↔️',
    deposit: '⬆️',
    withdrawal: '⬇️',
    emi: '📅',
    recharge: '📱',
    subscription: '🔄',
    other: '💳',
  }
  return map[category?.toLowerCase()] ?? '💳'
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    food: 'text-orange-500 bg-orange-50',
    dining: 'text-orange-500 bg-orange-50',
    shopping: 'text-purple-500 bg-purple-50',
    travel: 'text-sky-500 bg-sky-50',
    transport: 'text-blue-500 bg-blue-50',
    fuel: 'text-amber-500 bg-amber-50',
    entertainment: 'text-pink-500 bg-pink-50',
    healthcare: 'text-red-500 bg-red-50',
    medical: 'text-red-500 bg-red-50',
    education: 'text-indigo-500 bg-indigo-50',
    utilities: 'text-yellow-600 bg-yellow-50',
    rent: 'text-teal-500 bg-teal-50',
    groceries: 'text-green-500 bg-green-50',
    salary: 'text-emerald-600 bg-emerald-50',
    investment: 'text-blue-600 bg-blue-50',
    insurance: 'text-violet-500 bg-violet-50',
    transfer: 'text-slate-500 bg-slate-50',
    deposit: 'text-emerald-500 bg-emerald-50',
    withdrawal: 'text-red-500 bg-red-50',
    other: 'text-gray-500 bg-gray-50',
  }
  return map[category?.toLowerCase()] ?? 'text-gray-500 bg-gray-50'
}

export function getModeBadge(mode: string): string {
  const map: Record<string, string> = {
    NEFT: 'bg-blue-100 text-blue-700',
    RTGS: 'bg-purple-100 text-purple-700',
    IMPS: 'bg-green-100 text-green-700',
    UPI: 'bg-orange-100 text-orange-700',
    CASH: 'bg-gray-100 text-gray-700',
    CHEQUE: 'bg-yellow-100 text-yellow-700',
  }
  return map[mode?.toUpperCase()] ?? 'bg-gray-100 text-gray-600'
}

export function getHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
