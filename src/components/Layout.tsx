import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Dashboard from '../pages/Dashboard'
import Transactions from '../pages/Transactions'
import Budgets from '../pages/Budgets'
import Goals from '../pages/Goals'
import Analytics from '../pages/Analytics'

type Page = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'analytics'

interface Props {
  user: User
}

const NAV = [
  { id: 'dashboard' as Page, icon: '🏠', label: 'Home' },
  { id: 'transactions' as Page, icon: '💳', label: 'Transactions' },
  { id: 'budgets' as Page, icon: '📊', label: 'Budgets' },
  { id: 'goals' as Page, icon: '🎯', label: 'Goals' },
  { id: 'analytics' as Page, icon: '📈', label: 'Analytics' },
]

export default function Layout({ user }: Props) {
  const [page, setPage] = useState<Page>('dashboard')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {/* Top Bar */}
      <div className="bg-white px-5 py-3 flex items-center gap-3 sticky top-0 z-50 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm">
          💎
        </div>
        <span className="font-extrabold text-lg text-gray-900 tracking-tight">FinBuddy</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="px-4 py-5 pb-24">
        {page === 'dashboard' && <Dashboard userId={user.id} />}
        {page === 'transactions' && <Transactions userId={user.id} />}
        {page === 'budgets' && <Budgets userId={user.id} />}
        {page === 'goals' && <Goals userId={user.id} />}
        {page === 'analytics' && <Analytics userId={user.id} />}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 flex z-50">
        {NAV.map(n => {
          const active = page === n.id
          return (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
            >
              <div className={`w-10 h-7 rounded-lg flex items-center justify-center text-lg transition-all ${active ? 'bg-blue-50' : 'opacity-40 grayscale'}`}>
                {n.icon}
              </div>
              <span className={`text-xs font-semibold transition-colors ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                {n.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}