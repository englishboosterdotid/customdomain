"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp } from "@/lib/auth/client"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    setError(null)
    const { error } = await signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    })
    setLoading(false)
    if (error) {
      setError(error.message ?? "Pendaftaran gagal")
    } else {
      router.push("/register/creator")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Daftar</h1>
          <p className="text-sm text-gray-400 mt-1">Buat akun Toeflynk kamu</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {(["name", "email", "password"] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {field === "name" ? "Nama Lengkap" : field === "email" ? "Email" : "Password"}
              </label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              />
            </div>
          ))}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Mendaftar..." : "Buat Akun"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-indigo-500 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
