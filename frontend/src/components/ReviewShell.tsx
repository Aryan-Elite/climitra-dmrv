'use client'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Review Queue',
    href: '/review',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Search',
    href: '/search',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
    ),
  },
]

const SIDEBAR_W = 280

export default function ReviewShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f5' }}>
      <style>{`
        .nav-active {
          background: linear-gradient(90deg, #16a34a, #15803d) !important;
          transition: filter 0.2s ease;
        }
        .nav-active:hover {
          filter: brightness(1.18);
        }
      `}</style>

      {/* Sidebar — fixed, full height */}
      <aside className="fixed inset-y-0 left-0 bg-white flex flex-col" style={{ width: SIDEBAR_W, boxShadow: '1px 0 0 #e5e7eb' }}>

        {/* Brand */}
        <div style={{ paddingTop: 56, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, borderBottom: '1.5px solid #cbd5e1' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 0-4-4-7-4-7 0 0-1 6 3 10H9c0-2-2-4-2-4 0 0 1 4 0 7" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Climitra</h1>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1" style={{ paddingTop: 8 }}>
          {NAV.map(item => {
            const active = item.href === '/review'
              ? pathname.startsWith('/review')
              : pathname === item.href
            return (
              <div key={item.href} style={{ borderBottom: '1.5px solid #cbd5e1' }}>
                <button
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center py-4 text-sm font-semibold ${active ? 'nav-active' : 'hover:bg-gray-100 cursor-pointer'}`}
                  style={{ gap: 14, paddingLeft: 36, paddingRight: 36 }}
                >
                  <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                  <span className={active ? 'text-white' : 'text-gray-600'}>{item.label}</span>
                </button>
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1.5px solid #cbd5e1', padding: '16px 20px 36px' }}>
          <button
            onClick={() => { localStorage.clear(); router.replace('/login') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <svg style={{ width: 20, height: 20, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen" style={{ marginLeft: SIDEBAR_W, padding: 0 }}>
        {children}
      </main>
    </div>
  )
}
