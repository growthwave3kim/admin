import { getRouteApi } from '@tanstack/react-router'

const routeApi = getRouteApi('/_authed/tasks/')

export const useTaskSearchState = () => {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const update = (patch: Partial<typeof search>) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
    })
  }

  return { search, update }
}
