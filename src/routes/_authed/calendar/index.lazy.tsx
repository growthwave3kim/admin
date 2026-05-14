import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import {
  addMonths,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { CalendarTask, WeekEvent } from '@/features/calendar/calendarUtils'
import {
  computeWeekLayout,
  getCalendarWeeks,
  LEGEND_ORDER,
  STATUS_BAR_STYLES,
  STATUS_DOT,
  STATUS_LEGEND_LABELS,
} from '@/features/calendar/calendarUtils'
import { fetchTasksForCalendar } from '@/features/tasks/queries'
import { cn } from '@/lib/utils'

export const Route = createLazyFileRoute('/_authed/calendar/')({
  component: CalendarPage,
})

const DAY_H = 36
const EVENT_H = 20
const EVENT_GAP = 3
const EVENT_SLOT = EVENT_H + EVENT_GAP
const MAX_LANES = 3
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

const WeekRow = ({
  week,
  tasks,
  currentMonth,
  today,
  onEventClick,
}: {
  week: Date[]
  tasks: CalendarTask[]
  currentMonth: Date
  today: Date
  onEventClick: (id: string) => void
}) => {
  const events = computeWeekLayout(week, tasks)
  const visible = events.filter((e: WeekEvent) => e.lane < MAX_LANES)

  const hiddenPerCol = Array.from({ length: 7 }, () => 0)
  for (const e of events) {
    if (e.lane >= MAX_LANES) {
      for (let c = e.startCol; c <= e.endCol; c++) hiddenPerCol[c]++
    }
  }

  return (
    <div className="relative min-h-[80px] flex-1 overflow-hidden border-gray-200 border-b dark:border-gray-800">
      {/* Column backgrounds */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
        {week.map((day) => (
          <div
            key={format(day, 'yyyy-MM-dd')}
            className={cn(
              'h-full border-gray-100 border-r dark:border-gray-800/60',
              !isSameMonth(day, currentMonth) && 'bg-gray-50/60 dark:bg-gray-900/40',
            )}
          />
        ))}
      </div>

      {/* Day numbers */}
      <div className="absolute inset-x-0 top-0 grid grid-cols-7" style={{ height: DAY_H }}>
        {week.map((day, col) => (
          <div key={format(day, 'yyyy-MM-dd')} className="flex items-start justify-center pt-1.5">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums',
                isSameDay(day, today)
                  ? 'bg-blue-500 font-bold text-white'
                  : !isSameMonth(day, currentMonth)
                    ? 'text-gray-300 dark:text-gray-600'
                    : col === 0
                      ? 'text-red-400'
                      : col === 6
                        ? 'text-blue-400'
                        : 'text-gray-600 dark:text-gray-300',
              )}
            >
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      {/* Event bars */}
      {visible.map((event: WeekEvent) => {
        const taskStart = startOfDay(parseISO(event.task.start_date))
        const taskEnd = startOfDay(event.task.end_date ? parseISO(event.task.end_date) : taskStart)
        const weekStartDay = startOfDay(week[0])
        const weekEndDay = startOfDay(week[6])

        const startsThisWeek = !isBefore(taskStart, weekStartDay)
        const endsThisWeek = !isAfter(taskEnd, weekEndDay)

        const leftPct = (event.startCol / 7) * 100
        const widthPct = ((event.endCol - event.startCol + 1) / 7) * 100
        const topPx = DAY_H + event.lane * EVENT_SLOT

        return (
          <button
            key={event.task.id}
            type="button"
            onClick={() => onEventClick(event.task.id)}
            className={cn(
              'absolute flex cursor-pointer select-none items-center truncate font-medium text-[11px] transition-opacity hover:opacity-75',
              STATUS_BAR_STYLES[event.task.status],
              startsThisWeek ? 'rounded-l-[3px] border-l-2 pl-1.5' : 'border-l-0 pl-1',
              endsThisWeek ? 'rounded-r-[3px] pr-1.5' : 'pr-0',
            )}
            style={{
              left: `calc(${leftPct}% + 2px)`,
              width: `calc(${widthPct}% - 4px)`,
              top: topPx,
              height: EVENT_H,
            }}
            title={`${event.task.company_name}${event.task.members ? ` · ${event.task.members.name}` : ''}`}
          >
            <span className="truncate">{event.task.company_name}</span>
          </button>
        )
      })}

      {/* +N more per column */}
      {hiddenPerCol.map((count, col) =>
        count > 0 ? (
          <div
            key={DAY_NAMES[col]}
            className="pointer-events-none absolute font-medium text-[10px] text-gray-400 dark:text-gray-500"
            style={{
              left: `calc(${(col / 7) * 100}% + 6px)`,
              top: DAY_H + MAX_LANES * EVENT_SLOT + 2,
            }}
          >
            +{count}
          </div>
        ) : null,
      )}
    </div>
  )
}

function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const navigate = useNavigate()
  const today = new Date()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks-calendar'],
    queryFn: fetchTasksForCalendar,
    staleTime: 5 * 60 * 1000,
  })

  const weeks = getCalendarWeeks(currentMonth)

  const handleEventClick = (taskId: string) => {
    navigate({ to: '/tasks/$taskId/edit', params: { taskId } })
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-gray-200 border-b px-5 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="rounded-md border border-gray-200 px-2.5 py-1 font-medium text-gray-600 text-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            오늘
          </button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="font-semibold text-gray-800 text-sm dark:text-gray-100">
            {format(currentMonth, "yyyy'년' M'월'")}
          </h2>
        </div>

        {/* Legend */}
        <div className="hidden flex-wrap items-center gap-4 sm:flex">
          {LEGEND_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[status])} />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">{STATUS_LEGEND_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid shrink-0 grid-cols-7 border-gray-200 border-b bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={cn(
              'border-gray-100 border-r py-2 text-center font-semibold text-[11px] uppercase tracking-widest last:border-r-0 dark:border-gray-800/60',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400 dark:text-gray-500',
            )}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-1 flex-col overflow-hidden border-gray-200 border-l dark:border-gray-800">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500 dark:border-gray-700 dark:border-t-gray-400" />
          </div>
        ) : (
          weeks.map((week) => (
            <WeekRow
              key={format(week[0], 'yyyy-MM-dd')}
              week={week}
              tasks={tasks}
              currentMonth={currentMonth}
              today={today}
              onEventClick={handleEventClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
