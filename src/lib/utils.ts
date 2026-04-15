import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatCurrency = (value: number): string =>
  `${new Intl.NumberFormat('ko-KR').format(value)}원`

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}
