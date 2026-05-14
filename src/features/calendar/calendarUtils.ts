import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import type { CalendarTask, TaskStatus } from '@/features/tasks/types'

export type { CalendarTask }

export type WeekEvent = {
  task: CalendarTask
  startCol: number
  endCol: number
  lane: number
}

export const STATUS_BAR_STYLES: Record<TaskStatus, string> = {
  proposal:
    'border-purple-500 bg-purple-100 text-purple-900 dark:bg-purple-800/50 dark:text-purple-200 dark:border-purple-500',
  not_started: 'border-gray-400 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500',
  in_progress: 'border-blue-500 bg-blue-100 text-blue-900 dark:bg-blue-800/50 dark:text-blue-200 dark:border-blue-500',
  done_settled:
    'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-800/50 dark:text-emerald-200 dark:border-emerald-500',
  done_unsettled:
    'border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-800/50 dark:text-amber-200 dark:border-amber-500',
  lost: 'border-red-400 bg-red-100/80 text-red-600 opacity-70 dark:bg-red-900/40 dark:text-red-300 dark:border-red-600',
}

export const STATUS_DOT: Record<TaskStatus, string> = {
  proposal: 'bg-purple-400',
  not_started: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  done_settled: 'bg-emerald-500',
  done_unsettled: 'bg-amber-500',
  lost: 'bg-red-400 opacity-70',
}

export const STATUS_LEGEND_LABELS: Record<TaskStatus, string> = {
  proposal: '제안',
  not_started: '시작 전',
  in_progress: '진행 중',
  done_settled: '정산완료',
  done_unsettled: '미정산',
  lost: '실패',
}

export const LEGEND_ORDER: TaskStatus[] = [
  'proposal',
  'not_started',
  'in_progress',
  'done_settled',
  'done_unsettled',
  'lost',
]

export function getCalendarWeeks(currentMonth: Date): Date[][] {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const weeks: Date[][] = []
  let day = gridStart

  while (day <= gridEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(day))
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  return weeks
}

export function computeWeekLayout(week: Date[], tasks: CalendarTask[]): WeekEvent[] {
  const weekStart = week[0]
  const weekEnd = week[6]

  const overlapping = tasks.filter((task) => {
    const taskStart = parseISO(task.start_date)
    const taskEnd = task.end_date ? parseISO(task.end_date) : taskStart
    return taskStart <= weekEnd && taskEnd >= weekStart
  })

  overlapping.sort((a, b) => {
    const aStart = parseISO(a.start_date)
    const bStart = parseISO(b.start_date)
    if (aStart.getTime() !== bStart.getTime()) return aStart.getTime() - bStart.getTime()
    const aEnd = a.end_date ? parseISO(a.end_date) : aStart
    const bEnd = b.end_date ? parseISO(b.end_date) : bStart
    return bEnd.getTime() - aEnd.getTime()
  })

  const events: WeekEvent[] = []
  const lanes: [number, number][][] = []

  for (const task of overlapping) {
    const taskStart = parseISO(task.start_date)
    const taskEnd = task.end_date ? parseISO(task.end_date) : taskStart

    const startCol = Math.max(0, differenceInCalendarDays(taskStart, weekStart))
    const endCol = Math.min(6, differenceInCalendarDays(taskEnd, weekStart))

    let assignedLane = -1
    for (let l = 0; l < lanes.length; l++) {
      const overlaps = lanes[l].some(([s, e]) => s <= endCol && e >= startCol)
      if (!overlaps) {
        assignedLane = l
        lanes[l].push([startCol, endCol])
        break
      }
    }
    if (assignedLane === -1) {
      assignedLane = lanes.length
      lanes.push([[startCol, endCol]])
    }

    events.push({ task, startCol, endCol, lane: assignedLane })
  }

  return events
}
