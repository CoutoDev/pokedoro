import type { User } from '@/shared/types/user'

type SerializedUser = {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export function reviveUser(raw: SerializedUser): User {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  }
}
