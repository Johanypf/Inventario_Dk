'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { getSupabase } from '@/lib/supabase'
import type { Session, CountWithProduct } from '@/lib/types'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [newSessionPin, setNewSessionPin] = useState('1234')
  const [creatingSession, setCreatingSession] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [counts, setCounts] = useState<CountWithProduct[]>([])
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ ok: number; errors: string[] } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [tab, setTab] = useState<'catalog' | 'export'>('catalog')

  const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || 'admin123'

  useEffect(() => {
    const stored = sessionStorage.getItem('dk_admin_auth')
    if (stored === 'true') {
      setAuthenticated(true)
      loadSessions()
    }
  }, [])

  function handleLogin() {
    if (adminPin === ADMIN_PIN) {
      setAuthenticated(true)
      setPinError(false)
      sessionStorage.setItem('dk_admin_auth', 'true')
      loadSessions()
    } else {
      setPinError(true)
    }
  }

  if (!authenticated) {
    return (
      <main className="flex-1 p-4 max-w-lg mx-auto w-full flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Administración</h1>
            <p className="text-sm text-gray-500 mt-1">Ingresa el PIN de administrador</p>
          </div>
          <input
            type="password"
            value={adminPin}
            onChange={(e) => { setAdminPin(e.target.value); setPinError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="PIN"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-center text-xl tracking-widest mb-3"
            autoFocus
          />
          {pinError && <p className="text-red-500 text-sm text-center mb-3">PIN incorrecto</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold active:scale-[0.98]"
          >
            Ingresar
          </button>
          <a href="/" className="block text-center text-sm text-gray-400 mt-4 underline">Volver al inicio</a>
        </div>
      </main>
    )
  }

  async function handleCreateSession() {
    if (!newSessionName.trim()) return
    setCreatingSession(true)
    try {
      const { error } = await getSupabase().from('sessions')
        .insert({ name: newSessionName, pin: newSessionPin })
      if (!error) {
        setNewSessionName('')
        setNewSessionPin('1234')
        setShowCreateSession(false)
        loadSessions()
      }
    } catch (e) {
      console.error('Error creando sesión:', e)
    }
    setCreatingSession(false)
  }

  async function loadSessions() {
    try {
      const { data } = await getSupabase().from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setSessions(data)
    } catch (e) {
      console.error('Error cargando sesiones:', e)
    }
  }

  async function loadCounts(sessionId: string) {
    try {
      const { data } = await getSupabase().from('counts')
        .select('*, products(*)')
        .eq('session_id', sessionId)
        .order('updated_at', { ascending: false })

      if (data) setCounts(data as unknown as CountWithProduct[])
    } catch (e) {
      console.error('Error cargando conteos:', e)
    }
  }

  function parseRow(raw: unknown[]): { code: string; barcode: string; description: string } | null {
    let cells = raw.map((c) => String(c ?? '').trim().replace(/^"|"$/g, '')).filter(Boolean)

    if (cells.length === 0) return null

    const first = cells[0]
    if (first.includes('\t') || first.includes(';') || first.includes(',')) {
      const split = first.split(/[;\t,]+/).map((s) => s.trim()).filter(Boolean)
      if (split.length >= 2) cells = split
    }

    if (cells.length < 2) return null

    return {
      code: cells[0],
      barcode: cells.length >= 3 ? cells[1] : '',
      description: cells[cells.length - 1],
    }
  }

  function parseRows(rows: unknown[][]): { code: string; barcode: string; description: string }[] {
    return rows.map(parseRow).filter((r): r is NonNullable<typeof r> => r !== null)
  }

  function parseCSV(text: string): { code: string; barcode: string; description: string }[] {
    const lines = text.split('\n').filter((l) => l.trim())
    return parseRows(lines.map((l) => {
      const parts = l.includes('\t') ? l.split('\t') : l.split(',')
      return parts.map((p) => p.trim().replace(/^"|"$/g, ''))
    }))
  }

  function parseExcel(data: ArrayBuffer): { code: string; barcode: string; description: string }[] {
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
    const headerIndex = rows.findIndex((r) => {
      const vals = r.map(String)
      return vals.some((v) => /c(o|ó)digo/i.test(v)) || vals.some((v) => /descripci(o|ó)n/i.test(v))
    })
    const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows
    return parseRows(dataRows)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    let products: { code: string; barcode: string; description: string }[]

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer()
      products = parseExcel(buffer)
    } else {
      const text = await file.text()
      products = parseCSV(text)
    }
    const errors: string[] = []
    let ok = 0
    const chunkSize = 500
    const data = products.map((p) => ({
      code: p.code,
      barcode: p.barcode || null,
      description: p.description,
    }))

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const { error } = await getSupabase().from('products').upsert(chunk, { onConflict: 'code' })
      if (error) {
        errors.push(`Lote ${i / chunkSize + 1}: ${error.message}`)
      } else {
        ok += chunk.length
      }
    }

    setUploadResult({ ok, errors })
    setUploading(false)
  }

  function handleSelectSession(session: Session) {
    setSelectedSession(session)
    loadCounts(session.id)
  }

  function generateTXT(): string {
    const lines = counts.map((c) => {
      const identifier = c.products?.barcode || c.products?.code || ''
      return `${identifier}\t${c.quantity}`
    })
    return lines.join('\n')
  }

  function handleExport() {
    setExporting(true)
    const txt = generateTXT()
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventario_${selectedSession?.name?.replace(/\s+/g, '_') || 'export'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function handleEndSession() {
    if (!selectedSession) return
    const confirmed = confirm('¿Finalizar la sesión? Ya no se podrán agregar más conteos.')
    if (!confirmed) return

    try {
      await getSupabase().from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', selectedSession.id)

      loadSessions()
      setSelectedSession(null)
      setCounts([])
    } catch (e) {
      console.error('Error finalizando sesión:', e)
    }
  }

  return (
    <main className="flex-1 p-4 max-w-lg mx-auto w-full pt-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <a href="/" className="text-gray-500 p-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-xl font-bold text-gray-900">Administración</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem('dk_admin_auth')
            router.push('/')
          }}
          className="text-red-500 text-sm font-medium"
        >
          Salir
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6 border border-gray-200">
        <button
          onClick={() => setTab('catalog')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'catalog' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
          }`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab('export')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'export' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
          }`}
        >
          Exportar
        </button>
      </div>

      {tab === 'catalog' && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold mb-2">Subir Catálogo de Productos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sube el archivo exportado de tu POS (CSV o TXT con columnas: código, código de barras, descripción).
          </p>

          <label className="block">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">
                {uploading ? 'Subiendo...' : 'Toca para seleccionar archivo'}
              </p>
              <p className="text-xs text-gray-400 mt-1">CSV, TXT, Excel</p>
            </div>
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {uploadResult && (
            <div className="mt-4 p-3 rounded-xl bg-gray-50">
              <p className="text-sm font-medium text-green-700">
                ✓ {uploadResult.ok} productos importados
              </p>
              {uploadResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-red-600">
                    {uploadResult.errors.length} errores:
                  </p>
                  <ul className="text-xs text-red-500 mt-1 max-h-32 overflow-y-auto">
                    {uploadResult.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <a
              href="/plantilla_ejemplo.txt"
              download
              className="text-sm text-blue-600 underline"
            >
              Descargar plantilla de ejemplo
            </a>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div>
          {/* Create Session */}
          <div className="mb-4">
            {!showCreateSession ? (
              <button
                onClick={() => setShowCreateSession(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-sm active:scale-[0.98]"
              >
                + Nueva Sesión
              </button>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-4 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3">Crear Sesión</h3>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Nombre de la sesión"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none mb-2"
                />
                <input
                  type="text"
                  value={newSessionPin}
                  onChange={(e) => setNewSessionPin(e.target.value)}
                  placeholder="PIN"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-center text-xl tracking-widest mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateSession(false)}
                    className="flex-1 py-3 bg-gray-100 rounded-xl font-medium active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={creatingSession || !newSessionName.trim()}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 active:scale-[0.98]"
                  >
                    {creatingSession ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sessions list */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sesiones
            </h2>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => handleSelectSession(s)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(s.created_at).toLocaleDateString()} {s.status === 'completed' ? '✓ Finalizada' : '● Activa'}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.status === 'active' ? 'Activa' : 'Completada'}
                      </span>
                    </div>
                  </button>
                  <div className="px-4 pb-3 flex gap-2">
                    {s.status === 'active' ? (
                      <button
                        onClick={async () => {
                          if (confirm(`¿Finalizar la sesión "${s.name}"?`)) {
                            await getSupabase().from('sessions')
                              .update({ status: 'completed', completed_at: new Date().toISOString() })
                              .eq('id', s.id)
                            loadSessions()
                          }
                        }}
                        className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium active:scale-[0.98]"
                      >
                        Finalizar
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (confirm(`¿Eliminar la sesión "${s.name}" y todos sus datos?`)) {
                            await getSupabase().from('sessions').delete().eq('id', s.id)
                            loadSessions()
                          }
                        }}
                        className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:scale-[0.98]"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay sesiones creadas
                </p>
              )}
            </div>
          </div>

          {/* Export section */}
          {selectedSession && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{selectedSession.name}</h3>
                <span className="text-sm text-gray-500">
                  {counts.length} productos contados
                </span>
              </div>

              {counts.length > 0 && (
                <div className="max-h-48 overflow-y-auto mb-4 border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {counts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 text-sm">
                      <span className="text-gray-700 truncate flex-1">
                        {c.products?.description || 'Desconocido'}
                      </span>
                      <span className="font-bold text-blue-600 ml-2">x{c.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={exporting || counts.length === 0}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 active:scale-[0.98]"
                >
                  {exporting ? 'Generando...' : 'Exportar TXT'}
                </button>
                {selectedSession.status === 'active' && (
                  <button
                    onClick={handleEndSession}
                    className="py-3 px-4 bg-red-50 text-red-600 rounded-xl font-medium active:scale-[0.98]"
                  >
                    Finalizar
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center">
                El TXT se genera con formato: código de barras + TAB + cantidad
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
