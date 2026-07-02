import { useEffect, useState, useMemo } from 'react'
import { Users, Shield, CheckCircle, XCircle, PlusCircle, Pencil, Trash2, Eye, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import type { AdminCreateUserPayload, AdminUpdateUserPayload } from '../../api/admin'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../utils/formatters'
import type { User } from '../../types'
import clsx from 'clsx'

const KYC_OPTIONS = ['verified', 'pending', 'rejected']

function AddUserModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: (u: User) => void }) {
  const [form, setForm] = useState<AdminCreateUserPayload>({
    email: '', full_name: '', password: '', mobile: '', role: 'customer', kyc_status: 'verified', create_account: true,
  })
  const [saving, setSaving] = useState(false)

  function reset() {
    setForm({ email: '', full_name: '', password: '', mobile: '', role: 'customer', kyc_status: 'verified', create_account: true })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.full_name || !form.password || !form.mobile) {
      toast.error('All fields are required'); return
    }
    setSaving(true)
    try {
      const user = await adminApi.createUser(form)
      toast.success(`User ${user.full_name} created successfully`)
      onCreated(user)
      reset()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose() }} title="Add New User" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
            <input className="input w-full" placeholder="Rajesh Kumar" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mobile</label>
            <input className="input w-full" placeholder="9876543210" value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input className="input w-full" type="email" placeholder="user@example.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
          <input className="input w-full" type="password" placeholder="Min 6 characters" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <select className="input w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">KYC Status</label>
            <select className="input w-full" value={form.kyc_status} onChange={(e) => setForm({ ...form, kyc_status: e.target.value })}>
              {KYC_OPTIONS.map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={form.create_account}
            onChange={(e) => setForm({ ...form, create_account: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600" />
          Auto-create savings account
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose() }}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditUserModal({ user, isOpen, onClose, onUpdated }: { user: User | null; isOpen: boolean; onClose: () => void; onUpdated: (u: User) => void }) {
  const [form, setForm] = useState<AdminUpdateUserPayload>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name, email: user.email, mobile: user.mobile, kyc_status: user.kyc_status, password: '' })
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const payload: AdminUpdateUserPayload = { ...form }
    if (!payload.password) delete payload.password
    try {
      const updated = await adminApi.updateUser(user.id, payload)
      toast.success('User updated successfully')
      onUpdated(updated)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
            <input className="input w-full" value={form.full_name ?? ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mobile</label>
            <input className="input w-full" value={form.mobile ?? ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input className="input w-full" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
          <input className="input w-full" type="password" placeholder="••••••••" value={form.password ?? ''}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">KYC Status</label>
          <select className="input w-full" value={form.kyc_status ?? 'verified'} onChange={(e) => setForm({ ...form, kyc_status: e.target.value })}>
            {KYC_OPTIONS.map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DeleteConfirmModal({ user, isOpen, onClose, onDeleted }: { user: User | null; isOpen: boolean; onClose: () => void; onDeleted: (id: number) => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!user) return
    setDeleting(true)
    try {
      await adminApi.deleteUser(user.id)
      toast.success(`${user.full_name} deleted`)
      onDeleted(user.id)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete User" size="sm">
      <div className="p-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 size={24} className="text-red-600" />
        </div>
        <p className="text-center text-gray-700 mb-1 font-medium">Delete <span className="text-gray-900">{user?.full_name}</span>?</p>
        <p className="text-center text-sm text-gray-400 mb-6">This will permanently delete the user and all their accounts, loans, and cards.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobile?.toLowerCase().includes(q)
    )
  }, [users, search])

  async function toggleActive(userId: number) {
    setToggling(userId)
    try {
      const updated = await adminApi.toggleUserActive(userId)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success(`User ${updated.is_active ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to toggle user status')
    } finally {
      setToggling(null)
    }
  }

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Users</h1>
                <p className="text-gray-500 text-sm">{users.length} total users</p>
              </div>
            </div>
            <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
              <PlusCircle size={16} />
              Add User
            </button>
          </div>

          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input w-full pl-9 max-w-sm"
              placeholder="Search by name, email or mobile…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
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
                      {['User', 'Mobile', 'Role', 'KYC', 'Joined', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-gray-400 py-10 text-sm">
                          {search ? `No users matching "${search}"` : 'No users found'}
                        </td>
                      </tr>
                    )}
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                              {user.full_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 font-mono">{user.mobile ?? '—'}</td>
                        <td className="px-4 py-4">
                          <span className={clsx(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                            user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          )}>
                            {user.role === 'admin' && <Shield size={10} />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                            user.kyc_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                            user.kyc_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-600'
                          )}>
                            {user.kyc_status ?? 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-400">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-4">
                          <span className={clsx(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                            user.is_active ? 'badge-active' : 'badge-frozen'
                          )}>
                            {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {user.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {user.role === 'customer' && (
                              <button
                                onClick={() => navigate(`/admin/users/${user.id}/profile`)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View full profile">
                                <Eye size={15} />
                              </button>
                            )}
                            <button onClick={() => setEditUser(user)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit user">
                              <Pencil size={15} />
                            </button>
                            {user.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => toggleActive(user.id)}
                                  disabled={toggling === user.id}
                                  className={clsx(
                                    'text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50',
                                    user.is_active
                                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  )}
                                >
                                  {toggling === user.id ? '…' : user.is_active ? 'Disable' : 'Enable'}
                                </button>
                                <button onClick={() => setDeleteUser(user)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete user">
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
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

      <AddUserModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(u) => setUsers((prev) => [u, ...prev])}
      />
      <EditUserModal
        user={editUser}
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onUpdated={(u) => setUsers((prev) => prev.map((x) => x.id === u.id ? u : x))}
      />
      <DeleteConfirmModal
        user={deleteUser}
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onDeleted={(id) => setUsers((prev) => prev.filter((x) => x.id !== id))}
      />
    </BankingLayout>
  )
}
