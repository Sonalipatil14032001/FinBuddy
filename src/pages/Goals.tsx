import { useEffect, useState } from 'react'
import { supabase, Goal } from '../lib/supabase'

const GOAL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899']

interface Props { userId: string }

export default function Goals({ userId }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null)
  const [depositAmt, setDepositAmt] = useState('')
  const [form, setForm] = useState({ name: '', target: '', saved: '0', icon: '🎯', color: '#3b82f6' })
  const [saving, setSaving] = useState(false)

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('*').eq('user_id', userId)
    setGoals(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchGoals() }, [userId])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', target: '', saved: '0', icon: '🎯', color: '#3b82f6' })
    setShowModal(true)
  }

  const openEdit = (g: Goal) => {
    setEditing(g)
    setForm({ name: g.name, target: g.target.toString(), saved: g.saved.toString(), icon: g.icon, color: g.color })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.target) return
    setSaving(true)
    const entry = {
      name: form.name, target: parseFloat(form.target),
      saved: parseFloat(form.saved || '0'),
      icon: form.icon || '🎯', color: form.color
    }
    if (editing) {
      await supabase.from('goals').update(entry).eq('id', editing.id)
    } else {
      await supabase.from('goals').insert({ user_id: userId, ...entry })
    }
    await fetchGoals()
    setSaving(false)
    setShowModal(false)
  }

  const del = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return
    await supabase.from('goals').delete().eq('id', id)
    await fetchGoals()
  }

  const handleDeposit = async () => {
    if (!depositGoal || !depositAmt) return
    const amt = parseFloat(depositAmt)
    if (isNaN(amt) || amt <= 0) return
    const newSaved = Math.min(depositGoal.saved + amt, depositGoal.target)
    await supabase.from('goals').update({ saved: newSaved }).eq('id', depositGoal.id)
    await fetchGoals()
    setDepositGoal(null)
    setDepositAmt('')
  }

  const totalTarget = goals.reduce((s, g) => s + g.target, 0)
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)
  const completed = goals.filter(g => g.saved >= g.target).length

  if (loading) return <p className="text-center text-gray-400 py-20">Loading...</p>

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Goals</h1>
          <p className="text-gray-500 text-sm">Track your savings milestones</p>
        </div>
        <button onClick={openAdd} className="bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
          + New Goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-lg font-extrabold text-gray-900">${totalSaved.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">Saved</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-lg font-extrabold text-gray-900">
            {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
          </p>
          <p className="text-gray-400 text-xs">Progress</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-lg font-extrabold text-gray-900">{completed}</p>
          <p className="text-gray-400 text-xs">Completed</p>
        </div>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-2">🎯</p>
          <p className="text-gray-400 text-sm mb-3">No goals yet</p>
          <button onClick={openAdd} className="bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl">
            + Create Goal
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map(g => {
            const pct = Math.min(g.saved / g.target, 1)
            const done = pct >= 1
            return (
              <div key={g.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${done ? 'border-green-200' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: g.color + '20' }}>
                      {done ? '✅' : g.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">${g.saved.toLocaleString()} of ${g.target.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm" style={{ color: done ? '#22c55e' : g.color }}>
                      {(pct * 100).toFixed(0)}%
                    </span>
                    <button onClick={() => openEdit(g)} className="text-gray-300 hover:text-gray-500 text-xs">✏️</button>
                    <button onClick={() => del(g.id)} className="text-red-300 hover:text-red-500 text-xs">🗑️</button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct * 100}%`, background: done ? '#22c55e' : g.color }} />
                </div>

                <div className="flex justify-between items-center">
                  {done ? (
                    <p className="text-green-500 text-xs font-semibold">🎉 Goal reached!</p>
                  ) : (
                    <p className="text-gray-400 text-xs">${(g.target - g.saved).toFixed(2)} to go</p>
                  )}
                  {!done && (
                    <button
                      onClick={() => { setDepositGoal(g); setDepositAmt('') }}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: g.color + '18', color: g.color }}>
                      + Add Funds
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-900">{editing ? 'Edit Goal' : 'New Goal'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 bg-gray-100 rounded-lg w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Goal Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Emergency Fund"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Target Amount ($)</label>
                <input type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                  placeholder="e.g. 10000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Already Saved ($)</label>
                <input type="number" value={form.saved} onChange={e => setForm(p => ({ ...p, saved: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Emoji Icon</label>
                <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                  placeholder="🎯"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Color</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, border: form.color === c ? '3px solid #0f172a' : '3px solid transparent' }} />
                  ))}
                </div>
              </div>
              <button onClick={save} disabled={saving}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositGoal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDepositGoal(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Add Funds</h3>
              <button onClick={() => setDepositGoal(null)} className="text-gray-400 bg-gray-100 rounded-lg w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Adding to: <strong>{depositGoal.name}</strong></p>
            <input type="number" value={depositAmt} onChange={e => setDepositAmt(e.target.value)}
              placeholder="e.g. 200"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 mb-3" />
            <button onClick={handleDeposit}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              Add Funds
            </button>
          </div>
        </div>
      )}
    </div>
  )
}