import { Button } from '@/components/ui/button'
import { signOut } from '@/features/auth/queries'
import { useTheme } from '@/hooks/useTheme'
import { useRouter } from '@tanstack/react-router'
import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'

type HeaderProps = {
  onMenuToggle: () => void
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await signOut()
    toast.success('로그아웃되었습니다')
    router.navigate({ to: '/login' })
  }

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6 gap-1">
      <button
        type="button"
        className="md:hidden flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors"
        onClick={onMenuToggle}
        aria-label="메뉴"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          로그아웃
        </Button>
      </div>
    </header>
  )
}
