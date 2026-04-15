import { useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function Header() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('로그아웃되었습니다')
    router.navigate({ to: '/login' })
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="gap-2 text-gray-500"
      >
        <LogOut className="w-4 h-4" />
        로그아웃
      </Button>
    </header>
  )
}
