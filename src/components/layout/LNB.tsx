import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  BookUser,
  Building2,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  ScrollText,
  Tag,
  Trash2,
} from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    items: [{ to: '/dashboard', label: '대시보드', icon: LayoutDashboard }],
  },
  {
    label: '업무',
    items: [
      { to: '/tasks', label: '업무 목록', icon: ClipboardList },
      { to: '/calendar', label: '캘린더', icon: CalendarDays },
    ],
  },
  {
    label: '고객/거래처',
    items: [
      { to: '/clients', label: '거래처', icon: Building2 },
      { to: '/contacts', label: '고객 DB', icon: BookUser },
      { to: '/inquiries', label: '홈페이지 문의', icon: Inbox },
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
    label: 'SNS',
    items: [{ to: '/threads', label: '스레드 관리', icon: MessageSquare }],
  },
  {
    label: '설정',
    items: [
      { to: '/marketing-types', label: '마케팅 유형', icon: Tag },
      { to: '/audit', label: '변경 이력', icon: ScrollText },
    ],
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
        'fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-gray-200 border-r bg-white transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900',
        'md:relative md:z-auto md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-14 items-center border-gray-200 border-b px-5 dark:border-gray-800">
        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <img
            src={theme === 'dark' ? '/logo_dark.png' : '/logo.png'}
            alt="GrowthWave"
            className="h-6 w-auto object-contain"
          />
          <span className="font-semibold text-gray-900 text-sm dark:text-gray-100">GrowthWave</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {navGroups.map((group, gi) => (
          <div key={'label' in group && group.label ? group.label : 'main'} className={gi > 0 ? 'pt-4' : ''}>
            {'label' in group && group.label && (
              <p className="px-3 pb-1 font-semibold text-[10px] text-gray-400 uppercase tracking-widest dark:text-gray-600">
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
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-xs transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        <div className="mt-4 border-gray-100 border-t pt-4 dark:border-gray-800">
          {(() => {
            const isActive = !!matchRoute({ to: trashItem.to, fuzzy: true })
            return (
              <Link
                to={trashItem.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-xs transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                )}
              >
                <trashItem.icon className="h-4 w-4 shrink-0" />
                {trashItem.label}
              </Link>
            )
          })()}
        </div>
      </nav>
      <div className="border-gray-200 border-t p-4 dark:border-gray-800">
        <p className="text-center text-gray-400 text-xs dark:text-gray-400">그로스웨이브 업무 관리</p>
      </div>
    </aside>
  )
}
