import { z } from "zod"

export const UsernameSchema = z
  .string()
  .min(3, "Minimal 3 karakter")
  .max(30, "Maksimal 30 karakter")
  .regex(/^[a-z0-9][a-z0-9-]{2,29}$/, "Hanya huruf kecil, angka, dan tanda hubung")

export const EmailSchema = z
  .string()
  .email("Email tidak valid")

export const PasswordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password terlalu panjang")

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(1, "Nama wajib diisi").max(100),
})

export const RegisterCreatorSchema = z.object({
  username: UsernameSchema,
  displayName: z.string().min(1).max(100),
})

export const UpdateMicrositeSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
})
