import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatCurrency = (value: number): string => `${new Intl.NumberFormat('ko-KR').format(value)}원`

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-'
  const s = dateStr.slice(0, 10)
  return `${s.slice(2, 4)}.${s.slice(5, 7)}.${s.slice(8, 10)}`
}

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const yy = String(d.getFullYear()).slice(2)
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yy}.${MM}.${dd} ${HH}:${mm}:${ss}`
}
