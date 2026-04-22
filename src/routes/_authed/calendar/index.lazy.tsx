import {
  LEGEND_ORDER,
  STATUS_BAR_STYLES,
  STATUS_DOT,
  STATUS_LEGEND_LABELS,
  computeWeekLayout,
  getCalendarWeeks,
} from '@/features/calendar/calendarUtils'
import type { CalendarTask, WeekEvent } from '@/features/calendar/calendarUtils'
import { fetchTasksForCalendar } from '@/features/tasks/queries'
import { cn } from '@/lib/utils'
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
    <div className="flex-1 relative border-b border-gray-200 dark:border-gray-800 overflow-hidden min-h-[80px]">
      {/* Column backgrounds */}
      <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
        {week.map((day) => (
          <div
            key={format(day, 'yyyy-MM-dd')}
            className={cn(
              'h-full border-r border-gray-100 dark:border-gray-800/60',
              !isSameMonth(day, currentMonth) &&
                'bg-gray-50/60 dark:bg-gray-900/40',
            )}
          />
        ))}
      </div>

      {/* Day numbers */}
      <div
        className="absolute top-0 inset-x-0 grid grid-cols-7"
        style={{ height: DAY_H }}
      >
        {week.map((day, col) => (
          <div
            key={format(day, 'yyyy-MM-dd')}
            className="flex items-start justify-center pt-1.5"
          >
            <span
              className={cn(
                'text-xs w-6 h-6 flex items-center justify-center rounded-full tabular-nums',
                isSameDay(day, today)
                  ? 'bg-blue-500 text-white font-bold'
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
        const taskEnd = startOfDay(
          event.task.end_date ? parseISO(event.task.end_date) : taskStart,
        )
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
              'absolute flex items-center text-[11px] font-medium cursor-pointer hover:opacity-75 transition-opacity truncate select-none',
              STATUS_BAR_STYLES[event.task.status],
              startsThisWeek
                ? 'border-l-2 rounded-l-[3px] pl-1.5'
                : 'border-l-0 pl-1',
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
            className="absolute text-[10px] font-medium text-gray-400 dark:text-gray-500 pointer-events-none"
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            오늘
          </button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {format(currentMonth, "yyyy'년' M'월'")}
          </h2>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 flex-wrap">
          {LEGEND_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  STATUS_DOT[status],
                )}
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {STATUS_LEGEND_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="shrink-0 grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={cn(
              'py-2 text-center text-[11px] font-semibold tracking-widest uppercase border-r border-gray-100 dark:border-gray-800/60 last:border-r-0',
              i === 0
                ? 'text-red-400'
                : i === 6
                  ? 'text-blue-400'
                  : 'text-gray-400 dark:text-gray-500',
            )}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-l border-gray-200 dark:border-gray-800">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="inline-block w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
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
