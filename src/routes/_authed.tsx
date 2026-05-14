import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { clearCurrentMember, readCurrentMember } from '@/features/auth/useCurrentMember'
import { supabase } from '@/lib/supabase'

function AuthGuard() {
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearCurrentMember()
        router.navigate({ to: '/login' })
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return <Outlet />
}

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const member = readCurrentMember()
    if (!session || !member) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AuthGuard,
})
