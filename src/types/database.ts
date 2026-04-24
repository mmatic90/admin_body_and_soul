export type AppRole = 'admin' | 'employee'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: AppRole
  is_active: boolean
  created_at: string
  updated_at: string
}