import { Header } from '@/components/layout/Header'
import { LNB } from '@/components/layout/LNB'
import { Outlet, createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authed')({
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f6f8] dark:bg-[#0d0f18]">
      <LNB />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
