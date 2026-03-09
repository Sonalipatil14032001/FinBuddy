import { useEffect, useState } from 'react'
import { supabase, Transaction } from '../lib/supabase'

const CATEGORIES = [
  'Income', 'Housing', 'Food & Drink', 'Transport',
  'Shopping', 'Utilities', 'Entertainment', 'Health', 'Other'
]

const CAT_ICONS: Record<string, string> = {
  Housing: '🏠', 'Food & Drink': '🍔', Transport: '🚗',
  Shopping: '🛍️', Utilities: '⚡', Entertainment: '🎬',
  Health: '💊', Income: '💰', Other: '📦',
}

interface Props { userId: string }

const emptyForm = {
  description: '', category: 'Shopping',
  amount: '', date: new Date().toISOString().split('T')[0], notes: ''
}

export default function Transactions({ userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [saving, setSaving] = useState(false)

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [userId])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (t: Transaction) => {
    setEditing(t)
    setForm({
      description: t.description, category: t.category,
      amount: Math.abs(t.amount).toString(),
      date: t.date, notes: t.notes
    })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    const amount = form.category === 'Income'
      ? Math.abs(parseFloat(form.amount))
      : -Math.abs(parseFloat(form.amount))

    if (editing) {
      await supabase.from('transactions').update({
        description: form.description, category: form.category,
        amount, date: form.date, notes: form.notes
      }).eq('id', editing.id)
    } else {
      await supabase.from('transactions').insert({
        user_id: userId, description: form.description,
        category: form.category, amount, date: form.date, notes: form.notes
      })
    }
    await fetchTransactions()
    setSaving(false)
    setShowModal(false)
  }

  const del = async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return
    await supabase.from('transactions').delete().eq('id', id)
    await fetchTransactions()
  }

  const filtered = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || t.category === catFilter
    return matchSearch && matchCat
  })

  const exportCSV = () => {
    const rows = ['Description,Category,Date,Amount',
      ...filtered.map(t => `"${t.description}",${t.category},${t.date},${t.amount}`)
    ].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows)
    a.download = 'finbuddy-transactions.csv'
    a.click()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-gray-500 text-sm">{filtered.length} of {transactions.length} shown</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-gray-100 text-gray-600 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors">
            📥 CSV
          </button>
          <button onClick={openAdd} className="bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
            + Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search..."
          className="flex-1 min-w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <select
          value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white text-gray-700"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-12">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-gray-400 text-sm">No transactions yet</p>
            <button onClick={openAdd} className="mt-3 text-blue-500 font-semibold text-sm">+ Add your first one</button>
          </div>
        ) : (
          filtered.map((t, i) => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-base flex-shrink-0">
                {CAT_ICONS[t.category] || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{t.description}</p>
                <p className="text-xs text-gray-400">{t.category} · {t.date}</p>
              </div>
              <p className={`font-bold text-sm flex-shrink-0 ${t.amount > 0 ? 'text-green-500' : 'text-gray-900'}`}>
                {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
              </p>
              <button onClick={() => openEdit(t)} className="text-gray-300 hover:text-gray-500 text-sm px-1">✏️</button>
              <button onClick={() => del(t.id)} className="text-red-300 hover:text-red-500 text-sm px-1">🗑️</button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-900">{editing ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Grocery run"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount ($)</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional note"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <button onClick={save} disabled={saving}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 mt-2">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}