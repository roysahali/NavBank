import { useEffect, useState } from 'react'
import { Landmark, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import Modal from '../../components/ui/Modal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { formatINR, formatDate } from '../../utils/formatters'
import type { AccountWithOwner, User } from '../../types'
import clsx from 'clsx'

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<AccountWithOwner[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  // Deposit modal
  const [depositModal, setDepositModal] = useState<{ accountId: number; accountNum: string } | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')
  const [depositing, setDepositing] = useState(false)

  // Create modal
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ user_id: '', account_type: 'savings', initial_balance: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([adminApi.getAccounts(), adminApi.getUsers()])
      .then(([accs, us]) => {
        setAccounts(accs)
        setUsers(us.filter((u) => u.role === 'customer'))
      })
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleFreeze(acc: AccountWithOwner) {
    setActionId(acc.id)
    try {
      if (acc.status === 'active') {
        await adminApi.freezeAccount(acc.id)
        setAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, status: 'frozen' as const } : a))
        toast.success('Account frozen')
      } else {
        await adminApi.unfreezeAccount(acc.id)
        setAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, status: 'active' as const } : a))
        toast.success('Account unfrozen')
      }
    } catch {
      toast.error('Action failed')
    } finally {
      setActionId(null)
    }
  }

  async function handleDeposit() {
    if (!depositModal) return
    setDepositing(true)
    try {
      await adminApi.deposit({
        account_id: depositModal.accountId,
        amount: parseFloat(depositAmount),
        description: depositNote || 'Admin deposit',
      })
      const updated = await adminApi.getAccounts()
      setAccounts(updated)
      setDepositModal(null)
      setDepositAmount('')
      setDepositNote('')
      toast.success('Deposit successful!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Deposit failed')
    } finally {
      setDepositing(false)
    }
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const acc = await adminApi.createAccount({
        user_id: parseInt(createForm.user_id),
        account_type: createForm.account_type,
        initial_balance: parseFloat(createForm.initial_balance || '0'),
      })
      setAccounts((prev) => [acc, ...prev])
      setCreateModal(false)
      setCreateForm({ user_id: '', account_type: 'savings', initial_balance: '' })
      toast.success('Account created!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                <Landmark size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Accounts</h1>
                <p className="text-gray-500 text-sm">{accounts.length} total accounts</p>
              </div>
            </div>
            <button
              onClick={() => setCreateModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={14} />
              New Account
            </button>
          </div>
        </ScrollReveal>

        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <ScrollReveal>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Account', 'Owner', 'Type', 'Balance', 'Status', 'Opened', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs text-gray-900">{acc.account_number}</div>
                          {acc.ifsc_code && <div className="text-[10px] text-gray-400 mt-0.5">{acc.ifsc_code}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-medium text-gray-900">{acc.owner_name}</div>
                          <div className="text-xs text-gray-400">{acc.owner_email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                            {acc.account_type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{formatINR(acc.balance)}</td>
                        <td className="px-4 py-3.5">
                          <span className={acc.status === 'active' ? 'badge-active' : 'badge-frozen'}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-400">{formatDate(acc.created_at)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDepositModal({ accountId: acc.id, accountNum: acc.account_number })}
                              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              Deposit
                            </button>
                            <button
                              onClick={() => toggleFreeze(acc)}
                              disabled={actionId === acc.id}
                              className={clsx(
                                'text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50',
                                acc.status === 'active'
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              )}
                            >
                              {actionId === acc.id ? '…' : acc.status === 'active' ? 'Freeze' : 'Unfreeze'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={!!depositModal}
        onClose={() => { setDepositModal(null); setDepositAmount(''); setDepositNote('') }}
        title="Admin Deposit"
        size="sm"
      >
        {depositModal && (
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <span className="text-gray-400">To account:</span>{' '}
              <span className="font-mono font-medium">{depositModal.accountNum}</span>
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="label">Note</label>
              <input
                type="text"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                className="input"
                placeholder="Reason for deposit"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDepositModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {depositing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Deposit'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Account Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Account"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Customer</label>
            <select
              value={createForm.user_id}
              onChange={(e) => setCreateForm((f) => ({ ...f, user_id: e.target.value }))}
              className="input"
              required
            >
              <option value="">Select customer…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Account Type</label>
            <select
              value={createForm.account_type}
              onChange={(e) => setCreateForm((f) => ({ ...f, account_type: e.target.value }))}
              className="input"
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>
          <div>
            <label className="label">Initial Balance (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={createForm.initial_balance}
                onChange={(e) => setCreateForm((f) => ({ ...f, initial_balance: e.target.value }))}
                className="input pl-8"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={creating || !createForm.user_id}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Create Account'}
            </button>
          </div>
        </div>
      </Modal>
    </BankingLayout>
  )
}
