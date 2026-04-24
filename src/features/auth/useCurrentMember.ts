import { useEffect, useState } from 'react'

export type CurrentMember = {
  id: string
  name: string
}

const STORAGE_KEY = 'currentMember'

export const readCurrentMember = (): CurrentMember | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CurrentMember
  } catch {
    return null
  }
}

export const writeCurrentMember = (member: CurrentMember) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(member))
}

export const clearCurrentMember = () => {
  localStorage.removeItem(STORAGE_KEY)
}

export const useCurrentMember = () => {
  const [member, setMember] = useState<CurrentMember | null>(readCurrentMember)

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setMember(e.newValue ? (JSON.parse(e.newValue) as CurrentMember) : null)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setCurrentMember = (m: CurrentMember) => {
    writeCurrentMember(m)
    setMember(m)
  }

  const clear = () => {
    clearCurrentMember()
    setMember(null)
  }

  return { member, setCurrentMember, clear }
}
