'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'

export default function TestPage() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function test() {
      setStatus('Probando conexión a Supabase...')
      try {
        const sb = getSupabase()
        setStatus('Cliente Supabase creado. Probando consulta...')
        const { count, error: err } = await sb
          .from('sessions')
          .select('count', { count: 'exact', head: true })
        if (err) {
          setError(`Error en consulta: ${err.message}`)
        } else {
          setStatus(`Conexión exitosa. Sesiones: ${count}`)
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido'
        setError(msg)
      }
    }
    test()
  }, [])

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Test de conexión</h1>
      {status && <p className="text-blue-600">{status}</p>}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
          <p className="font-bold">Error:</p>
          <p className="text-sm font-mono mt-1">{error}</p>
        </div>
      )}
    </main>
  )
}
