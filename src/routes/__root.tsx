import type { QueryClient } from '@tanstack/react-query'
import {
  Navigate,
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router'

type RouterContext = {
  queryClient: QueryClient
}

const RootErrorComponent = ({ error }: { error: unknown }) => {
  const router = useRouter()
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          오류가 발생했습니다
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {error instanceof Error ? error.message : '알 수 없는 오류'}
        </p>
        <button
          type="button"
          onClick={() => router.invalidate()}
          className="mt-4 text-xs text-blue-500 hover:text-blue-600 underline"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: RootErrorComponent,
  notFoundComponent: () => <Navigate to="/dashboard" />,
})
