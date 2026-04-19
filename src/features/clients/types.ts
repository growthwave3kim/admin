export type Client = {
  id: string
  name: string
  normalized_name: string
  contact_name: string | null
  contact_phone: string | null
  email: string | null
  note: string | null
  is_contact: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type ClientFormData = {
  name: string
  contact_name?: string | null
  contact_phone?: string | null
  email?: string | null
  note?: string | null
  is_contact?: boolean
}
