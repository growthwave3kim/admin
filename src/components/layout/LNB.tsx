import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { ClipboardList, LayoutDashboard, Tag } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/tasks', label: '업무 목록', icon: ClipboardList },
  { to: '/marketing-types', label: '마케팅 유형', icon: Tag },
] as const

export const LNB = () => {
  const matchRoute = useMatchRoute()
  const { theme } = useTheme()

  return (
    <aside className="w-56 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <img
            src={theme === 'dark' ? '/logo_dark.png' : '/logo.png'}
            alt="GrowthWave"
            className="h-6 w-auto object-contain"
          />
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            GrowthWave
          </span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = !!matchRoute({ to: item.to, fuzzy: true })
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
          그로스웨이브 업무 관리
        </p>
      </div>
    </aside>
  )
}
