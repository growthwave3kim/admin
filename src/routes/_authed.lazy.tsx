import { Header } from '@/components/layout/Header'
import { LNB } from '@/components/layout/LNB'
import { Outlet, createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createLazyFileRoute('/_authed')({
  component: AuthedLayout,
})

function AuthedLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f6f8] dark:bg-[#0d0f18]">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsSidebarOpen(false)}
        />
      )}
      <LNB isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
