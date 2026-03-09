import { useEffect, useState } from 'react'
import { supabase, Budget, Transaction } from '../lib/supabase'

const CATEGORIES = [
  'Housing', 'Food & Drink', 'Transport', 'Shopping',
  'Utilities', 'Entertainment', 'Health', 'Other'
]

const CAT_ICONS: Record<string, string> = {
  Housing: '🏠', 'Food & Drink': '🍔', Transport: '🚗',
  Shopping: '🛍️', Utilities: '⚡', Entertainment: '🎬',
  Health: '💊', Other: '📦',
}

interface Props { userId: string }

export default function Budgets({ userId }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [form, setForm] = useState({ category: 'Housing', limit_amount: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    const [{ data: b }, { data: t }] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId),
    ])
    setBudgets(b || [])
    setTransactions(t || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [userId])

  const getSpent = (category: string) =>
    transactions
      .filter(t => t.category === category && t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0)

  const openAdd = () => {
    setEditing(null)
    setForm({ category: 'Housing', limit_amount: '' })
    setShowModal(true)
  }

  const openEdit = (b: Budget) => {
    setEditing(b)
    setForm({ category: b.category, limit_amount: b.limit_amount.toString() })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.limit_amount) return
    setSaving(true)
    if (editing) {
      await supabase.from('budgets').update({
        category: form.category,
        limit_amount: parseFloat(form.limit_amount)
      }).eq('id', editing.id)
    } else {
      await supabase.from('budgets').insert({
        user_id: userId,
        category: form.category,
        limit_amount: parseFloat(form.limit_amount)
      })
    }
    await fetchData()
    setSaving(false)
    setShowModal(false)
  }

  const del = async (id: string) => {
    if (!window.confirm('Delete this budget?')) return
    await supabase.from('budgets').delete().eq('id', id)
    await fetchData()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.limit_amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + getSpent(b.category), 0)

  if (loading) return <p className="text-center text-gray-400 py-20">Loading...</p>

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Budgets</h1>
          <p className="text-gray-500 text-sm">Track spending against your limits</p>
        </div>
        <button onClick={openAdd} className="bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
          + Add Budget
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium mb-1">Total Budget</p>
          <p className="text-xl font-extrabold text-gray-900">${totalBudget.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">Monthly limit</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium mb-1">Total Spent</p>
          <p className="text-xl font-extrabold text-gray-900">${totalSpent.toFixed(2)}</p>
          <p className={`text-xs font-medium ${totalSpent > totalBudget ? 'text-red-500' : 'text-green-500'}`}>
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}% used
          </p>
        </div>
      </div>

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-gray-400 text-sm mb-3">No budgets yet</p>
          <button onClick={openAdd} className="bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl">
            + Add Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {budgets.map(b => {
            const spent = getSpent(b.category)
            const pct = Math.min(spent / b.limit_amount, 1)
            const barColor = pct > 0.9 ? '#ef4444' : pct > 0.7 ? '#f59e0b' : '#22c55e'
            const remaining = b.limit_amount - spent

            return (
              <div key={b.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${pct > 1 ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-lg mb-0.5">{CAT_ICONS[b.category] || '📦'}</p>
                    <p className="font-bold text-sm text-gray-900">{b.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="text-gray-300 hover:text-gray-500 text-xs">✏️</button>
                    <button onClick={() => del(b.id)} className="text-red-300 hover:text-red-500 text-xs">🗑️</button>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>${spent.toFixed(0)}</span>
                  <span>${b.limit_amount}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct * 100}%`, background: barColor }}
                  />
                </div>

                <p className={`text-xs font-medium ${remaining < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {remaining < 0
                    ? `⚠️ Over by $${Math.abs(remaining).toFixed(0)}`
                    : `$${remaining.toFixed(0)} left`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-900">{editing ? 'Edit Budget' : 'Add Budget'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 bg-gray-100 rounded-lg w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Limit ($)</label>
                <input type="number" value={form.limit_amount} onChange={e => setForm(p => ({ ...p, limit_amount: e.target.value }))}
                  placeholder="e.g. 500"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <button onClick={save} disabled={saving}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}