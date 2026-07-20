'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [employeeName, setEmployeeName] = useState('')
  const [joinPin, setJoinPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dk_employee_name')
    if (saved) setEmployeeName(saved)
  }, [])

  useEffect(() => {
    if (employeeName) localStorage.setItem('dk_employee_name', employeeName)
  }, [employeeName])

  async function handleJoinSession() {
    if (!employeeName.trim()) return setError('Ingresa tu nombre')
    if (!joinPin.trim()) return setError('Ingresa el PIN de la sesión')
    setLoading(true)
    setError('')

    try {
      const { data, error: err } = await getSupabase()
        .from('sessions')
        .select('*')
        .eq('pin', joinPin)
        .eq('status', 'active')
        .single()

      if (err || !data) {
        setError('Sesión no encontrada o PIN incorrecto')
        setLoading(false)
        return
      }

      localStorage.setItem('dk_session_id', data.id)
      localStorage.setItem('dk_employee_name', employeeName)
      router.push(`/inventory/${data.id}`)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    }
    setLoading(false)
  }

  return (
    <main className="flex-1 p-4 max-w-lg mx-auto w-full flex items-center justify-center min-h-[80vh]">
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario DK</h1>
          <p className="text-gray-500 mt-1">Ingresa el PIN de la sesión para comenzar</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tu nombre
          </label>
          <input
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Nombre"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PIN de la sesión
          </label>
          <input
            type="text"
            value={joinPin}
            onChange={(e) => { setJoinPin(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
            placeholder="PIN"
            maxLength={6}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-center text-2xl tracking-widest mb-4"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
          <button
            onClick={handleJoinSession}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Unirse a Sesión'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/admin"
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Panel de Administración
          </a>
        </div>
      </div>
    </main>
  )
}
