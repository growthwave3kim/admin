import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const inputClass =
  'h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'

const smallInputClass =
  'h-7 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'

/**
 * Unified DatePicker component covering three use cases:
 *
 * - "form"   — full-width form field trigger (used in ExpenseFormDialog)
 *              value: Date | null | undefined, onChange: (date: Date | undefined) => void
 *
 * - "filter" — compact h-8 w-28 trigger with ISO string value (used in filter bar)
 *              value: string | undefined, onChange: (val: string | undefined) => void
 *              requires: placeholder
 *
 * - "inline" — small h-7 inline table row trigger with ISO string value
 *              value: string, onChange: (val: string) => void
 */
type FormProps = {
  variant: 'form'
  value: Date | null | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: never
}

type FilterProps = {
  variant: 'filter'
  value: string | undefined
  onChange: (val: string | undefined) => void
  placeholder: string
}

type InlineProps = {
  variant: 'inline'
  value: string
  onChange: (val: string) => void
  placeholder?: never
}

type DatePickerProps = FormProps | FilterProps | InlineProps

export const DatePicker = (props: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)

  if (props.variant === 'form') {
    const { value, onChange } = props
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          className={cn(
            inputClass,
            'flex w-full items-center px-3 text-left',
            !value && 'text-gray-400 dark:text-gray-400',
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
          {value ? format(value, 'yyyy-MM-dd') : '날짜 선택'}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date)
              setIsOpen(false)
            }}
            locale={ko}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  if (props.variant === 'filter') {
    const { value, onChange, placeholder } = props
    const parsed = value ? parseISO(value) : undefined
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          className={cn(
            'flex h-8 w-28 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-gray-700 text-xs transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
            !value && 'text-gray-400 dark:text-gray-400',
          )}
        >
          <CalendarIcon className="h-3 w-3 text-gray-400" />
          {value ? format(parseISO(value), 'yy.MM.dd') : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsed}
            onSelect={(date) => {
              onChange(date ? format(date, 'yyyy-MM-dd') : undefined)
              setIsOpen(false)
            }}
            locale={ko}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  // inline
  const { value, onChange } = props
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(smallInputClass, 'flex w-full items-center gap-1.5 border px-2', !value && 'text-gray-400')}
      >
        <CalendarIcon className="h-3 w-3 shrink-0 text-gray-400" />
        {value ? format(parseISO(value), 'yy.MM.dd') : '날짜'}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(date) => {
            if (date) onChange(format(date, 'yyyy-MM-dd'))
            setIsOpen(false)
          }}
          locale={ko}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
