import { useRouter } from '@tanstack/react-router'
import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { signOut } from '@/features/auth/queries'
import { clearCurrentMember } from '@/features/auth/useCurrentMember'
import { useTheme } from '@/hooks/useTheme'

type HeaderProps = {
  onMenuToggle: () => void
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch {
      // proceed with local cleanup even if signOut fails
    }
    clearCurrentMember()
    toast.success('로그아웃되었습니다')
    router.navigate({ to: '/login' })
  }

  return (
    <header className="flex h-14 items-center gap-1 border-gray-200 border-b bg-white px-4 md:px-6 dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-600 md:hidden dark:hover:text-gray-300"
        onClick={onMenuToggle}
        aria-label="메뉴"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5 text-gray-400 text-xs hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </Button>
      </div>
    </header>
  )
}
