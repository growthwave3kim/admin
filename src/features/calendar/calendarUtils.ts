import type { CalendarTask, TaskStatus } from '@/features/tasks/types'
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export type { CalendarTask }

export type WeekEvent = {
  task: CalendarTask
  startCol: number
  endCol: number
  lane: number
}

export const STATUS_BAR_STYLES: Record<TaskStatus, string> = {
  proposal:
    'border-purple-400 bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500',
  not_started:
    'border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
  in_progress:
    'border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500',
  done_settled:
    'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500',
  done_unsettled:
    'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500',
  lost: 'border-red-300 bg-red-50/80 text-red-500 opacity-70 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700',
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

export function computeWeekLayout(
  week: Date[],
  tasks: CalendarTask[],
): WeekEvent[] {
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
    if (aStart.getTime() !== bStart.getTime())
      return aStart.getTime() - bStart.getTime()
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
