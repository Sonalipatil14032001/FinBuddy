import { useEffect, useState } from 'react'
import { supabase, Transaction } from '../lib/supabase'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'

const CAT_COLORS: Record<string, string> = {
  Housing: '#3b82f6', 'Food & Drink': '#8b5cf6', Transport: '#f59e0b',
  Shopping: '#ef4444', Utilities: '#10b981', Entertainment: '#ec4899',
  Health: '#06b6d4', Other: '#6b7280',
}

interface Props { userId: string }

export default function Analytics({ userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('transactions').select('*').eq('user_id', userId)
      .then(({ data }) => { setTransactions(data || []); setLoading(false) })
  }, [userId])

  const expenses = transactions.filter(t => t.amount < 0)
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)

  // Spending by category
  const byCategory = Object.entries(
    expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Monthly data
  const monthMap = new Map<string, { month: string; income: number; expenses: number }>()
  transactions.forEach(t => {
    const [y, m] = t.date.split('-')
    const key = `${y}-${m}`
    const label = `${m}/${y.slice(2)}`
    if (!monthMap.has(key)) monthMap.set(key, { month: label, income: 0, expenses: 0 })
    const entry = monthMap.get(key)!
    if (t.amount > 0) entry.income += t.amount
    else entry.expenses += Math.abs(t.amount)
  })
  const monthly = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)

  const RANK_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) return <p className="text-center text-gray-400 py-20">Loading...</p>

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-gray-500 text-sm">Visual breakdown of your finances</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-2">📈</p>
          <p className="text-gray-400 text-sm">Add some transactions to see analytics</p>
        </div>
      ) : (
        <>
          {/* Donut Chart */}
          {byCategory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <p className="font-bold text-gray-900 mb-0.5">Spending by Category</p>
              <p className="text-gray-400 text-xs mb-3">Total: ${totalExpenses.toFixed(2)}</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {byCategory.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.name] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, '']}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-1">
                {byCategory.map(e => (
                  <div key={e.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[e.name] || '#6b7280' }} />
                    {e.name} ({totalExpenses > 0 ? ((e.value / totalExpenses) * 100).toFixed(0) : 0}%)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Bar Chart */}
          {monthly.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <p className="font-bold text-gray-900 mb-0.5">Monthly Overview</p>
              <p className="text-gray-400 text-xs mb-3">Income vs Expenses</p>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={monthly} barGap={4} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, '']}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                  <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                {[['#3b82f6', 'Income'], ['#ef4444', 'Expenses']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cash Flow Area Chart */}
          {monthly.length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <p className="font-bold text-gray-900 mb-0.5">Cash Flow</p>
              <p className="text-gray-400 text-xs mb-3">Income trend over time</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, '']}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                  <Area type="monotone" dataKey="income" stroke="#3b82f6" fill="url(#gInc)" strokeWidth={2.5} name="Income" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Spending */}
          {byCategory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="font-bold text-gray-900 mb-4">Top Spending Categories</p>
              {byCategory.slice(0, 5).map((e, i) => (
                <div key={e.name} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: RANK_COLORS[i] }}>
                    {i + 1}
                  </div>
                  <p className="font-semibold text-sm text-gray-900 w-24 flex-shrink-0">{e.name}</p>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(e.value / byCategory[0].value) * 100}%`, background: RANK_COLORS[i] }} />
                  </div>
                  <p className="font-bold text-sm text-gray-900 w-16 text-right flex-shrink-0">${e.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}