import { createLazyFileRoute, Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { LNB } from '@/components/layout/LNB'

export const Route = createLazyFileRoute('/_authed')({
  component: AuthedLayout,
})

function AuthedLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f6f8] dark:bg-[#0d0f18]">
      {isSidebarOpen && (
        // biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop
        <div
          role="presentation"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsSidebarOpen(false)}
        />
      )}
      <LNB isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
