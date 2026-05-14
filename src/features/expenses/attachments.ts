import { logAudit } from '@/features/audit/logAudit'
import { readCurrentMember } from '@/features/auth/useCurrentMember'
import { supabase } from '@/lib/supabase'

const BUCKET = 'expense-attachments'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_PER_EXPENSE = 5
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export type ExpenseAttachment = {
  id: string
  expense_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  uploaded_by_member_id: string | null
  created_at: string
}

export const listAttachments = async (expenseId: string): Promise<ExpenseAttachment[]> => {
  const { data, error } = await supabase
    .from('expense_attachments')
    .select('*')
    .eq('expense_id', expenseId)
    .order('created_at')
  if (error) throw error
  return data as ExpenseAttachment[]
}

export const uploadAttachment = async (expenseId: string, file: File): Promise<ExpenseAttachment> => {
  if (!ALLOWED_MIME.includes(file.type)) throw new Error('지원하지 않는 파일 형식입니다 (jpg/png/webp/pdf)')
  if (file.size > MAX_SIZE_BYTES) throw new Error('파일 크기는 10MB 이하여야 합니다')

  const existing = await listAttachments(expenseId)
  if (existing.length >= MAX_PER_EXPENSE) throw new Error(`첨부파일은 최대 ${MAX_PER_EXPENSE}개까지 가능합니다`)

  const ext = file.name.split('.').pop()
  const storagePath = `${expenseId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file)
  if (uploadError) throw uploadError

  const member = readCurrentMember()

  const { data, error } = await supabase
    .from('expense_attachments')
    .insert({
      expense_id: expenseId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by_member_id: member?.id ?? null,
    })
    .select()
    .single()
  if (error) throw error

  void logAudit({
    tableName: 'expense_attachments',
    recordId: (data as ExpenseAttachment).id,
    action: 'insert',
  }).catch(() => {})

  return data as ExpenseAttachment
}

export const deleteAttachment = async (attachment: ExpenseAttachment): Promise<void> => {
  await supabase.storage.from(BUCKET).remove([attachment.storage_path])
  const { error } = await supabase.from('expense_attachments').delete().eq('id', attachment.id)
  if (error) throw error
  void logAudit({
    tableName: 'expense_attachments',
    recordId: attachment.id,
    action: 'delete',
  }).catch(() => {})
}

export const getSignedUrl = async (storagePath: string, ttl = 3600): Promise<string> => {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, ttl)
  if (error) throw error
  return data.signedUrl
}

export const downloadAsDataUrl = async (storagePath: string): Promise<string> => {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)
  if (error || !data) throw error ?? new Error('다운로드 실패')
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(data)
  })
}

export const deleteAllAttachments = async (expenseId: string): Promise<void> => {
  const attachments = await listAttachments(expenseId)
  if (attachments.length === 0) return
  const paths = attachments.map((a) => a.storage_path)
  await supabase.storage.from(BUCKET).remove(paths)
  await supabase.from('expense_attachments').delete().eq('expense_id', expenseId)
}
