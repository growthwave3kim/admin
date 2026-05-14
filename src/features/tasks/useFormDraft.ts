import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { TaskFormValues } from '@/features/tasks/TaskForm'

const DRAFT_KEY = 'draft:task:new'
const DEBOUNCE_MS = 500

const readDraft = (): Partial<TaskFormValues> | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TaskFormValues>
    if (parsed.start_date) parsed.start_date = new Date(parsed.start_date as unknown as string)
    if (parsed.end_date) parsed.end_date = new Date(parsed.end_date as unknown as string)
    return parsed
  } catch {
    return null
  }
}

export const saveDraft = (values: Partial<TaskFormValues>) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
  } catch {}
}

export const clearDraft = () => {
  localStorage.removeItem(DRAFT_KEY)
}

export const useFormDraft = (form: UseFormReturn<TaskFormValues>, enabled = true) => {
  const [hasDraft, setHasDraft] = useState(() => enabled && !!readDraft())
  const [draftRestored, setDraftRestored] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const subscription = form.watch((values) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveDraft(values as Partial<TaskFormValues>)
      }, DEBOUNCE_MS)
    })
    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [form, enabled])

  const restoreDraft = useCallback(() => {
    const draft = readDraft()
    if (!draft) return
    form.reset({ ...form.getValues(), ...draft })
    setDraftRestored(true)
    setHasDraft(false)
  }, [form])

  const dismissDraft = useCallback(() => {
    clearDraft()
    setHasDraft(false)
  }, [])

  return { hasDraft, draftRestored, restoreDraft, dismissDraft }
}
