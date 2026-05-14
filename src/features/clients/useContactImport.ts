import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { fetchContactsByNames, importClients, updateClient } from '@/features/clients/queries'
import type { Client } from '@/features/clients/types'

export type ImportRow = {
  name: string
  contact_phone: string | null
  email: string | null
}

type DuplicateItem = {
  existing: Client
  incoming: ImportRow
}

export type ImportPreview = {
  newRows: ImportRow[]
  duplicates: DuplicateItem[]
  irregular: ImportRow[]
}

const isValidPhone = (phone: string | null): boolean => {
  if (!phone) return true
  const d = phone.replace(/\D/g, '')
  return d.length === 11 && d.startsWith('0')
}

const normalizePhone = (raw: string): string | null => {
  const v = raw.trim()
  if (!v) return null
  if (v.startsWith('+82')) {
    const digits = v.slice(3).replace(/\D/g, '')
    return `0${digits}`
  }
  const digits = v.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('0')) return digits
  if (digits.length === 10 && digits.startsWith('10')) return `0${digits}`
  return `010${digits}`
}

const normalizeForCompare = (v: string | null): string | null => {
  if (!v) return null
  const d = v.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('0')) return d
  if (d.length === 10 && d.startsWith('10')) return `0${d}`
  return `010${d}`
}

export const useContactImport = () => {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsImporting(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]

      const rawRows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
      }) as string[][]
      const headerRowIdx = rawRows.findIndex((row) => row.some((cell) => String(cell).trim() === '업체명'))
      if (headerRowIdx === -1) {
        toast.error('가져올 데이터가 없습니다. 업체명 컬럼을 확인해주세요')
        return
      }
      const rows = XLSX.utils.sheet_to_json(ws, {
        range: headerRowIdx,
        defval: '',
      }) as Record<string, string>[]

      const parsed: ImportRow[] = rows
        .map((r) => ({
          name: String(r.업체명 ?? '').trim(),
          contact_phone: normalizePhone(String(r.연락처 ?? '')),
          email: String(r.이메일 ?? '').trim() || null,
        }))
        .filter((r) => r.name)

      if (parsed.length === 0) {
        toast.error('가져올 데이터가 없습니다. 업체명 컬럼을 확인해주세요')
        return
      }

      const names = parsed.map((r) => r.name)
      const existing = await fetchContactsByNames(names)

      const newRows: ImportRow[] = []
      const duplicates: DuplicateItem[] = []
      const irregular: ImportRow[] = []

      for (const row of parsed) {
        const rowPhone = normalizeForCompare(row.contact_phone)
        const match = existing.find((c) => {
          const dbPhone = normalizeForCompare(c.contact_phone)
          return c.name === row.name && (dbPhone === rowPhone || (!dbPhone && !rowPhone))
        })
        if (!isValidPhone(row.contact_phone)) {
          irregular.push(row)
        } else if (match) {
          duplicates.push({ existing: match, incoming: row })
        } else {
          newRows.push(row)
        }
      }

      setImportPreview({ newRows, duplicates, irregular })
    } catch {
      toast.error('파일을 읽는 중 오류가 발생했습니다')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportConfirm = async (overwrite: boolean, filteredNewRows: ImportRow[]) => {
    if (!importPreview) return
    setIsSubmitting(true)
    try {
      const { duplicates, irregular } = importPreview
      const promises: Promise<unknown>[] = []

      if (filteredNewRows.length > 0) {
        promises.push(importClients(filteredNewRows))
      }

      if (overwrite) {
        for (const { existing, incoming } of duplicates) {
          promises.push(
            updateClient(existing.id, {
              name: incoming.name,
              contact_phone: incoming.contact_phone,
              email: incoming.email,
            }),
          )
        }
      }

      await Promise.all(promises)
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients-infinite'] })
      qc.invalidateQueries({ queryKey: ['clients-total'] })

      const parts: string[] = []
      if (filteredNewRows.length > 0) parts.push(`${filteredNewRows.length}개 추가`)
      if (overwrite && duplicates.length > 0) parts.push(`${duplicates.length}개 업데이트`)
      if (!overwrite && duplicates.length > 0) parts.push(`${duplicates.length}개 중복 건너뜀`)
      if (irregular.length > 0) parts.push(`비표준 번호 ${irregular.length}개 미등록`)
      toast.success(parts.join(', '))

      setImportPreview(null)
    } catch {
      toast.error('가져오기에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    fileInputRef,
    isImporting,
    importPreview,
    isSubmitting,
    handleImport,
    handleImportConfirm,
    clearPreview: () => setImportPreview(null),
  }
}
