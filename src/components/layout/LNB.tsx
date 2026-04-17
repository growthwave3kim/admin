import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  BookUser,
  Building2,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  Receipt,
  Tag,
  Trash2,
} from 'lucide-react'

const navGroups = [
  {
    items: [{ to: '/dashboard', label: '대시보드', icon: LayoutDashboard }],
  },
  {
    label: '업무',
    items: [{ to: '/tasks', label: '업무 목록', icon: ClipboardList }],
  },
  {
    label: '고객/거래처',
    items: [
      { to: '/clients', label: '거래처', icon: Building2 },
      { to: '/contacts', label: '고객 DB', icon: BookUser },
    ],
  },
  {
    label: '재무',
    items: [
      { to: '/expenses', label: '지출내역서', icon: Receipt },
      { to: '/expense-categories', label: '지출 카테고리', icon: FolderOpen },
    ],
  },
  {
    label: '설정',
    items: [{ to: '/marketing-types', label: '마케팅 유형', icon: Tag }],
  },
] as const

const trashItem = { to: '/trash', label: '휴지통', icon: Trash2 } as const

type LNBProps = {
  isOpen: boolean
  onClose: () => void
}

export const LNB = ({ isOpen, onClose }: LNBProps) => {
  const matchRoute = useMatchRoute()
  const { theme } = useTheme()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-56 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200',
        'md:relative md:translate-x-0 md:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
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
      <nav className="flex-1 p-3 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div
            key={'label' in group && group.label ? group.label : 'main'}
            className={gi > 0 ? 'pt-4' : ''}
          >
            {'label' in group && group.label && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = !!matchRoute({ to: item.to, fuzzy: true })
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
          {(() => {
            const isActive = !!matchRoute({ to: trashItem.to, fuzzy: true })
            return (
              <Link
                to={trashItem.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                )}
              >
                <trashItem.icon className="w-4 h-4 shrink-0" />
                {trashItem.label}
              </Link>
            )
          })()}
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-400 text-center">
          그로스웨이브 업무 관리
        </p>
      </div>
    </aside>
  )
}
