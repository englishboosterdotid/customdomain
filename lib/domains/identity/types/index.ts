export type Role = "user" | "creator" | "admin"

export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserWithRoles extends User {
  roles: Role[]
}

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export interface AssignRoleInput {
  userId: string
  role: Role
}
