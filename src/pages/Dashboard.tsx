import { useEffect, useState } from 'react'
import { supabase, Transaction, Budget, Goal } from '../lib/supabase'

interface Props {
  userId: string
}

export default function Dashboard({ userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: t }, { data: b }, { data: g }] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
      ])
      setTransactions(t || [])
      setBudgets(b || [])
      setGoals(g || [])
      setLoading(false)
    }
    fetchData()
  }, [userId])

  const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const balance = income - expenses
  const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : '0'

  const CAT_ICONS: Record<string, string> = {
    Housing: '🏠', 'Food & Drink': '🍔', Transport: '🚗',
    Shopping: '🛍️', Utilities: '⚡', Entertainment: '🎬',
    Health: '💊', Income: '💰', Other: '📦',
  }

  const recent = transactions.slice(0, 5)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div>
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Good morning! 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's your financial overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium mb-1">Total Balance</p>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">Calculated from all transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-sm mb-2">📈</div>
          <p className="text-gray-500 text-xs font-medium">Income</p>
          <p className="text-lg font-extrabold text-gray-900">${income.toFixed(2)}</p>
          <p className="text-green-500 text-xs font-medium">{transactions.filter(t => t.amount > 0).length} deposits</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-sm mb-2">📉</div>
          <p className="text-gray-500 text-xs font-medium">Expenses</p>
          <p className="text-lg font-extrabold text-gray-900">${expenses.toFixed(2)}</p>
          <p className="text-red-400 text-xs font-medium">{transactions.filter(t => t.amount < 0).length} items</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-sm mb-2">🏦</div>
          <p className="text-gray-500 text-xs font-medium">Savings Rate</p>
          <p className="text-lg font-extrabold text-gray-900">{savingsRate}%</p>
          <p className={`text-xs font-medium ${parseFloat(savingsRate) >= 20 ? 'text-green-500' : 'text-amber-500'}`}>
            {parseFloat(savingsRate) >= 20 ? '🎉 On track!' : 'Aim for 20%+'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-sm mb-2">🎯</div>
          <p className="text-gray-500 text-xs font-medium">Goals</p>
          <p className="text-lg font-extrabold text-gray-900">{goals.length} active</p>
          <p className="text-amber-500 text-xs font-medium">
            ${goals.reduce((s, g) => s + g.saved, 0).toLocaleString()} saved
          </p>
        </div>
      </div>

      {/* Smart Insights */}
      {transactions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
          <p className="font-bold text-blue-700 text-sm mb-2">💡 Smart Insights</p>
          {parseFloat(savingsRate) >= 20 && (
            <p className="text-sm text-gray-700 mb-1">✅ Great! You're saving {savingsRate}% of your income.</p>
          )}
          {parseFloat(savingsRate) < 10 && parseFloat(savingsRate) > 0 && (
            <p className="text-sm text-gray-700 mb-1">📉 Savings rate is {savingsRate}% — try to reach 20%+.</p>
          )}
          {budgets.map(b => {
            const spent = transactions.filter(t => t.category === b.category && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
            const pct = spent / b.limit_amount
            if (pct > 0.9) return (
              <p key={b.id} className="text-sm text-gray-700 mb-1">
                ⚠️ {b.category} budget is {(pct * 100).toFixed(0)}% used!
              </p>
            )
            return null
          })}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="font-bold text-gray-900 mb-3">Recent Transactions</p>
        {recent.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No transactions yet</p>
        ) : (
          recent.map((t, i) => (
            <div key={t.id} className={`flex items-center gap-3 py-2.5 ${i < recent.length - 1 ? 'border-b border-gray-50' : ''}`}>
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
            </div>
          ))
        )}
      </div>
    </div>
  )
}