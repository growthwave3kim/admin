import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { supabase } from '@/lib/supabase'
import { useRouter } from '@tanstack/react-router'
import { LogOut, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'

export const Header = () => {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('로그아웃되었습니다')
    router.navigate({ to: '/login' })
  }

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-6 gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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
        className="gap-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xs"
      >
        <LogOut className="w-3.5 h-3.5" />
        로그아웃
      </Button>
    </header>
  )
}
