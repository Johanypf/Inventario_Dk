'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Session } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const [employeeName, setEmployeeName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessionPin, setSessionPin] = useState('1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [joinPin, setJoinPin] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dk_employee_name')
    if (saved) setEmployeeName(saved)
    loadSessions()
  }, [])

  useEffect(() => {
    if (employeeName) localStorage.setItem('dk_employee_name', employeeName)
  }, [employeeName])

  async function loadSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (data) setSessions(data)
  }

  async function handleCreateSession() {
    if (!employeeName.trim()) return setError('Ingresa tu nombre')
    if (!sessionName.trim()) return setError('Ingresa un nombre para la sesión')
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('sessions')
      .insert({ name: sessionName, pin: sessionPin })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (data) {
      localStorage.setItem('dk_session_id', data.id)
      localStorage.setItem('dk_employee_name', employeeName)
      router.push(`/inventory/${data.id}`)
    }
    setLoading(false)
  }

  async function handleJoinSession() {
    if (!employeeName.trim()) return setError('Ingresa tu nombre')
    if (!joinPin.trim()) return setError('Ingresa el PIN de la sesión')
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
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
    setLoading(false)
  }

  return (
    <main className="flex-1 p-4 max-w-lg mx-auto w-full pt-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Inventario DK</h1>
        <p className="text-gray-500 mt-1">Gestión de inventario con escáner</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tu nombre
        </label>
        <input
          type="text"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          placeholder="Ej: Juan"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
        />
      </div>

      {!showCreate ? (
        <div className="space-y-3">
          <button
            onClick={() => { setShowCreate(true); setShowPinInput(false) }}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-md active:scale-[0.98] transition-all hover:bg-blue-700"
          >
            + Nueva Sesión
          </button>
          <button
            onClick={() => { setShowPinInput(true); setShowCreate(false) }}
            className="w-full py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg border-2 border-blue-200 active:scale-[0.98] transition-all hover:bg-blue-50"
          >
            Unirse a Sesión
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold mb-4">Nueva Sesión</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la sesión
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ej: Inventario Julio 2026"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN de acceso
              </label>
              <input
                type="text"
                value={sessionPin}
                onChange={(e) => setSessionPin(e.target.value)}
                placeholder="1234"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-center text-xl tracking-widest"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-medium active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPinInput && (
        <div className="bg-white rounded-xl shadow-md p-5 mt-4">
          <h2 className="text-lg font-bold mb-4">Unirse a Sesión</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN de la sesión
              </label>
              <input
                type="text"
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value)}
                placeholder="1234"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-center text-xl tracking-widest"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPinInput(false)}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-medium active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                onClick={handleJoinSession}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Unirse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Sesiones activas
          </h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-sm text-gray-500">
                    PIN: <span className="font-mono">{s.pin}</span>
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Activa
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <a
          href="/admin"
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Panel de Administración
        </a>
      </div>
    </main>
  )
}
