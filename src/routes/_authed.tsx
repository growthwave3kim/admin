import { readCurrentMember } from '@/features/auth/useCurrentMember'
import { supabase } from '@/lib/supabase'
import { createFileRoute, redirect } from '@tanstack/react-router'

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
})
